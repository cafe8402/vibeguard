import JSZip from 'jszip';
import { scanArtifacts } from '../src/utils/scannerEngine';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function run() {
  const web = new File([
    `const apiKey = "${'sk-' + 'proj-' + 'abcdefghijklmnopqrstuvwxyz123456'}";\nfetch("http://outside.example/api");\n`,
  ], 'app.js', { type: 'text/javascript' });
  const webResult = await scanArtifacts([web], 'external');
  assert(webResult.issues.some((issue) => issue.ruleId === 'SECRET_API_KEY'), 'API Key rule did not fire');
  assert(webResult.issues.some((issue) => issue.ruleId === 'NETWORK_HTTP'), 'HTTP rule did not fire');
  const apiKeyIssue = webResult.issues.find((issue) => issue.ruleId === 'SECRET_API_KEY');
  assert(apiKeyIssue?.evidence?.includes('[REDACTED_API_KEY]'), 'API Key evidence was not redacted');
  assert(!apiKeyIssue?.codeSnippet.lines.some((line) => line.code.includes('sk-proj-')), 'API Key remained in the code snippet');

  const script = new File([
    `powershell.exe -EncodedCommand SQBFAFgA\r\nreg add HKLM\\Software\\Demo /v Enabled /d 1\r\n`,
  ], 'install.bat', { type: 'text/plain' });
  const scriptResult = await scanArtifacts([script], 'internal');
  assert(scriptResult.issues.some((issue) => issue.ruleId === 'SCRIPT_ENCODED_COMMAND'), 'Encoded PowerShell rule did not fire');
  assert(scriptResult.issues.some((issue) => issue.ruleId === 'SCRIPT_SYSTEM_CHANGE'), 'System change rule did not fire');

  const extensionZip = new JSZip();
  extensionZip.file('manifest.json', JSON.stringify({
    manifest_version: 3,
    name: 'Demo Extension',
    version: '1.0.0',
    permissions: ['cookies'],
    host_permissions: ['<all_urls>'],
  }, null, 2));
  extensionZip.file('background.js', 'const ready = true;');
  const extensionBlob = await extensionZip.generateAsync({ type: 'uint8array' });
  const extension = new File([extensionBlob], 'extension.zip', { type: 'application/zip' });
  const extensionResult = await scanArtifacts([extension], 'internal');
  assert(extensionResult.issues.some((issue) => issue.ruleId === 'EXT_ALL_URLS'), 'Broad extension permission rule did not fire');
  assert(extensionResult.issues.some((issue) => issue.ruleId === 'EXT_SENSITIVE_PERMISSION'), 'Sensitive extension permission rule did not fire');

  const mixedZip = new JSZip();
  mixedZip.file('node_modules/vendor/index.js', 'eval(userInput);');
  mixedZip.file('dist/bundle.js', 'eval(userInput);');
  mixedZip.file('tests/security.test.js', 'const token = "dummy_token_for_test_only";\npowershell.exe -EncodedCommand SQBFAFgA;');
  mixedZip.file('tests/secret.test.js', `const apiKey = "${'sk-' + 'proj-' + 'abcdefghijklmnopqrstuvwxyz123456'}";`);
  mixedZip.file('src/app.js', 'const ready = true;');
  const mixedBlob = await mixedZip.generateAsync({ type: 'uint8array' });
  const mixed = new File([mixedBlob], 'mixed-project.zip', { type: 'application/zip' });
  const mixedResult = await scanArtifacts([mixed], 'internal');
  assert(mixedResult.ignoredFiles === 2, 'Generated and dependency files were not ignored');
  const contextualCommand = mixedResult.issues.find((issue) => issue.ruleId === 'SCRIPT_ENCODED_COMMAND');
  assert(!contextualCommand, 'Inert test command string was not excluded');
  assert(!mixedResult.issues.some((issue) => issue.ruleId === 'SECRET_CREDENTIAL'), 'Obvious placeholder credential produced an issue');
  const realTestSecret = mixedResult.issues.find((issue) => issue.ruleId === 'SECRET_API_KEY');
  assert(realTestSecret?.sourceContext === 'test' && realTestSecret.severity === 'critical', 'Real-looking secret in tests must remain actionable');

  const falsePositiveZip = new JSZip();
  falsePositiveZip.file('tests/rules.test.ts', `
    const content = 'powershell -ExecutionPolicy Bypass -EncodedCommand SQBFAFgA';
    const secret = '[REDACTED]';
    const password = 'test1234';
    return /\\b(?:fetch|axios|get|curl|Invoke-WebRequest)/i.test(content);
  `);
  falsePositiveZip.file('src/rules.ts', `const encodedRule = /-EncodedCommand/i; const commandRule = 'cmd.exe /c %USER_COMMAND%';`);
  falsePositiveZip.file('src/imports.ts', `import child_process from 'child_process';`);
  falsePositiveZip.file('package.json', JSON.stringify({ scripts: { clean: 'rm -rf dist server.js' } }));
  falsePositiveZip.file('src/safe-html.ts', `element.innerHTML = '<b>Hello</b>'; element.innerHTML = DOMPurify.sanitize(userInput);`);
  falsePositiveZip.file('src/network.ts', `// documentation: http://outside.example/api\nfetch('http://localhost:3005/api');\nfetch('/api/user');`);
  falsePositiveZip.file('src/slack.ts', `return fetch('https://hooks.slack.com/services/EXAMPLE/ONLY/NOT-VALID', { method: 'POST' });`);
  const falsePositiveBlob = await falsePositiveZip.generateAsync({ type: 'uint8array' });
  const falsePositiveResult = await scanArtifacts([new File([falsePositiveBlob], 'false-positive.zip')], 'internal');
  assert(!falsePositiveResult.issues.some((issue) => issue.ruleId === 'SCRIPT_ENCODED_COMMAND'), 'Test/rule EncodedCommand string produced an issue');
  assert(!falsePositiveResult.issues.some((issue) => issue.ruleId === 'SECRET_CREDENTIAL'), 'Redacted/test credential produced an issue');
  assert(!falsePositiveResult.issues.some((issue) => issue.ruleId === 'SCRIPT_COMMAND_INJECTION'), 'child_process import produced command execution issue');
  assert(!falsePositiveResult.issues.some((issue) => issue.ruleId === 'SCRIPT_DESTRUCTIVE_DELETE'), 'Safe clean path produced destructive-delete issue');
  assert(!falsePositiveResult.issues.some((issue) => issue.ruleId === 'DANGEROUS_XSS'), 'Static or sanitized HTML produced XSS issue');
  assert(!falsePositiveResult.issues.some((issue) => issue.ruleId === 'NETWORK_HTTP'), 'Comment/localhost HTTP produced an issue');
  assert(!falsePositiveResult.issues.some((issue) => issue.ruleId === 'SECRET_SLACK_WEBHOOK'), 'Placeholder Slack webhook produced a secret issue');

  const realRisksZip = new JSZip();
  realRisksZip.file('scripts/run.bat', `set /p USER_COMMAND=Command:\r\ncmd.exe /c %USER_COMMAND%`);
  realRisksZip.file('src/command.ts', 'exec(`rm -rf ${req.body.path}`);');
  realRisksZip.file('src/xss.ts', 'element.innerHTML = req.body.content;');
  realRisksZip.file('src/powershell.ts', `exec('powershell.exe -ExecutionPolicy Bypass -EncodedCommand SQBFAFgA');`);
  realRisksZip.file('src/credential.ts', 'const apiKey = "A9v!mQ2#zL8@pR4$xT7&nK5";');
  const realRisksBlob = await realRisksZip.generateAsync({ type: 'uint8array' });
  const realRisksResult = await scanArtifacts([new File([realRisksBlob], 'real-risks.zip')], 'internal');
  assert(realRisksResult.issues.some((issue) => issue.ruleId === 'SCRIPT_COMMAND_INJECTION' && issue.severity === 'high' && issue.codeSnippet.filename === 'scripts/run.bat'), 'User input to cmd.exe was not High');
  assert(realRisksResult.issues.some((issue) => issue.ruleId === 'SCRIPT_DESTRUCTIVE_DELETE' && issue.severity === 'high'), 'req.body to recursive delete was not High');
  assert(realRisksResult.issues.some((issue) => issue.ruleId === 'DANGEROUS_XSS' && issue.severity === 'high'), 'req.body to innerHTML was not High');
  assert(realRisksResult.issues.some((issue) => issue.ruleId === 'SCRIPT_ENCODED_COMMAND' && issue.severity === 'critical'), 'Executed EncodedCommand was not detected');
  assert(realRisksResult.issues.some((issue) => issue.ruleId === 'SECRET_CREDENTIAL' && issue.severity === 'critical'), 'Real-looking generic credential was not detected');

  const reviewCases = new File(['cmd.exe /c %UNKNOWN_COMMAND%\r\nrm -rf "$TARGET"\r\nelement.innerHTML = content;'], 'review.bat', { type: 'text/plain' });
  const reviewResult = await scanArtifacts([reviewCases], 'internal');
  assert(reviewResult.issues.some((issue) => issue.ruleId === 'SCRIPT_COMMAND_INJECTION' && issue.severity === 'medium'), 'Unknown command source was not marked for review');
  assert(reviewResult.issues.some((issue) => issue.ruleId === 'SCRIPT_DESTRUCTIVE_DELETE' && issue.severity === 'medium'), 'Variable delete target was not marked for review');

  const fetchOnly = new File([`const data = await fetch('https://api.example.com/users');`], 'fetch-only.ts', { type: 'text/typescript' });
  const fetchOnlyResult = await scanArtifacts([fetchOnly], 'internal');
  assert(!fetchOnlyResult.issues.some((issue) => issue.ruleId === 'SCRIPT_DOWNLOAD_EXECUTE'), 'Simple API fetch was mislabeled as download-and-execute');

  const env = new File(['PUBLIC_URL=https://intranet.example\nAPP_MODE=internal\nFEATURE_FLAG=true\n'], '.env', { type: 'text/plain' });
  const envResult = await scanArtifacts([env], 'internal');
  assert(envResult.issues.filter((issue) => issue.ruleId === 'ENV_INCLUDED').length === 1, '.env should create one file-level warning');

  const clean = new File(['const greeting = "hello";\nconsole.log(greeting);\n'], 'clean.ts', { type: 'text/typescript' });
  const cleanResult = await scanArtifacts([clean], 'personal');
  assert(cleanResult.issues.length === 0, 'Clean file produced an unexpected issue');

  const large = new File([`// large benign fixture\nconst payload = "${'a'.repeat(12 * 1024 * 1024)}";`], 'large.js', { type: 'text/javascript' });
  const startedAt = performance.now();
  const largeResult = await scanArtifacts([large], 'internal');
  const elapsedMs = Math.round(performance.now() - startedAt);
  assert(largeResult.scannedFiles === 1 && largeResult.issues.length === 0, 'Large file scan failed');

  console.log(`Scanner checks passed: web=${webResult.issues.length}, script=${scriptResult.issues.length}, extension=${extensionResult.issues.length}, false-positive=${falsePositiveResult.issues.length}, real-risk=${realRisksResult.issues.length}, review=${reviewResult.issues.length}, env=${envResult.issues.length}, clean=0, large=12MB/${elapsedMs}ms`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

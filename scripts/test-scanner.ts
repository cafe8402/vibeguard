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
  assert(contextualCommand?.sourceContext === 'test' && contextualCommand.severity === 'low', 'Test command was not downgraded to a reference');
  assert(!mixedResult.issues.some((issue) => issue.ruleId === 'SECRET_CREDENTIAL'), 'Obvious placeholder credential produced an issue');
  const realTestSecret = mixedResult.issues.find((issue) => issue.ruleId === 'SECRET_API_KEY');
  assert(realTestSecret?.sourceContext === 'test' && realTestSecret.severity === 'critical', 'Real-looking secret in tests must remain actionable');

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

  console.log(`Scanner checks passed: web=${webResult.issues.length}, script=${scriptResult.issues.length}, extension=${extensionResult.issues.length}, mixed=${mixedResult.issues.length}/ignored=${mixedResult.ignoredFiles}, env=${envResult.issues.length}, clean=0, large=12MB/${elapsedMs}ms`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

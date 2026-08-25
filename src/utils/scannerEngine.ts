import JSZip from 'jszip';
import { Category, SecurityIssue, Severity, SourceContext } from '../types';

export type ArtifactUsage = 'personal' | 'internal' | 'external';

export interface ScanResult {
  filename: string;
  totalFiles: number;
  scannedFiles: number;
  completedFiles: number;
  skippedFiles: number;
  ignoredFiles: number;
  contextualIssues: number;
  score: number;
  issues: SecurityIssue[];
  topActions: SecurityIssue[];
  detectedTypes: string[];
  usage: ArtifactUsage;
  coverageText: string;
  overallConfidence: 'high' | 'medium' | 'low';
}

interface ReadableArtifact {
  name: string;
  content: string;
}

const SUPPORTED_EXTENSIONS = [
  '.html', '.htm', '.js', '.jsx', '.ts', '.tsx', '.json', '.css',
  '.env', '.bat', '.cmd', '.ps1', '.yml', '.yaml',
];

const IGNORED_PATH_SEGMENTS = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.nuxt',
  'out', 'vendor', 'target', '__pycache__', '.cache', '.turbo',
]);

const IGNORED_FILENAMES = new Set([
  'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lock',
]);

const severityWeight: Record<Severity, number> = {
  critical: 22,
  high: 12,
  medium: 6,
  low: 2,
  safe: 0,
};

let issueSequence = 0;

export async function scanArtifacts(
  inputFiles: FileList | File[],
  usage: ArtifactUsage = 'internal',
): Promise<ScanResult> {
  const files = Array.from(inputFiles);
  const readable: ReadableArtifact[] = [];
  let discoveredFiles = 0;
  let skippedFiles = 0;
  let ignoredFiles = 0;

  for (const file of files) {
    if (file.name.toLowerCase().endsWith('.zip')) {
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const entries = Object.values(zip.files).filter((entry) => !entry.dir);
      discoveredFiles += entries.length;

      for (const entry of entries) {
        if (shouldIgnorePath(entry.name)) {
          ignoredFiles += 1;
          continue;
        }
        if (!isReadableCode(entry.name)) {
          skippedFiles += 1;
          continue;
        }
        try {
          readable.push({ name: entry.name, content: await entry.async('text') });
        } catch {
          skippedFiles += 1;
        }
      }
      continue;
    }

    discoveredFiles += 1;
    const relativeName = file.webkitRelativePath || file.name;
    if (shouldIgnorePath(relativeName)) {
      ignoredFiles += 1;
      continue;
    }
    if (!isReadableCode(file.name)) {
      skippedFiles += 1;
      continue;
    }
    readable.push({ name: relativeName, content: await file.text() });
  }

  if (readable.length === 0) {
    throw new Error('SUPPORTED_FILE_NOT_FOUND');
  }

  issueSequence = 0;
  const issues = readable.flatMap((artifact) => analyzeArtifact(artifact, usage));
  const deduped = dedupeIssues(issues).sort(
    (a, b) => severityWeight[b.severity] - severityWeight[a.severity],
  );

  const scorePenalty = deduped.reduce((sum, issue) => {
    if (!isScoreRelevant(issue)) return sum;
    const usageMultiplier = usage === 'external' ? 1.15 : usage === 'internal' ? 1 : 0.85;
    const confidenceMultiplier = issue.confidence === 'low' ? 0.6 : issue.confidence === 'medium' ? 0.85 : 1;
    return sum + severityWeight[issue.severity] * usageMultiplier * confidenceMultiplier;
  }, 0);
  const score = Math.max(18, Math.min(96, Math.round(96 - scorePenalty)));
  const detectedTypes = [...new Set(readable.map(({ name }) => classifyType(name)))];
  const highConfidenceCount = deduped.filter((issue) => issue.confidence === 'high').length;
  const contextualIssues = deduped.filter((issue) => issue.sourceContext && issue.sourceContext !== 'runtime').length;

  return {
    filename: files.length === 1 ? files[0].name : `${files.length}개 파일`,
    totalFiles: Math.max(discoveredFiles, readable.length),
    scannedFiles: readable.length,
    completedFiles: readable.length,
    skippedFiles,
    ignoredFiles,
    contextualIssues,
    score,
    issues: deduped,
    topActions: deduped.filter((issue) => issue.severity !== 'low' && isScoreRelevant(issue)).slice(0, 3),
    detectedTypes,
    usage,
    coverageText: `읽을 수 있는 코드 ${readable.length}개 분석${ignoredFiles ? ` · 외부 라이브러리·빌드 파일 ${ignoredFiles}개 제외` : ''}${skippedFiles ? ` · 분석 대상이 아닌 파일 ${skippedFiles}개 제외` : ''}`,
    overallConfidence: deduped.length === 0 ? 'medium' : highConfidenceCount >= Math.ceil(deduped.length / 2) ? 'high' : 'medium',
  };
}

/** 기존 화면과 외부 호출 호환용 단일 파일 진입점 */
export async function scanUploadedZip(file: File): Promise<ScanResult> {
  return scanArtifacts([file], 'internal');
}

function isReadableCode(filename: string) {
  const lower = filename.toLowerCase();
  const base = lower.split('/').pop() || lower;
  return SUPPORTED_EXTENSIONS.some((extension) => lower.endsWith(extension)) || base.startsWith('.env');
}

function shouldIgnorePath(filename: string) {
  const normalized = filename.replace(/\\/g, '/').toLowerCase();
  const parts = normalized.split('/').filter(Boolean);
  const base = parts[parts.length - 1] || '';
  return parts.some((part) => IGNORED_PATH_SEGMENTS.has(part))
    || IGNORED_FILENAMES.has(base)
    || /\.min\.(js|css)$/.test(base)
    || base.endsWith('.map');
}

function classifySourceContext(filename: string): SourceContext {
  const normalized = filename.replace(/\\/g, '/').toLowerCase();
  const parts = normalized.split('/').filter(Boolean);
  const base = parts[parts.length - 1] || '';
  if (parts.some((part) => ['test', 'tests', '__tests__', 'spec', 'specs'].includes(part)) || /(^|[._-])(test|spec)([._-]|$)/.test(base)) return 'test';
  if (parts.some((part) => ['fixture', 'fixtures', 'qa-fixtures', 'example', 'examples', 'sample', 'samples', 'demo', 'demos', 'mock', 'mocks'].includes(part)) || /^(mock|sample|example|demo)/.test(base)) return 'example';
  if (parts.some((part) => ['doc', 'docs', 'documentation'].includes(part)) || /\.(md|mdx)$/.test(base)) return 'documentation';
  if (/(scanner|security[-_]?rules?|audit[-_]?rules?)/.test(base)) return 'tooling';
  return 'runtime';
}

function classifyType(filename: string) {
  const lower = filename.toLowerCase();
  if (/\.(bat|cmd|ps1)$/.test(lower)) return 'Windows 스크립트';
  if (lower.endsWith('manifest.json')) return '브라우저 확장 프로그램';
  if (/\.(html|htm|css)$/.test(lower)) return '웹 화면';
  if (/\.(js|jsx|ts|tsx)$/.test(lower)) return '웹·앱 코드';
  if (lower.includes('.env')) return '환경 설정';
  return '프로젝트 설정';
}

function analyzeArtifact(artifact: ReadableArtifact, usage: ArtifactUsage) {
  const lower = artifact.name.toLowerCase();
  const lines = artifact.content.split(/\r?\n/);
  const issues: SecurityIssue[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    if (/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(line)) {
      issues.push(createIssue({ ruleId: 'SECRET_PRIVATE_KEY', title: 'Private Key가 파일에 포함되어 있습니다', technicalTitle: 'Embedded private key', severity: 'critical', confidence: 'high', category: 'secret', artifact, lines, lineNumber, explanation: '이 키를 가진 사람은 서버나 서비스에 본인인 것처럼 접근할 수 있습니다.', recommendation: '키를 즉시 폐기하고 새로 발급한 뒤, 코드 밖의 비밀 저장소에서 관리하세요.' }));
    }

    const apiKeyCandidate = line.match(/(sk-(proj-)?[a-zA-Z0-9_-]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,})/)?.[0];
    if (apiKeyCandidate && !isObviousPlaceholder(apiKeyCandidate)) {
      issues.push(createIssue({ ruleId: 'SECRET_API_KEY', title: 'API Key가 코드에 포함되어 있습니다', technicalTitle: 'Hardcoded API key', severity: 'critical', confidence: 'high', category: 'secret', artifact, lines, lineNumber, explanation: '파일을 전달받은 사람이 이 키를 복사해 서비스를 사용하거나 비용을 발생시킬 수 있습니다.', recommendation: '노출된 키를 폐기하고 환경 변수나 회사의 비밀 저장소로 옮기세요.' }));
    }

    const credentialMatch = line.match(/\b(password|passwd|admin_password|db_password|secret|token)\b\s*[:=]\s*["']([^"']{5,})["']/i);
    if (credentialMatch && !isObviousPlaceholder(credentialMatch[2]) && !/process\.env|import\.meta\.env|os\.environ/i.test(line)) {
      issues.push(createIssue({ ruleId: 'SECRET_CREDENTIAL', title: '비밀번호 또는 토큰이 코드에 직접 적혀 있습니다', technicalTitle: 'Hardcoded credential', severity: 'critical', confidence: 'high', category: 'credential', artifact, lines, lineNumber, explanation: '코드를 열어보는 사람은 누구나 이 값을 확인하고 악용할 수 있습니다.', recommendation: '값을 코드에서 제거하고 환경 변수로 불러오도록 변경하세요.' }));
    }

    if (/\beval\s*\(|dangerouslySetInnerHTML|\.innerHTML\s*=/.test(line)) {
      issues.push(createIssue({ ruleId: 'DANGEROUS_DYNAMIC_CODE', title: '외부 입력이 코드로 실행될 가능성이 있습니다', technicalTitle: 'Dynamic code execution / XSS sink', severity: 'high', confidence: 'medium', category: 'dangerous', artifact, lines, lineNumber, explanation: '검증되지 않은 값이 들어오면 화면 변조나 정보 탈취로 이어질 수 있습니다.', recommendation: '문자열을 코드나 HTML로 직접 실행하지 말고 안전한 렌더링 방식을 사용하세요.' }));
    }

    if (/\b(fetch|axios\.(get|post|put|patch)|WebSocket)\s*\(\s*[`"']http:\/\//i.test(line)) {
      issues.push(createIssue({ ruleId: 'NETWORK_HTTP', title: '정보를 암호화하지 않은 주소로 전송합니다', technicalTitle: 'Insecure HTTP communication', severity: 'high', confidence: 'high', category: 'network', artifact, lines, lineNumber, explanation: 'HTTP 통신은 전송 중인 내용을 다른 사람이 가로볼 수 있습니다.', recommendation: '대상 서버가 HTTPS를 지원하는지 확인하고 주소를 HTTPS로 변경하세요.' }));
    } else if (/\b(fetch|axios\.(get|post|put|patch)|WebSocket)\s*\(\s*[`"']https?:\/\//i.test(line)) {
      issues.push(createIssue({ ruleId: 'NETWORK_EXTERNAL', title: '외부 서버와 통신하는 코드가 있습니다', technicalTitle: 'External network communication', severity: usage === 'external' ? 'medium' : 'low', confidence: 'medium', category: 'network', artifact, lines, lineNumber, explanation: '입력한 정보가 회사 밖의 서버로 전달될 수 있어 사용 목적 확인이 필요합니다.', recommendation: '표시된 주소가 회사에서 승인한 서비스인지, 어떤 정보를 보내는지 확인하세요.' }));
    }

    if (/localStorage\.(getItem|setItem).*?(admin|role|auth)|\b(isAdmin|adminRole)\b\s*=/.test(line)) {
      issues.push(createIssue({ ruleId: 'AUTH_CLIENT_SIDE', title: '관리자 권한을 브라우저에서 판단하고 있습니다', technicalTitle: 'Client-side authorization', severity: 'high', confidence: 'medium', category: 'authentication', artifact, lines, lineNumber, explanation: '브라우저의 값은 사용자가 직접 바꿀 수 있어 관리자 화면이 노출될 수 있습니다.', recommendation: '권한 확인은 서버에서 수행하고, 브라우저는 서버의 결과만 사용하도록 변경하세요.' }));
    }

    if (/(?:^|\s)-(EncodedCommand|enc|e)\b|\bpowershell(?:\.exe)?\b.*\s-(EncodedCommand|enc|e)\b/i.test(line)) {
      issues.push(createIssue({ ruleId: 'SCRIPT_ENCODED_COMMAND', title: '내용을 숨긴 PowerShell 명령을 실행합니다', technicalTitle: 'Encoded PowerShell command', severity: 'critical', confidence: 'high', category: 'dangerous', artifact, lines, lineNumber, explanation: '실행 내용을 알아보기 어렵게 만든 명령은 악성 동작을 숨길 때 자주 사용됩니다.', recommendation: '공유하거나 실행하기 전에 평문 명령으로 바꾸고 동작 목적을 확인하세요.' }));
    }

    if (/(Invoke-WebRequest|curl(?:\.exe)?|wget).*(\||&&|;).*?(Start-Process|Invoke-Expression|iex|\.exe)/i.test(line)) {
      issues.push(createIssue({ ruleId: 'SCRIPT_DOWNLOAD_EXECUTE', title: '인터넷에서 파일을 받아 바로 실행합니다', technicalTitle: 'Download and execute chain', severity: 'critical', confidence: 'high', category: 'dangerous', artifact, lines, lineNumber, explanation: '다운로드 주소가 바뀌거나 침해되면 원하지 않는 프로그램이 PC에서 실행될 수 있습니다.', recommendation: '다운로드와 실행을 분리하고, 승인된 주소와 파일 해시를 확인하도록 변경하세요.' }));
    }

    if (/\b(reg\s+add|sc\s+(create|config)|netsh\s+advfirewall|Set-ItemProperty|New-Service)\b/i.test(line)) {
      issues.push(createIssue({ ruleId: 'SCRIPT_SYSTEM_CHANGE', title: 'PC의 중요한 설정을 변경합니다', technicalTitle: 'System configuration modification', severity: 'high', confidence: 'high', category: 'dangerous', artifact, lines, lineNumber, explanation: '레지스트리, 서비스 또는 방화벽 설정을 바꾸면 PC 전체 동작에 영향을 줄 수 있습니다.', recommendation: '변경 목적과 되돌리는 방법을 확인하고, 사내 공유 전 담당자의 검토를 받으세요.' }));
    }

    if (/\b(del|erase|rmdir|rd)\b.*?[/\\]s\b|Remove-Item\b.*?-Recurse|rm\s+-rf/i.test(line)) {
      issues.push(createIssue({ ruleId: 'SCRIPT_DESTRUCTIVE_DELETE', title: '여러 파일을 한 번에 삭제하는 명령이 있습니다', technicalTitle: 'Recursive file deletion', severity: 'high', confidence: 'medium', category: 'dangerous', artifact, lines, lineNumber, explanation: '경로가 잘못 지정되면 업무 파일이나 PC 설정이 함께 삭제될 수 있습니다.', recommendation: '삭제 대상을 명확한 폴더로 제한하고 실행 전에 사용자 확인을 받도록 변경하세요.' }));
    }

    if (isSensitiveEnvFile(artifact.name) && trimmed && !trimmed.startsWith('#') && !issues.some((issue) => issue.ruleId === 'ENV_INCLUDED')) {
      issues.push(createIssue({ ruleId: 'ENV_INCLUDED', title: '환경 설정 파일이 결과물에 포함되어 있습니다', technicalTitle: 'Environment file included', severity: 'high', confidence: 'high', category: 'secret', artifact, lines, lineNumber, explanation: '환경 설정 파일에는 API Key, 비밀번호, 내부 서버 주소가 포함될 수 있습니다.', recommendation: '.env 파일을 공유 ZIP에서 제외하고 .env.example만 제공하세요.' }));
    }
  });

  if (lower.endsWith('manifest.json')) issues.push(...analyzeExtensionManifest(artifact));
  return issues;
}

function analyzeExtensionManifest(artifact: ReadableArtifact) {
  const issues: SecurityIssue[] = [];
  try {
    const manifest = JSON.parse(artifact.content);
    const permissions = [
      ...(Array.isArray(manifest.permissions) ? manifest.permissions : []),
      ...(Array.isArray(manifest.host_permissions) ? manifest.host_permissions : []),
    ];
    const broadPermission = permissions.find((value: unknown) => typeof value === 'string' && (value === '<all_urls>' || value.includes('*://*/*')));
    if (broadPermission) {
      issues.push(createIssue({ ruleId: 'EXT_ALL_URLS', title: '모든 웹사이트의 정보에 접근할 수 있습니다', technicalTitle: 'Broad extension host permission', severity: 'high', confidence: 'high', category: 'sensitive', artifact, lines: artifact.content.split(/\r?\n/), lineNumber: findLine(artifact.content, String(broadPermission)), explanation: '확장 프로그램이 방문하는 거의 모든 페이지의 내용을 읽거나 변경할 수 있습니다.', recommendation: '실제로 필요한 사이트 주소만 host_permissions에 지정하세요.' }));
    }

    const sensitivePermissions = permissions.filter((value: unknown) => ['cookies', 'debugger', 'nativeMessaging', 'webRequestBlocking'].includes(String(value)));
    if (sensitivePermissions.length) {
      const permission = String(sensitivePermissions[0]);
      issues.push(createIssue({ ruleId: 'EXT_SENSITIVE_PERMISSION', title: '민감한 브라우저 권한을 요청합니다', technicalTitle: 'Sensitive extension permission', severity: 'high', confidence: 'high', category: 'sensitive', artifact, lines: artifact.content.split(/\r?\n/), lineNumber: findLine(artifact.content, permission), explanation: `${sensitivePermissions.join(', ')} 권한은 쿠키, 디버깅 기능 또는 PC 프로그램과 연결될 수 있습니다.`, recommendation: '기능에 꼭 필요한 권한인지 확인하고, 필요하지 않은 권한은 제거하세요.' }));
    }
  } catch {
    // 손상된 manifest는 다른 규칙의 결과에 영향을 주지 않는다.
  }
  return issues;
}

interface IssueInput {
  ruleId: string;
  title: string;
  technicalTitle: string;
  severity: Severity;
  confidence: 'high' | 'medium' | 'low';
  category: Category;
  artifact: ReadableArtifact;
  lines: string[];
  lineNumber: number;
  explanation: string;
  recommendation: string;
}

function createIssue(input: IssueInput): SecurityIssue {
  const sourceContext = classifySourceContext(input.artifact.name);
  const mustStayActionable = input.category === 'secret' || input.category === 'credential';
  const contextualReference = sourceContext !== 'runtime' && !mustStayActionable;
  const effectiveSeverity: Severity = contextualReference ? 'low' : input.severity;
  const effectiveConfidence = contextualReference && input.confidence === 'high' ? 'medium' : input.confidence;
  const start = Math.max(1, input.lineNumber - 2);
  const end = Math.min(input.lines.length, input.lineNumber + 2);
  const snippetLines = [];
  for (let line = start; line <= end; line += 1) {
    snippetLines.push({ num: line, code: redactSecrets(input.lines[line - 1] || '', input.artifact.name), highlight: line === input.lineNumber, comment: line === input.lineNumber ? '// 확인 필요' : undefined });
  }
  const evidence = redactSecrets(input.lines[input.lineNumber - 1] || '', input.artifact.name).trim().slice(0, 240);

  return {
    id: `${input.ruleId}-${input.artifact.name}-${input.lineNumber}-${issueSequence++}`,
    ruleId: input.ruleId,
    title: input.title,
    userTitle: input.title,
    technicalTitle: input.technicalTitle,
    severity: effectiveSeverity,
    confidence: effectiveConfidence,
    category: input.category,
    sourceContext,
    location: `${input.artifact.name} : ${input.lineNumber}번째 줄`,
    description: input.explanation,
    easyExplanation: input.explanation,
    recommendation: input.recommendation,
    evidence,
    codeSnippet: { filename: input.artifact.name, startLine: start, highlightLine: input.lineNumber, lines: snippetLines },
    whyDangerous: [{ title: '왜 확인해야 하나요?', desc: input.explanation, icon: 'info' }],
    comparison: {
      current: { location: input.artifact.name, code: evidence, label: '현재 발견된 코드' },
      recommended: { code: input.recommendation, label: '권장 조치' },
    },
    isResolved: false,
    aiSuggestedFix: { summary: input.recommendation, explanation: input.explanation },
  };
}

function isScoreRelevant(issue: SecurityIssue) {
  return issue.sourceContext === 'runtime' || issue.category === 'secret' || issue.category === 'credential';
}

function isObviousPlaceholder(value: string) {
  const normalized = value.toLowerCase().replace(/[\s_-]+/g, '');
  return /(example|sample|dummy|fake|placeholder|redacted|notreal|testonly|demotoken|demopassword|yourkey|yourvalue|valuefromenv|changeme)/.test(normalized)
    || /^x{8,}$/.test(normalized)
    || /^0{8,}$/.test(normalized);
}

function isSensitiveEnvFile(filename: string) {
  const base = filename.toLowerCase().replace(/\\/g, '/').split('/').pop() || '';
  return base.startsWith('.env') && !/\.(example|sample|template)$/.test(base);
}

function redactSecrets(line: string, filename: string) {
  let redacted = line
    .replace(/sk-(proj-)?[a-zA-Z0-9_-]{20,}/g, '[REDACTED_API_KEY]')
    .replace(/AKIA[0-9A-Z]{16}/g, '[REDACTED_AWS_KEY]')
    .replace(/AIza[0-9A-Za-z_-]{30,}/g, '[REDACTED_GOOGLE_KEY]')
    .replace(/(password|passwd|admin_password|db_password|secret|token)(\s*[:=]\s*)["'][^"']+["']/gi, '$1$2"[REDACTED]"');

  const base = filename.toLowerCase().split('/').pop() || '';
  if (base.startsWith('.env') && /^\s*[A-Za-z_][A-Za-z0-9_]*\s*=/.test(redacted)) {
    redacted = redacted.replace(/^(\s*[A-Za-z_][A-Za-z0-9_]*\s*=).*$/, '$1[VALUE HIDDEN]');
  }
  if (/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(redacted)) {
    return '[PRIVATE KEY CONTENT HIDDEN]';
  }
  return redacted;
}

function findLine(content: string, text: string) {
  const index = content.split(/\r?\n/).findIndex((line) => line.includes(text));
  return index >= 0 ? index + 1 : 1;
}

function dedupeIssues(issues: SecurityIssue[]) {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.ruleId}-${issue.location}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** 데모 데이터가 실제 결과로 섞이지 않도록 비어 있는 호환 결과만 제공한다. */
export function createSimulatedScan(filename = 'sample-project.zip'): ScanResult {
  return { filename, totalFiles: 0, scannedFiles: 0, completedFiles: 0, skippedFiles: 0, ignoredFiles: 0, contextualIssues: 0, score: 96, issues: [], topActions: [], detectedTypes: [], usage: 'internal', coverageText: '샘플 결과 없음', overallConfidence: 'medium' };
}

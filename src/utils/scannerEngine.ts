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
  const sourceContext = classifySourceContext(artifact.name);

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

    const slackWebhook = line.match(/https:\/\/hooks\.slack\.com\/services\/[^\s"'`]+/i)?.[0];
    if (slackWebhook && isLikelySlackWebhook(slackWebhook)) {
      issues.push(createIssue({ ruleId: 'SECRET_SLACK_WEBHOOK', title: '실제 형태의 Slack Webhook이 코드에 포함되어 있습니다', technicalTitle: 'Hardcoded Slack webhook', severity: 'critical', confidence: 'high', category: 'secret', artifact, lines, lineNumber, explanation: 'Webhook 주소를 가진 사람은 연결된 Slack 채널로 메시지를 보낼 수 있습니다.', recommendation: 'Webhook을 즉시 재발급하고 환경 변수나 회사의 비밀 저장소로 옮기세요.' }));
    }

    const credentialMatch = line.match(/\b(password|passwd|admin_password|db_password|api_?key|secret|token)\b\s*[:=]\s*["']([^"']+)["']/i);
    if (credentialMatch && !apiKeyCandidate && !slackWebhook && isLikelyCredential(credentialMatch[2]) && !/process\.env|import\.meta\.env|os\.environ/i.test(line)) {
      issues.push(createIssue({ ruleId: 'SECRET_CREDENTIAL', title: '비밀번호 또는 토큰이 코드에 직접 적혀 있습니다', technicalTitle: 'Hardcoded credential', severity: 'critical', confidence: 'high', category: 'credential', artifact, lines, lineNumber, explanation: '코드를 열어보는 사람은 누구나 이 값을 확인하고 악용할 수 있습니다.', recommendation: '값을 코드에서 제거하고 환경 변수로 불러오도록 변경하세요.' }));
    }

    const xss = assessXssCandidate(line, lines, index);
    if (xss) {
      issues.push(createIssue({ ruleId: 'DANGEROUS_XSS', title: xss.severity === 'high' ? '외부 입력이 HTML로 직접 삽입됩니다' : 'HTML로 삽입되는 값의 출처를 확인해야 합니다', technicalTitle: 'Untrusted data in HTML sink', severity: xss.severity, confidence: xss.confidence, category: 'dangerous', artifact, lines, lineNumber, explanation: xss.severity === 'high' ? '사용자 입력이 정화되지 않은 채 HTML로 들어가 화면 변조나 정보 탈취로 이어질 수 있습니다.' : 'HTML 삽입 기능이 변수값을 사용하지만, 이 줄만으로는 값의 출처를 확인할 수 없습니다.', recommendation: 'DOMPurify 같은 검증된 정화 함수를 적용하거나 textContent처럼 HTML을 해석하지 않는 방식을 사용하세요.' }));
    }

    const evalRisk = assessEvalCandidate(line, lines, index);
    if (evalRisk) {
      issues.push(createIssue({ ruleId: 'DANGEROUS_EVAL', title: evalRisk.severity === 'high' ? '외부 입력이 코드로 실행됩니다' : '실행되는 코드 값의 출처를 확인해야 합니다', technicalTitle: 'Dynamic code execution', severity: evalRisk.severity, confidence: evalRisk.confidence, category: 'dangerous', artifact, lines, lineNumber, explanation: 'eval에 전달되는 값이 조작되면 공격자가 원하는 코드를 실행할 수 있습니다.', recommendation: 'eval을 제거하고 허용된 동작을 명시적으로 매핑하세요.' }));
    }

    const commandRisk = assessCommandExecution(line, lines, index, artifact.name);
    if (commandRisk) {
      issues.push(createIssue({ ruleId: 'SCRIPT_COMMAND_INJECTION', title: commandRisk.severity === 'high' ? '외부 입력이 시스템 명령으로 실행됩니다' : '시스템 명령에 사용되는 값의 출처를 확인해야 합니다', technicalTitle: 'OS command execution', severity: commandRisk.severity, confidence: commandRisk.confidence, category: 'dangerous', artifact, lines, lineNumber, explanation: commandRisk.severity === 'high' ? '사용자가 조작한 값이 명령어에 연결되어 PC에서 임의 명령이 실행될 수 있습니다.' : '명령 실행 함수가 변수를 사용하지만 현재 코드만으로 값의 출처를 확정하기 어렵습니다.', recommendation: '외부 입력을 셸 명령에 연결하지 말고, 허용 목록과 배열형 인자를 사용하는 안전한 API로 변경하세요.' }));
    }

    if (sourceContext === 'runtime' && isExecutableNetworkCall(line) && /\b(fetch|axios\.(get|post|put|patch)|WebSocket)\s*\(\s*[`"']http:\/\//i.test(line) && !isLocalUrl(line)) {
      issues.push(createIssue({ ruleId: 'NETWORK_HTTP', title: '정보를 암호화하지 않은 주소로 전송합니다', technicalTitle: 'Insecure HTTP communication', severity: 'high', confidence: 'high', category: 'network', artifact, lines, lineNumber, explanation: 'HTTP 통신은 전송 중인 내용을 다른 사람이 가로볼 수 있습니다.', recommendation: '대상 서버가 HTTPS를 지원하는지 확인하고 주소를 HTTPS로 변경하세요.' }));
    } else if (sourceContext === 'runtime' && isExecutableNetworkCall(line) && /\b(fetch|axios\.(get|post|put|patch)|WebSocket)\s*\(\s*[`"']https?:\/\//i.test(line) && !isLocalUrl(line)) {
      issues.push(createIssue({ ruleId: 'NETWORK_EXTERNAL', title: '외부 서버와 통신하는 코드가 있습니다', technicalTitle: 'External network communication', severity: usage === 'external' ? 'medium' : 'low', confidence: 'medium', category: 'network', artifact, lines, lineNumber, explanation: '입력한 정보가 회사 밖의 서버로 전달될 수 있어 사용 목적 확인이 필요합니다.', recommendation: '표시된 주소가 회사에서 승인한 서비스인지, 어떤 정보를 보내는지 확인하세요.' }));
    }

    if (sourceContext === 'runtime' && isPossibleExternalDataTransfer(lines, index)) {
      issues.push(createIssue({ ruleId: 'NETWORK_DATA_TRANSFER', title: '내부에서 가져온 정보가 외부 서비스로 전송될 수 있습니다', technicalTitle: 'Possible internal data exfiltration', severity: 'high', confidence: 'medium', category: 'network', artifact, lines, lineNumber, explanation: '내부 API에서 읽은 값이 외부 주소의 요청 본문에 포함되어 정보가 회사 밖으로 나갈 수 있습니다.', recommendation: '전송 대상과 데이터 항목을 확인하고, 승인된 주소만 허용하며 민감정보를 제거하세요.' }));
    }

    if (/localStorage\.(getItem|setItem).*?(admin|role|auth)|\b(isAdmin|adminRole)\b\s*=/.test(line)) {
      issues.push(createIssue({ ruleId: 'AUTH_CLIENT_SIDE', title: '관리자 권한을 브라우저에서 판단하고 있습니다', technicalTitle: 'Client-side authorization', severity: 'high', confidence: 'medium', category: 'authentication', artifact, lines, lineNumber, explanation: '브라우저의 값은 사용자가 직접 바꿀 수 있어 관리자 화면이 노출될 수 있습니다.', recommendation: '권한 확인은 서버에서 수행하고, 브라우저는 서버의 결과만 사용하도록 변경하세요.' }));
    }

    if (isExecutedPowerShellBypass(line, artifact.name, sourceContext)) {
      issues.push(createIssue({ ruleId: 'SCRIPT_ENCODED_COMMAND', title: '내용을 숨긴 PowerShell 명령을 실행합니다', technicalTitle: 'Encoded PowerShell command', severity: 'critical', confidence: 'high', category: 'dangerous', artifact, lines, lineNumber, explanation: '실행 내용을 알아보기 어렵게 만든 명령은 악성 동작을 숨길 때 자주 사용됩니다.', recommendation: '공유하거나 실행하기 전에 평문 명령으로 바꾸고 동작 목적을 확인하세요.' }));
    }

    if (isDownloadExecuteChain(lines, index, artifact.name, sourceContext)) {
      issues.push(createIssue({ ruleId: 'SCRIPT_DOWNLOAD_EXECUTE', title: '인터넷에서 파일을 받아 바로 실행합니다', technicalTitle: 'Download and execute chain', severity: 'critical', confidence: 'high', category: 'dangerous', artifact, lines, lineNumber, explanation: '다운로드 주소가 바뀌거나 침해되면 원하지 않는 프로그램이 PC에서 실행될 수 있습니다.', recommendation: '다운로드와 실행을 분리하고, 승인된 주소와 파일 해시를 확인하도록 변경하세요.' }));
    }

    if (/\b(reg\s+add|sc\s+(create|config)|netsh\s+advfirewall|Set-ItemProperty|New-Service)\b/i.test(line)) {
      issues.push(createIssue({ ruleId: 'SCRIPT_SYSTEM_CHANGE', title: 'PC의 중요한 설정을 변경합니다', technicalTitle: 'System configuration modification', severity: 'high', confidence: 'high', category: 'dangerous', artifact, lines, lineNumber, explanation: '레지스트리, 서비스 또는 방화벽 설정을 바꾸면 PC 전체 동작에 영향을 줄 수 있습니다.', recommendation: '변경 목적과 되돌리는 방법을 확인하고, 사내 공유 전 담당자의 검토를 받으세요.' }));
    }

    const deleteRisk = assessDestructiveDelete(line, lines, index, artifact.name, sourceContext);
    if (deleteRisk) {
      issues.push(createIssue({ ruleId: 'SCRIPT_DESTRUCTIVE_DELETE', title: deleteRisk.severity === 'high' ? '외부 입력 또는 위험한 경로를 재귀 삭제합니다' : '재귀 삭제 대상 경로를 확인해야 합니다', technicalTitle: 'Recursive file deletion', severity: deleteRisk.severity, confidence: deleteRisk.confidence, category: 'dangerous', artifact, lines, lineNumber, explanation: deleteRisk.severity === 'high' ? '사용자 입력이나 루트 경로가 삭제 명령에 연결되어 중요한 파일이 대량 삭제될 수 있습니다.' : '삭제 명령이 변수 또는 일반 경로를 사용해 실제 대상을 검토해야 합니다.', recommendation: '삭제 경로를 빌드·캐시 폴더처럼 명확한 허용 목록으로 제한하고 실행 전에 확인하세요.' }));
    }

    if (isSensitiveEnvFile(artifact.name) && trimmed && !trimmed.startsWith('#') && !issues.some((issue) => issue.ruleId === 'ENV_INCLUDED')) {
      issues.push(createIssue({ ruleId: 'ENV_INCLUDED', title: '환경 설정 파일이 결과물에 포함되어 있습니다', technicalTitle: 'Environment file included', severity: 'high', confidence: 'high', category: 'secret', artifact, lines, lineNumber, explanation: '환경 설정 파일에는 API Key, 비밀번호, 내부 서버 주소가 포함될 수 있습니다.', recommendation: '.env 파일을 공유 ZIP에서 제외하고 .env.example만 제공하세요.' }));
    }
  });

  if (lower.endsWith('manifest.json')) issues.push(...analyzeExtensionManifest(artifact));
  return issues;
}

type ContextAssessment = { severity: 'high' | 'medium' | 'low'; confidence: 'high' | 'medium' | 'low' };

const EXTERNAL_INPUT_PATTERN = /req\.(?:body|query|params)|request\.(?:body|query|params)|userInput|user_input|process\.argv|sys\.argv|input\s*\(|stdin|readline|prompt\s*\(|set\s+\/p\b/i;
const SAFE_DELETE_TARGET = /(?:^|[/\\"'\s])(?:dist|build|out|coverage|\.cache|\.tmp|temp|node_modules[/\\]\.cache)(?:[/\\"'\s]|$)/i;

function codeOutsideStrings(line: string) {
  let result = '';
  let quote = '';
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (escaped) {
      escaped = false;
      result += quote ? ' ' : char;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      result += quote ? ' ' : char;
      continue;
    }
    if (quote) {
      if (char === quote) quote = '';
      result += char === quote ? char : ' ';
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      result += char;
      continue;
    }
    if (char === '/' && line[index + 1] === '/') break;
    result += char;
  }
  return result;
}

function nearbyCode(lines: string[], index: number, radius = 5) {
  return lines.slice(Math.max(0, index - radius), Math.min(lines.length, index + radius + 1)).join('\n');
}

function isCommentOrPatternDefinition(line: string) {
  const trimmed = line.trim();
  return /^(?:\/\/|#|REM\b|::)/i.test(trimmed)
    || /(?:return|const|let|var|pattern|regex|regexp)\b[^\n]*\/[^/\n]+\/[gimsuy]*/i.test(trimmed);
}

function hasExternalInput(value: string, lines: string[], index: number) {
  if (EXTERNAL_INPUT_PATTERN.test(value)) return true;
  const identifiers = [...value.matchAll(/\b[A-Za-z_$][\w$]*\b/g)].map((match) => match[0]);
  if (!identifiers.length) return false;
  const previous = lines.slice(Math.max(0, index - 8), index + 1).join('\n');
  const batchVariables = [...value.matchAll(/%([A-Za-z_][\w]*)%/g)].map((match) => match[1]);
  if (batchVariables.some((variable) => new RegExp(`\\bset\\s+\\/p\\s+${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=`, 'i').test(previous))) return true;
  return identifiers.some((identifier) => {
    const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b\\s*(?:=|:)\\s*[^\\n]*(?:${EXTERNAL_INPUT_PATTERN.source})`, 'i').test(previous);
  });
}

function assessXssCandidate(line: string, lines: string[], index: number): ContextAssessment | null {
  if (isCommentOrPatternDefinition(line)) return null;
  const assignment = line.match(/(?:\.innerHTML\s*=|\bv-html\s*=\s*|dangerouslySetInnerHTML\s*=\s*\{?\s*\{?\s*__html\s*:)(.+?)(?:;|\}\}?\s*$|$)/i);
  if (!assignment) return null;
  const value = assignment[1].trim();
  if (/DOMPurify\.sanitize\s*\(|sanitize(?:Html)?\s*\(/i.test(value)) return null;
  if (/^(?:["'][\s\S]*["']|`[^$]*`)$/.test(value)) return null;
  if (hasExternalInput(value, lines, index)) return { severity: 'high', confidence: 'high' };
  return { severity: 'medium', confidence: 'low' };
}

function assessEvalCandidate(line: string, lines: string[], index: number): ContextAssessment | null {
  if (isCommentOrPatternDefinition(line) || !/\beval\s*\(/.test(codeOutsideStrings(line))) return null;
  const argument = line.match(/\beval\s*\((.+)\)/)?.[1] || '';
  if (/^["'][^"']*["']$/.test(argument.trim())) return null;
  return hasExternalInput(argument, lines, index)
    ? { severity: 'high', confidence: 'high' }
    : { severity: 'medium', confidence: 'medium' };
}

function assessCommandExecution(line: string, lines: string[], index: number, filename: string): ContextAssessment | null {
  if (isCommentOrPatternDefinition(line)) return null;
  const lowerName = filename.toLowerCase();
  const isShellScript = /\.(bat|cmd|ps1)$/.test(lowerName);
  const outside = codeOutsideStrings(line);
  const jsCall = /\b(?:exec|execSync|spawn|spawnSync|system|Popen|subprocess\.run|subprocess\.Popen)\s*\(/i.test(outside);
  const shellCall = isShellScript && /\b(?:cmd(?:\.exe)?\s+\/c|powershell(?:\.exe)?\b|Invoke-Expression\b|iex\b)/i.test(line);
  if (!jsCall && !shellCall) return null;
  if (hasExternalInput(line, lines, index)) return { severity: 'high', confidence: 'high' };
  const usesVariable = /\$\{|\$[A-Za-z_]\w*|%[A-Za-z_]\w*%|\+\s*[A-Za-z_$]|\b(?:exec|execSync|system)\s*\(\s*[A-Za-z_$]/i.test(line);
  if (usesVariable) return { severity: 'medium', confidence: 'low' };
  return null;
}

function isLocalUrl(line: string) {
  return /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(?:[/"'`]|$)/i.test(line);
}

function isExecutableNetworkCall(line: string) {
  return !isCommentOrPatternDefinition(line)
    && /\b(?:fetch|axios\.(?:get|post|put|patch)|WebSocket)\s*\(/i.test(codeOutsideStrings(line));
}

function isPossibleExternalDataTransfer(lines: string[], index: number) {
  const line = lines[index];
  if (!isExecutableNetworkCall(line) || !/https:\/\//i.test(line) || isLocalUrl(line)) return false;
  const block = lines.slice(index, Math.min(lines.length, index + 8)).join('\n');
  if (!/\b(?:body|data)\s*:/i.test(block)) return false;
  const previous = lines.slice(Math.max(0, index - 12), index).join('\n');
  const internalAssignment = previous.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?fetch\s*\(\s*[A-Za-z_$][\w$.]*|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+[A-Za-z_$][\w$.]*\s*\(/i);
  const variable = internalAssignment?.[1] || internalAssignment?.[2];
  return Boolean(variable && new RegExp(`\\b${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(block));
}

function isExecutedPowerShellBypass(line: string, filename: string, sourceContext: SourceContext) {
  if (!/(?:-ExecutionPolicy\s+Bypass|-EncodedCommand\b|-enc\b)/i.test(line) || isCommentOrPatternDefinition(line)) return false;
  const isShellScript = /\.(bat|cmd|ps1)$/i.test(filename);
  if (isShellScript) return sourceContext === 'runtime';
  const outside = codeOutsideStrings(line);
  return /\b(?:exec|execSync|spawn|spawnSync|system|Popen|subprocess\.run|subprocess\.Popen)\s*\(/i.test(outside);
}

function isDownloadExecuteChain(lines: string[], index: number, filename: string, sourceContext: SourceContext) {
  if (sourceContext !== 'runtime' || isCommentOrPatternDefinition(lines[index])) return false;
  const window = lines.slice(index, Math.min(lines.length, index + 6)).join('\n');
  const isShellScript = /\.(bat|cmd|ps1)$/i.test(filename);
  if (isShellScript) {
    return /(Invoke-WebRequest|curl(?:\.exe)?|wget)\b[\s\S]*?(?:\||&&|;|\n)[\s\S]*?(Start-Process|Invoke-Expression|iex|cmd(?:\.exe)?\s+\/c|\.exe\b)/i.test(window);
  }
  const hasDownload = /(?:fetch|axios\.(?:get|post)|https?\.get)\s*\([^\n]*https?:\/\//i.test(window);
  const hasSave = /(?:writeFile|writeFileSync|createWriteStream|Out-File|>-?\s*[^\s]+)/i.test(window);
  const hasExecute = /\b(?:exec|execSync|spawn|spawnSync|Start-Process)\s*\(/i.test(codeOutsideStrings(window));
  return hasDownload && hasSave && hasExecute;
}

function assessDestructiveDelete(line: string, lines: string[], index: number, filename: string, sourceContext: SourceContext): ContextAssessment | null {
  const deletePattern = /\b(?:del|erase|rmdir|rd)\b.*?[/\\]s\b|Remove-Item\b.*?-Recurse|rm\s+-rf/i;
  if (!deletePattern.test(line) || isCommentOrPatternDefinition(line)) return null;
  const isShellScript = /\.(bat|cmd|ps1)$/i.test(filename);
  const actuallyExecuted = isShellScript || /\b(?:exec|execSync|spawn|spawnSync|system)\s*\(/i.test(codeOutsideStrings(line)) || /"clean"\s*:/.test(line);
  if (!actuallyExecuted || sourceContext !== 'runtime') return null;
  if (SAFE_DELETE_TARGET.test(line) && !EXTERNAL_INPUT_PATTERN.test(line)) return null;
  if (/(?:rm\s+-rf|Remove-Item[^\n]*-Recurse)[^\n]*(?:["']?\/(?:\*|["']|\s|$)|\.\.[/\\])/i.test(line)) return { severity: 'high', confidence: 'high' };
  if (hasExternalInput(line, lines, index)) return { severity: 'high', confidence: 'high' };
  if (/\$\{|\$[A-Za-z_]\w*|%[A-Za-z_]\w*%/i.test(line)) return { severity: 'medium', confidence: 'medium' };
  return { severity: 'medium', confidence: 'low' };
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
  const normalized = value.toLowerCase().replace(/[\[\]\s_.-]+/g, '');
  return /^(?:test|test\d+)$/.test(normalized)
    || /(example|sample|dummy|fake|mock|placeholder|redacted|notreal|notvalid|invalid|testonly|demotoken|demopassword|yourapikey|yourtoken|yourpassword|yourkey|yourvalue|valuefromenv|changeme)/.test(normalized)
    || /^x{8,}$/.test(normalized)
    || /^0{8,}$/.test(normalized);
}

function shannonEntropy(value: string) {
  const counts = new Map<string, number>();
  for (const char of value) counts.set(char, (counts.get(char) || 0) + 1);
  return [...counts.values()].reduce((entropy, count) => {
    const probability = count / value.length;
    return entropy - probability * Math.log2(probability);
  }, 0);
}

function isLikelyCredential(value: string) {
  const trimmed = value.trim();
  if (isObviousPlaceholder(trimmed) || trimmed.length < 12) return false;
  if (/^(?:true|false|null|undefined|password|secret|token)$/i.test(trimmed)) return false;
  const hasMixedCharacterClasses = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(trimmed)).length >= 2;
  return hasMixedCharacterClasses && (trimmed.length >= 20 || shannonEntropy(trimmed) >= 3.4);
}

function isLikelySlackWebhook(value: string) {
  if (isObviousPlaceholder(value)) return false;
  return /^https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]{8,}\/B[A-Z0-9]{8,}\/[A-Za-z0-9]{20,}$/i.test(value);
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
    .replace(/https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]{8,}\/B[A-Z0-9]{8,}\/[A-Za-z0-9]{20,}/gi, '[REDACTED_SLACK_WEBHOOK]')
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

import { AuditProject, SecurityIssue, AuditHistoryItem } from '../types';

export const mockIssueAdminPassword: SecurityIssue = {
  id: 'vuln-admin-password',
  orderNumber: '02',
  title: '관리자 비밀번호 하드코딩',
  severity: 'critical',
  category: 'credential',
  location: 'src/admin.js : Line 38',
  description: '관리자 인증 함수에 패스워드가 평문 문자열로 직접 하드코딩되어 있습니다.',
  codeSnippet: {
    filename: 'src/admin.js',
    startLine: 35,
    highlightLine: 38,
    lines: [
      { num: 35, code: '// Initialize admin module' },
      { num: 36, code: 'function initializeAdmin() {' },
      { num: 37, code: '    let config = loadConfig();' },
      { num: 38, code: 'const ADMIN_PASSWORD = "admin1234";', highlight: true, comment: '// ← 하드코딩된 크리덴셜 감지됨' },
      { num: 39, code: ' ' },
      { num: 40, code: "    if (config.authMode === 'local') {" },
      { num: 41, code: '        authenticate(ADMIN_PASSWORD);' },
      { num: 42, code: '    }' },
    ],
  },
  whyDangerous: [
    {
      title: '소스코드 유출 시 즉각적인 피해',
      desc: '버전 관리 시스템(GitHub 등)이나 내부 저장소에 코드가 노출될 경우, 공격자가 즉시 최고 관리자 권한을 획득할 수 있습니다.',
      icon: 'policy',
      iconColor: 'text-critical',
    },
    {
      title: '비밀번호 변경의 어려움',
      desc: '비밀번호를 변경하려면 소스코드를 직접 수정하고 전체 애플리케이션을 다시 빌드 및 배포해야 하는 운영상 취약점이 존재합니다.',
      icon: 'manage_history',
      iconColor: 'text-medium',
    },
  ],
  comparison: {
    current: {
      location: 'src/admin.js',
      code: 'src/admin.js : "admin1234"',
      label: '현재 (취약함)',
    },
    recommended: {
      location: 'src/admin.js',
      code: 'process.env.ADMIN_PASSWORD',
      label: '권장 (안전함)',
    },
  },
  isResolved: false,
  aiSuggestedFix: {
    summary: '환경 변수(process.env)를 사용하도록 리팩터링하고 .env.example 가이드를 추가합니다.',
    envVarsNeeded: ['ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET'],
    fixedCode: `// Initialize admin module
function initializeAdmin() {
    let config = loadConfig();
    
    // [VibeGuard Fix] 환경 변수로부터 안전하게 관리자 비밀번호 로드
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD) {
        throw new Error("보안 오류: ADMIN_PASSWORD 환경 변수가 설정되지 않았습니다.");
    }
    
    if (config.authMode === 'local') {
        authenticate(ADMIN_PASSWORD);
    }
}`,
    explanation: '하드코딩된 비밀번호 문자열을 제거하고 시스템 환경 변수 process.env.ADMIN_PASSWORD로 주입받도록 변경하여, 저장소에 비밀정보가 유출되는 것을 원천 차단합니다.',
  },
};

export const mockIssueApiKey: SecurityIssue = {
  id: 'vuln-api-key',
  orderNumber: '01',
  title: 'API Key 하드코딩 노출',
  severity: 'critical',
  category: 'secret',
  location: 'config/auth.js:42',
  description: '소스코드 `config/auth.js` 42번째 줄에 OpenAI API Key가 평문으로 노출되어 있습니다.',
  codeSnippet: {
    filename: 'config/auth.js',
    startLine: 40,
    highlightLine: 42,
    lines: [
      { num: 40, code: '// AI Service Client Setup' },
      { num: 41, code: 'const model = "gpt-4";' },
      { num: 42, code: 'const apiKey = "[REDACTED_API_KEY]";', highlight: true, comment: '// ← 평문 API Key 노출' },
      { num: 43, code: 'const client = new OpenAI({ apiKey });' },
      { num: 44, code: 'export default client;' },
    ],
  },
  whyDangerous: [
    {
      title: '과도한 과금 및 서비스 도용',
      desc: '공개된 API Key를 탈취한 공격자가 대량의 토큰 요청을 발생시켜 막대한 비용 손실을 초래합니다.',
      icon: 'attach_money',
      iconColor: 'text-critical',
    },
    {
      title: '비공개 AI 모델 및 데이터 접근',
      desc: '조직 전용 파인튜닝 모델이나 내부 RAG 데이터베이스에 인가되지 않은 외부인이 접근할 수 있습니다.',
      icon: 'lock_open',
      iconColor: 'text-high',
    },
  ],
  comparison: {
    current: {
      location: 'config/auth.js',
      code: 'const apiKey = "sk-proj-xxxx...";',
      label: '현재 (취약함)',
    },
    recommended: {
      location: 'config/auth.js',
      code: 'const apiKey = process.env.OPENAI_API_KEY;',
      label: '권장 (안전함)',
    },
  },
  isResolved: false,
  aiSuggestedFix: {
    summary: 'API Key를 환경 변수 또는 비밀 관리자(Secret Manager)로 이전합니다.',
    envVarsNeeded: ['OPENAI_API_KEY'],
    fixedCode: `// AI Service Client Setup
const model = "gpt-4";
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.");
}

const client = new OpenAI({ apiKey });
export default client;`,
    explanation: '코드베이스에서 평문 키를 완전히 제거하고 배포 환경에서 환경 변수로 안전하게 주입받도록 수정합니다.',
  },
};

export const mockIssueDbPassword: SecurityIssue = {
  id: 'vuln-db-pwd',
  orderNumber: '02',
  title: '관리자 데이터베이스 비밀번호 노출',
  severity: 'critical',
  category: 'secret',
  location: '.env.production',
  description: '환경 변수 설정 파일 `.env.production`이 깃허브 저장소에 커밋되었습니다.',
  codeSnippet: {
    filename: '.env.production',
    startLine: 1,
    highlightLine: 3,
    lines: [
      { num: 1, code: 'NODE_ENV=production' },
      { num: 2, code: 'DB_HOST=postgres.production.internal' },
      { num: 3, code: 'DB_PASSWORD=SuperSecretAdminDB#2026!', highlight: true, comment: '// ← 실서버 DB 비밀번호 커밋됨' },
      { num: 4, code: 'DB_USER=root_admin' },
      { num: 5, code: 'PORT=5432' },
    ],
  },
  whyDangerous: [
    {
      title: '프로덕션 데이터베이스 탈취 및 변조',
      desc: '실운영 DB에 침투하여 모든 사용자 데이터, 결제 정보 탈취 및 랜섬웨어 공격이 발생할 수 있습니다.',
      icon: 'database',
      iconColor: 'text-critical',
    },
  ],
  comparison: {
    current: {
      location: '.env.production',
      code: '.env.production (깃허브 커밋됨)',
      label: '현재 (취약함)',
    },
    recommended: {
      location: '.gitignore & CI/CD Secrets',
      code: '.gitignore에 .env 추가 및 클라우드 시크릿 매니저 연동',
      label: '권장 (안전함)',
    },
  },
  isResolved: false,
};

export const mockIssueClientAuthBypass: SecurityIssue = {
  id: 'vuln-client-auth-bypass',
  orderNumber: '03',
  title: '클라이언트 인증 로직 우회 가능',
  severity: 'high',
  category: 'authentication',
  location: 'middleware/verify.js:15',
  description: '`middleware/verify.js`에서 JWT 토큰 검증 시 서버 비밀키가 아닌 클라이언트 제공 값을 신뢰하는 결함이 있습니다.',
  codeSnippet: {
    filename: 'middleware/verify.js',
    startLine: 12,
    highlightLine: 15,
    lines: [
      { num: 12, code: 'function verifyToken(req, res, next) {' },
      { num: 13, code: '    const token = req.headers["x-access-token"];' },
      { num: 14, code: '    const clientSecret = req.headers["x-client-secret"];' },
      { num: 15, code: '    const decoded = jwt.verify(token, clientSecret); // ⚠️ 클라이언트 헤더 신뢰', highlight: true, comment: '// ← 서명 검증 키 위조 가능' },
      { num: 16, code: '    req.user = decoded;' },
      { num: 17, code: '    next();' },
      { num: 18, code: '}' },
    ],
  },
  whyDangerous: [
    {
      title: '임의의 사용자 권한 위조 (IDOR/Privilege Escalation)',
      desc: '공격자가 자체 생성한 클라이언트 시크릿으로 위조 JWT를 서명하여 admin 계정으로 승격할 수 있습니다.',
      icon: 'gpp_bad',
      iconColor: 'text-high',
    },
  ],
  comparison: {
    current: {
      location: 'middleware/verify.js',
      code: 'jwt.verify(token, req.headers["x-client-secret"])',
      label: '현재 (취약함)',
    },
    recommended: {
      location: 'middleware/verify.js',
      code: 'jwt.verify(token, process.env.JWT_SERVER_SECRET)',
      label: '권장 (안전함)',
    },
  },
  isResolved: false,
};

export const mockIssueXss: SecurityIssue = {
  id: 'vuln-xss',
  title: 'XSS 취약점 존재 가능성',
  severity: 'medium',
  category: 'dangerous',
  location: 'views/profile.ejs:22',
  description: '사용자 입력 닉네임과 상태 메시지를 HTML 이스케이프 없이 `<%- ... %>` 태그로 렌더링하고 있습니다.',
  codeSnippet: {
    filename: 'views/profile.ejs',
    startLine: 20,
    highlightLine: 22,
    lines: [
      { num: 20, code: '<div class="user-bio">' },
      { num: 21, code: '  <h3><%= user.name %></h3>' },
      { num: 22, code: '  <p><%- user.customStatusHtml %></p>', highlight: true, comment: '// ← 비위생화된 HTML 렌더링' },
      { num: 23, code: '</div>' },
    ],
  },
  whyDangerous: [
    {
      title: '악성 스크립트 실행 및 세션 쿠키 탈취',
      desc: '공격자가 악성 자바스크립트 코드를 상태 메시지에 주입하여 다른 사용자의 세션을 탈취할 수 있습니다.',
      icon: 'code_off',
      iconColor: 'text-medium',
    },
  ],
  comparison: {
    current: {
      location: 'views/profile.ejs',
      code: '<%- user.customStatusHtml %>',
      label: '현재 (취약함)',
    },
    recommended: {
      location: 'views/profile.ejs',
      code: '<%= DOMPurify.sanitize(user.customStatusHtml) %>',
      label: '권장 (안전함)',
    },
  },
  isResolved: false,
};

export const mockIssueLog4j: SecurityIssue = {
  id: 'vuln-log4j',
  title: '오래된 라이브러리 사용 (Log4j 2.14)',
  severity: 'medium',
  category: 'dangerous',
  location: 'pom.xml:24',
  description: '원격 코드 실행(RCE) 취약점 CVE-2021-44228이 존재하는 구버전 라이브러리를 참조 중입니다.',
  codeSnippet: {
    filename: 'pom.xml',
    startLine: 22,
    highlightLine: 24,
    lines: [
      { num: 22, code: '<dependency>' },
      { num: 23, code: '    <groupId>org.apache.logging.log4j</groupId>' },
      { num: 24, code: '    <version>2.14.1</version>', highlight: true, comment: '// ← Log4Shell 취약 버전' },
      { num: 25, code: '</dependency>' },
    ],
  },
  whyDangerous: [
    {
      title: 'JNDI 원격 코드 실행 취약점',
      desc: '공격자가 로그 메시지에 악성 JNDI 조작 문자열을 전송하여 서버를 장악할 수 있습니다.',
      icon: 'bug_report',
      iconColor: 'text-medium',
    },
  ],
  comparison: {
    current: {
      location: 'pom.xml',
      code: '<version>2.14.1</version>',
      label: '현재 (취약함)',
    },
    recommended: {
      location: 'pom.xml',
      code: '<version>2.17.1</version>',
      label: '권장 (안전함)',
    },
  },
  isResolved: false,
};

export const mockIssueSqlInjection: SecurityIssue = {
  id: 'vuln-sql-injection',
  title: 'SQL 인젝션 취약점 패치 (로그인 API)',
  severity: 'high',
  category: 'authentication',
  location: 'api/auth.js:52',
  description: '동적 SQL 문자열 결합 대신 파라미터화된 쿼리(Prepared Statements)를 적용해야 합니다.',
  codeSnippet: {
    filename: 'api/auth.js',
    startLine: 50,
    highlightLine: 52,
    lines: [
      { num: 50, code: 'async function login(username, password) {' },
      { num: 51, code: '  // 입력값 검증 로직' },
      { num: 52, code: '  const query = "SELECT * FROM users WHERE username = \'" + username + "\'";', highlight: true, comment: '// ← SQL 결합' },
      { num: 53, code: '  return db.query(query);' },
      { num: 54, code: '}' },
    ],
  },
  whyDangerous: [
    {
      title: '인증 우회 및 데이터베이스 열람',
      desc: "' OR 1=1 -- 구문을 통해 비밀번호 없이 최고 권한으로 로그인할 수 있습니다.",
      icon: 'admin_panel_settings',
      iconColor: 'text-high',
    },
  ],
  comparison: {
    current: {
      location: 'api/auth.js',
      code: 'db.query("SELECT * WHERE u = " + user)',
      label: '현재 (취약함)',
    },
    recommended: {
      location: 'api/auth.js',
      code: 'db.query("SELECT * WHERE u = $1", [user])',
      label: '권장 (안전함)',
    },
  },
  isResolved: true,
};

export const mockIssueInsecurePort: SecurityIssue = {
  id: 'vuln-insecure-port',
  title: '불필요한 포트 차단 (포트 8080)',
  severity: 'low',
  category: 'network',
  location: 'docker-compose.yml:14',
  description: '개발용 디버깅 포트 8080이 외부에 노출되어 있습니다.',
  codeSnippet: {
    filename: 'docker-compose.yml',
    startLine: 12,
    highlightLine: 14,
    lines: [
      { num: 12, code: 'services:' },
      { num: 13, code: '  backend:' },
      { num: 14, code: '    ports: ["8080:8080", "443:443"]', highlight: true, comment: '// ← 외부 8080 포트 노출' },
    ],
  },
  whyDangerous: [
    {
      title: '인가되지 않은 내부 메트릭 엔드포인트 접근',
      desc: '내부 디버깅 툴에 직접 접속하여 힙 덤프나 환경 변수를 조회할 수 있습니다.',
      icon: 'router',
      iconColor: 'text-low',
    },
  ],
  comparison: {
    current: {
      location: 'docker-compose.yml',
      code: 'ports: ["8080:8080"]',
      label: '현재 (취약함)',
    },
    recommended: {
      location: 'docker-compose.yml',
      code: 'ports: ["127.0.0.1:8080:8080"] (로컬 바인딩)',
      label: '권장 (안전함)',
    },
  },
  isResolved: true,
};

export const mockIssueSslCert: SecurityIssue = {
  id: 'vuln-ssl-cert',
  title: '만료된 SSL 인증서 갱신',
  severity: 'medium',
  category: 'network',
  location: 'nginx/ssl.conf:8',
  description: 'TLS 1.0/1.1 사용 및 구버전 인증서 설정이 감지되었습니다.',
  codeSnippet: {
    filename: 'nginx/ssl.conf',
    startLine: 6,
    highlightLine: 8,
    lines: [
      { num: 6, code: 'server {' },
      { num: 7, code: '  listen 443 ssl;' },
      { num: 8, code: '  ssl_protocols TLSv1 TLSv1.1 TLSv1.2;', highlight: true, comment: '// ← 취약한 TLS 버전' },
      { num: 9, code: '}' },
    ],
  },
  whyDangerous: [
    {
      title: '중간자 공격(MITM) 및 도청 위험',
      desc: '오래된 암호화 스위트를 사용하는 클라이언트 세션을 가로채어 트래픽을 복호화할 수 있습니다.',
      icon: 'lock',
      iconColor: 'text-medium',
    },
  ],
  comparison: {
    current: {
      location: 'nginx/ssl.conf',
      code: 'ssl_protocols TLSv1 TLSv1.1 TLSv1.2;',
      label: '현재 (취약함)',
    },
    recommended: {
      location: 'nginx/ssl.conf',
      code: 'ssl_protocols TLSv1.2 TLSv1.3;',
      label: '권장 (안전함)',
    },
  },
  isResolved: true,
};

export const mockIssuePasswordPolicy: SecurityIssue = {
  id: 'vuln-password-policy',
  title: '비밀번호 정책 강화 권고',
  severity: 'low',
  category: 'authentication',
  location: 'src/services/auth.ts:28',
  description: '특수문자 포함 규칙 및 8자 이상 비밀번호 검증이 누락되었습니다.',
  codeSnippet: {
    filename: 'src/services/auth.ts',
    startLine: 26,
    highlightLine: 28,
    lines: [
      { num: 26, code: 'function isValidPassword(pwd: string) {' },
      { num: 27, code: '  // 최소 4자만 검사 중' },
      { num: 28, code: '  return pwd.length >= 4;', highlight: true, comment: '// ← 취약한 비밀번호 규칙' },
      { num: 29, code: '}' },
    ],
  },
  whyDangerous: [
    {
      title: '무차별 대입(Brute-force) 공격 취약',
      desc: '단순한 4자리 비밀번호는 사전 대입 및 무차별 대입 공격에 수 초 내로 뚫릴 수 있습니다.',
      icon: 'shield',
      iconColor: 'text-low',
    },
  ],
  comparison: {
    current: {
      location: 'src/services/auth.ts',
      code: 'return pwd.length >= 4;',
      label: '현재 (취약함)',
    },
    recommended: {
      location: 'src/services/auth.ts',
      code: 'return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$/.test(pwd);',
      label: '권장 (안전함)',
    },
  },
  isResolved: false,
};

export const mockIssueCors: SecurityIssue = {
  id: 'vuln-cors',
  title: 'CORS 와일드카드 (*) 허용',
  severity: 'medium',
  category: 'network',
  location: 'server.js:18',
  description: '모든 출처(Origin)에 대해 인증 자격 증명을 포함한 요청을 무제한 허용하고 있습니다.',
  codeSnippet: {
    filename: 'server.js',
    startLine: 16,
    highlightLine: 18,
    lines: [
      { num: 16, code: 'const cors = require("cors");' },
      { num: 17, code: 'app.use(cors({' },
      { num: 18, code: '  origin: "*", credentials: true', highlight: true, comment: '// ← 안전하지 않은 CORS' },
      { num: 19, code: '}));' },
    ],
  },
  whyDangerous: [
    {
      title: '악성 사이트로부터의 무단 API 호출 (CSRF)',
      desc: '공격자가 만든 피싱 웹페이지에서 사용자의 로그인 세션을 이용해 비공개 API를 호출할 수 있습니다.',
      icon: 'language',
      iconColor: 'text-medium',
    },
  ],
  comparison: {
    current: {
      location: 'server.js',
      code: 'origin: "*"',
      label: '현재 (취약함)',
    },
    recommended: {
      location: 'server.js',
      code: 'origin: ["https://app.vibeguard.io"]',
      label: '권장 (안전함)',
    },
  },
  isResolved: false,
};

export const mockIssueSensitiveLog: SecurityIssue = {
  id: 'vuln-sensitive-log',
  title: '민감 개인정보 로그 출력',
  severity: 'low',
  category: 'sensitive',
  location: 'utils/logger.js:44',
  description: '사용자 주민등록번호/생년월일 및 휴대폰 번호가 평문으로 콘솔 로그에 기록됩니다.',
  codeSnippet: {
    filename: 'utils/logger.js',
    startLine: 42,
    highlightLine: 44,
    lines: [
      { num: 42, code: 'function logUserRequest(req) {' },
      { num: 43, code: '  // 디버깅용 전체 바디 덤프' },
      { num: 44, code: '  console.log("Payload:", JSON.stringify(req.body));', highlight: true, comment: '// ← 주민번호/카드번호 노출 위험' },
      { num: 45, code: '}' },
    ],
  },
  whyDangerous: [
    {
      title: '개인정보보호법 위반 및 로그 유출',
      desc: '로그 수집 툴(CloudWatch, Datadog)에 저장된 평문 개인정보가 내부자 또는 서드파티에 노출됩니다.',
      icon: 'data_alert',
      iconColor: 'text-low',
    },
  ],
  comparison: {
    current: {
      location: 'utils/logger.js',
      code: 'console.log(req.body)',
      label: '현재 (취약함)',
    },
    recommended: {
      location: 'utils/logger.js',
      code: 'console.log(maskSensitiveFields(req.body))',
      label: '권장 (안전함)',
    },
  },
  isResolved: false,
};

export const initialProjectData: AuditProject = {
  id: 'audit-4091',
  name: 'my-ai-service',
  filename: 'my-ai-service.zip',
  fileSize: '4.8 MB',
  analyzedAt: '2026.08.23 16:30',
  score: 58,
  status: 'critical',
  statusText: '위험 (Risk)',
  statusDesc: '치명적인 취약점이 발견되었습니다. 즉각적인 조치가 필요합니다.',
  stats: {
    totalFiles: 327,
    scannedFiles: 214,
    completedFiles: 184,
    critical: 2,
    high: 3,
    medium: 4,
    low: 2,
    safeCount: 142,
  },
  topActions: [
    mockIssueApiKey,
    mockIssueDbPassword,
    mockIssueClientAuthBypass,
  ],
  issues: [
    mockIssueApiKey,
    mockIssueAdminPassword,
    mockIssueDbPassword,
    mockIssueClientAuthBypass,
    mockIssueXss,
    mockIssueCors,
    mockIssueLog4j,
    mockIssueSqlInjection,
    mockIssueInsecurePort,
    mockIssueSslCert,
    mockIssuePasswordPolicy,
  ],
  comparison: {
    prevScore: 58,
    prevDate: '2023.10.15 14:30',
    newScore: 94,
    newDate: '방금 전',
    scoreDiff: 36,
    resolvedCount: 9,
    remainingCount: 2,
    newIssuesCount: 0,
    resolvedList: [
      {
        title: 'SQL 인젝션 취약점 패치 (로그인 API)',
        desc: '입력값 검증 로직이 강화되어 안전합니다.',
      },
      {
        title: '불필요한 포트 차단 (포트 8080)',
        desc: '외부 접근이 제한되었습니다.',
      },
      {
        title: '만료된 SSL 인증서 갱신',
        desc: 'TLS 1.3 기반의 새 인증서가 적용되었습니다.',
      },
      {
        title: 'API Key 하드코딩 환경변수 분리',
        desc: 'OPENAI_API_KEY가 안전하게 Secret Manager로 이전되었습니다.',
      },
      {
        title: '관리자 비밀번호 평문 제거',
        desc: '하드코딩된 크리덴셜이 제거되고 안전한 인증 토큰 방식이 도입되었습니다.',
      },
      {
        title: '.env.production 저장소 커밋 취소 및 무효화',
        desc: '노출된 데이터베이스 암호가 전면 재발급되었습니다.',
      },
      {
        title: 'JWT 서명 검증 서버 비밀키 적용',
        desc: '클라이언트 위조가 원천 차단되었습니다.',
      },
      {
        title: 'XSS 방어 DOMPurify 살균 필터 적용',
        desc: '사용자 입력 HTML 렌더링 시 악성 태그가 자동 제거됩니다.',
      },
      {
        title: 'CORS 화이트리스트 도메인 명시',
        desc: '와일드카드(*)가 제거되고 공식 서비스 도메인만 허용됩니다.',
      },
    ],
    remainingList: [
      {
        title: '오래된 라이브러리 사용 (Log4j 2.14)',
        desc: '최신 버전(2.17+)으로 업데이트가 필요합니다.',
        guideUrl: '#guide-log4j',
        severity: 'medium',
      },
      {
        title: '비밀번호 정책 강화 권고',
        desc: '특수문자 포함 규칙 적용을 권장합니다.',
        severity: 'low',
      },
    ],
  },
};

export const sampleHistoryList: AuditHistoryItem[] = [
  {
    id: 'rep-4091',
    projectName: 'my-ai-service',
    filename: 'my-ai-service.zip',
    date: '2026.08.23 16:30',
    score: 94,
    prevScore: 58,
    scoreDiff: 36,
    status: 'safe',
    criticalCount: 0,
    highCount: 0,
    medCount: 1,
    resolvedRatio: '9/11 조치 완료',
  },
  {
    id: 'rep-4082',
    projectName: 'vibe-rag-agent',
    filename: 'vibe-rag-agent-v1.2.zip',
    date: '2026.08.20 11:15',
    score: 88,
    prevScore: 72,
    scoreDiff: 16,
    status: 'safe',
    criticalCount: 0,
    highCount: 1,
    medCount: 2,
    resolvedRatio: '5/6 조치 완료',
  },
  {
    id: 'rep-4075',
    projectName: 'ecommerce-payment-api',
    filename: 'payment-service.zip',
    date: '2026.08.15 09:40',
    score: 42,
    status: 'risk',
    criticalCount: 4,
    highCount: 5,
    medCount: 3,
    resolvedRatio: '0/12 조치 필요',
  },
  {
    id: 'rep-4061',
    projectName: 'customer-support-llm',
    filename: 'support-llm.zip',
    date: '2026.08.10 17:05',
    score: 67,
    status: 'warning',
    criticalCount: 1,
    highCount: 2,
    medCount: 4,
    resolvedRatio: '3/7 조치 완료',
  },
];

export const initialAuditHistory = sampleHistoryList;

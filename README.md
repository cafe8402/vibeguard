# VibeGuard

AI로 만든 웹, Windows 스크립트, 브라우저 확장 프로그램 소스를 배포하거나 공유하기 전에 점검하는 브라우저 기반 도구입니다.

파일은 서버로 전송하지 않고 사용자의 브라우저 안에서 분석하며, 발견된 위험의 위치·이유·권장 조치를 쉬운 한국어로 설명합니다.

## 주요 기능

- 프로젝트 ZIP과 여러 코드 파일 동시 분석
- API Key, 비밀번호, Private Key 등 비밀정보 탐지
- 외부 통신과 암호화되지 않은 HTTP 통신 확인
- BAT, CMD, PowerShell의 위험 명령 확인
- Chrome 확장 프로그램의 과도한 권한 확인
- 민감값 자동 마스킹
- AI 수정 프롬프트 복사
- 수정 전후 재점검 결과 비교
- 파일 용량 제한 없음
- 외부 라이브러리와 빌드 산출물 자동 제외
- 테스트·예제·문서·검사 도구의 참고 항목 별도 분류
- 명백한 placeholder 값은 오탐에서 제외하고 실제 형태의 비밀값은 테스트 코드에서도 경고

## 지원 형식

`zip`, `html`, `htm`, `js`, `jsx`, `ts`, `tsx`, `json`, `css`, `env`, `bat`, `cmd`, `ps1`, `yml`, `yaml`

EXE, MSI, DLL 분석과 악성코드 판정은 현재 지원하지 않습니다.

## 실행 방법

Node.js가 설치된 환경에서 처음 한 번 다음 명령을 실행합니다.

```bash
npm install
```

이후 Windows에서는 다음 파일을 더블클릭할 수 있습니다.

- `VibeGuard-서버-시작.bat`: 3005 포트에서 서버 시작
- `VibeGuard-서버-종료.bat`: 실행 중인 VibeGuard 서버 종료

또는 터미널에서 직접 실행할 수 있습니다.

```bash
npm run dev
```

브라우저에서 <http://localhost:3005/>를 엽니다.

## 검증

```bash
npm run lint
npm run test:scanner
npm run scan:self
npm run build
```

`qa-fixtures`에는 웹·스크립트·확장 프로그램 화면 흐름을 확인하기 위한 테스트 전용 파일이 들어 있습니다.

## 보안 안내

VibeGuard는 읽을 수 있는 코드에서 위험 신호를 찾는 배포 전 보조 도구입니다. 분석 결과는 안전 인증이나 악성코드 판정을 의미하지 않습니다. 중요한 결과물은 조직의 보안 정책과 기존 백신·EDR 검사를 함께 적용하세요.

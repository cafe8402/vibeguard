import React, { useRef, useState } from 'react';

interface UploadViewProps {
  onStartScan: (file?: File) => void;
}

export const UploadView: React.FC<UploadViewProps> = ({ onStartScan }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onStartScan(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onStartScan(file);
    }
  };

  return (
    <div className="w-full max-w-container-max px-4 sm:px-6 md:px-8 py-8 md:py-12 mx-auto flex flex-col items-center justify-center">
      {/* Hero Section */}
      <section className="text-center mb-10 w-full max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-full text-[12px] font-medium mb-4">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          AI 코드 보안 감사 스위트
        </div>
        <h1 className="text-[32px] sm:text-[42px] md:text-[46px] font-extrabold text-slate-900 mb-4 leading-tight tracking-tight">
          AI 생성 코드의 보안 취약점을<br />
          <span className="text-blue-600">스마트하고 정확하게</span> 검증하세요
        </h1>
        <p className="text-[15px] sm:text-[16px] text-slate-600 leading-relaxed max-w-2xl mx-auto">
          하드코딩된 API 키, 인증 취약점, 시크릿 유출 및 위험한 코드 패턴을 정밀 스캔하고 원클릭 자동 패치로 안전하게 보호합니다.
        </p>
      </section>

      {/* Upload Card */}
      <section className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 mb-12 relative">
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
          <span className="text-[12px] font-semibold text-slate-800 uppercase tracking-wider">
            소스 아카이브 업로드
          </span>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Security Scan v2.4
          </span>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 sm:p-10 flex flex-col items-center justify-center transition-all cursor-pointer group min-h-[220px] relative ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50 scale-[1.005]'
              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.tar,.gz,.js,.ts,.tsx,.json,.py"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-xs">
            <span className="material-symbols-outlined text-[28px] text-white">
              folder_zip
            </span>
          </div>

          <p className="text-[17px] font-semibold text-slate-900 mb-1">
            이곳에 ZIP 또는 소스코드 파일을 드래그하여 업로드
          </p>
          <p className="text-[13px] text-slate-500 mb-6 font-mono">
            .zip, .tar, .js, .ts, .tsx, .json, .py 지원
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium px-6 py-2.5 rounded-lg shadow-xs transition-all cursor-pointer active:scale-98"
          >
            파일 선택하기
          </button>
        </div>

        {/* Demo Quick Button */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[12.5px] text-slate-500">
            준비된 샘플 프로젝트로 테스트:
          </span>
          <button
            type="button"
            onClick={() => onStartScan()}
            className="text-[12.5px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-lg border border-blue-200/60 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">play_circle</span>
            샘플 프로젝트(my-ai-service.zip) 즉시 검사
          </button>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
        <div className="flex flex-col p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">안전한 데이터 처리</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
            </div>
          </div>
          <h3 className="text-[15px] font-bold text-slate-900 mb-1">
            분석 후 메모리 즉시 삭제
          </h3>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            검사가 완료된 코드는 서버에 남지 않고 즉시 휘발 처리되어 영구적으로 삭제됩니다.
          </p>
        </div>

        <div className="flex flex-col p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">코드 비저장 원칙</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">code_off</span>
            </div>
          </div>
          <h3 className="text-[15px] font-bold text-slate-900 mb-1">
            소스코드 영구 비저장
          </h3>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            어떤 형태로도 귀하의 원본 소스코드를 데이터베이스나 외부 스토리지에 보관하지 않습니다.
          </p>
        </div>

        <div className="flex flex-col p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">프라이빗 세션</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">visibility_off</span>
            </div>
          </div>
          <h3 className="text-[15px] font-bold text-slate-900 mb-1">
            결과는 요청자만 확인
          </h3>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            현재 세션의 브라우저에서만 암호화된 상태로 보안 진단 결과를 안전하게 열람합니다.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full max-w-container-max mb-6">
        <div className="flex items-center justify-between pb-3 mb-6 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
              Inspection Taxonomy
            </span>
            <h2 className="text-[20px] sm:text-[22px] font-bold text-slate-900">
              6대 취약점 검사 영역
            </h2>
          </div>
          <span className="text-[12px] text-slate-500 font-mono">
            OWASP & CWE 표준 준수
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">key</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-[14.5px] font-bold text-slate-900">Credential Leak</h4>
                <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">SEC-01</span>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                하드코딩된 API 키, 마스터 토큰 및 계정 자격 증명 유출을 감지합니다.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-[14.5px] font-bold text-slate-900">Secret Exposure</h4>
                <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">SEC-02</span>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                DB 비밀번호, 프라이빗 인증서 등 민감한 시크릿 정보 유출을 차단합니다.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-[14.5px] font-bold text-slate-900">Authentication</h4>
                <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">SEC-03</span>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                인증 우회, 잘못된 JWT 검증 및 관리자 권한 누수를 검사합니다.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200/80 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">language</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-[14.5px] font-bold text-slate-900">Network Security</h4>
                <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">SEC-04</span>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                비암호화 통신(HTTP), 개방 포트 및 안전하지 않은 CORS 구성을 점검합니다.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/80 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">data_alert</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-[14.5px] font-bold text-slate-900">Sensitive Data</h4>
                <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">SEC-05</span>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                개인 식별 정보(PII) 및 중요 데이터의 평문 로깅 및 저장을 점검합니다.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 border border-red-200/80 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">bug_report</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-[14.5px] font-bold text-slate-900">Dangerous Code</h4>
                <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">SEC-06</span>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                eval, innerHTML, 커맨드 인젝션 등 원격 코드 실행 취약점을 식별합니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

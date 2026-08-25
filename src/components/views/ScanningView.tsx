import React, { useEffect, useState } from 'react';

interface ScanningViewProps {
  filename?: string;
  onComplete: () => void;
}

export const ScanningView: React.FC<ScanningViewProps> = ({
  filename = 'my-ai-service.zip',
  onComplete,
}) => {
  const [progress, setProgress] = useState(15);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [completedCount, setCompletedCount] = useState(48);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 600);
          return 100;
        }

        const next = prev + 3;

        // Sync step and completed files
        if (next < 35) {
          setCurrentStep(1);
          setCompletedCount(Math.min(92, Math.floor((next / 35) * 92)));
        } else if (next < 60) {
          setCurrentStep(2);
          setCompletedCount(Math.min(145, Math.floor(92 + ((next - 35) / 25) * 53)));
        } else if (next < 88) {
          setCurrentStep(3);
          setCompletedCount(Math.min(184, Math.floor(145 + ((next - 60) / 28) * 39)));
        } else {
          setCurrentStep(4);
          setCompletedCount(Math.min(214, Math.floor(184 + ((next - 88) / 12) * 30)));
        }

        return next;
      });
    }, 90);

    return () => clearInterval(timer);
  }, [onComplete]);

  // Circumference for r=44 is 2 * pi * 44 = ~276.46
  const strokeDashoffset = 276.46 - (progress / 100) * 276.46;

  return (
    <div className="w-full max-w-[960px] mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col items-center justify-center">
      {/* Header Title Area */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-full text-[12px] font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          실시간 보안 분석 진행 중
        </div>
        <h1 className="text-[28px] sm:text-[34px] font-bold text-slate-900 leading-tight">
          프로젝트 보안 검사를 진행하고 있습니다
        </h1>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-slate-700">
          <span className="material-symbols-outlined text-slate-500 text-[18px]">
            folder_zip
          </span>
          <span className="font-mono text-[13px] font-medium text-slate-800">
            {filename}
          </span>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Left: Progress Gauge Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-xs p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[320px]">
          <div className="absolute top-4 left-4 text-[11px] font-mono text-slate-400 font-medium">
            SCAN STATUS
          </div>

          <div className="relative w-56 h-56 sm:w-60 sm:h-60 flex items-center justify-center mb-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                className="text-slate-100"
                cx="50"
                cy="50"
                fill="transparent"
                r="44"
                stroke="currentColor"
                strokeWidth="7"
              />
              {/* Progress Track */}
              <circle
                className="text-blue-600 transition-all duration-300 ease-out"
                cx="50"
                cy="50"
                fill="transparent"
                r="44"
                stroke="currentColor"
                strokeDasharray="276.46"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                strokeWidth="7"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[44px] sm:text-[50px] font-extrabold text-slate-900 leading-none tracking-tight">
                {progress}
                <span className="text-[24px] font-medium text-slate-500">%</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500 mt-2">
                {progress === 100 ? '검사 완료' : '정밀 분석 중'}
              </span>
            </div>
          </div>

          <p className="text-[12.5px] text-slate-500 mt-2 flex items-center gap-2 border-t border-slate-100 pt-3 w-full justify-center">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            OWASP 룰셋 및 패턴 매칭 검증 실행 중
          </p>
        </div>

        {/* Right: Steps List Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xs p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
            <h3 className="text-[15px] font-semibold text-slate-900">
              진행 파이프라인
            </h3>
            <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              STEP {currentStep}/4
            </span>
          </div>

          <ul className="flex flex-col flex-1 justify-center space-y-4">
            {/* Step 1 */}
            <li className="relative flex gap-3.5 items-start">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                  currentStep > 1 || (currentStep === 1 && progress > 20)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {currentStep > 1 || (currentStep === 1 && progress > 20) ? (
                  <span className="material-symbols-outlined text-[15px]">check</span>
                ) : (
                  <span className="material-symbols-outlined text-[13px] animate-spin">
                    sync
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-slate-900">
                  01. 파일 구조 분석
                </span>
                <span className="text-[12px] text-slate-500">
                  디렉토리 및 패키지 의존성 파악
                </span>
              </div>
            </li>

            {/* Step 2 */}
            <li className="relative flex gap-3.5 items-start">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                  currentStep > 2
                    ? 'bg-emerald-600 text-white'
                    : currentStep === 2
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {currentStep > 2 ? (
                  <span className="material-symbols-outlined text-[15px]">check</span>
                ) : currentStep === 2 ? (
                  <span className="material-symbols-outlined text-[13px] animate-spin">
                    sync
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                )}
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-[14px] ${
                    currentStep >= 2 ? 'font-semibold text-slate-900' : 'text-slate-400'
                  }`}
                >
                  02. 분석 대상 선별
                </span>
                <span className="text-[12px] text-slate-500">
                  스캔 대상 소스 파일 214개 분류
                </span>
              </div>
            </li>

            {/* Step 3 */}
            <li
              className={`relative flex gap-3.5 items-start transition-all p-2 -mx-2 rounded-lg ${
                currentStep === 3 ? 'bg-blue-50/60' : ''
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors mt-0.5 ${
                  currentStep > 3
                    ? 'bg-emerald-600 text-white'
                    : currentStep === 3
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {currentStep > 3 ? (
                  <span className="material-symbols-outlined text-[15px]">check</span>
                ) : currentStep === 3 ? (
                  <span className="material-symbols-outlined text-[13px] animate-spin">
                    sync
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                )}
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-[14px] ${
                    currentStep === 3
                      ? 'font-semibold text-slate-900'
                      : currentStep > 3
                      ? 'font-semibold text-slate-900'
                      : 'text-slate-400'
                  }`}
                >
                  03. Secret & Credential 검사
                </span>
                <span className="text-[12px] text-slate-500">
                  {currentStep === 3
                    ? 'API 키 및 민감 자격 증명 탐색 중...'
                    : 'API 키 및 환경변수 분석'}
                </span>
              </div>
            </li>

            {/* Step 4 */}
            <li className="relative flex gap-3.5 items-start">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                  currentStep === 4 && progress >= 100
                    ? 'bg-emerald-600 text-white'
                    : currentStep === 4
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {currentStep === 4 && progress >= 100 ? (
                  <span className="material-symbols-outlined text-[15px]">check</span>
                ) : currentStep === 4 ? (
                  <span className="material-symbols-outlined text-[13px] animate-spin">
                    sync
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                )}
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-[14px] ${
                    currentStep === 4 ? 'font-semibold text-slate-900' : 'text-slate-400'
                  }`}
                >
                  04. 인증 로직 & 보안 검증
                </span>
                <span className="text-[12px] text-slate-500">
                  {currentStep === 4 ? '취약 함수 및 보안 결함 종합 평가' : '대기 중'}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Stats Row */}
      <div className="w-full grid grid-cols-3 bg-white border border-slate-200 rounded-xl shadow-xs divide-x divide-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 mb-1">
            전체 파일
          </span>
          <span className="text-[24px] sm:text-[28px] font-bold text-slate-900">
            327
          </span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 mb-1">
            검사 대상 파일
          </span>
          <span className="text-[24px] sm:text-[28px] font-bold text-slate-900">
            214
          </span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col items-center justify-center text-center hover:bg-emerald-50/50 transition-colors bg-slate-50/50">
          <span className="text-[11px] font-semibold text-emerald-700 mb-1">
            스캔 완료 파일
          </span>
          <span className="text-[24px] sm:text-[28px] font-extrabold text-emerald-600">
            {completedCount}
          </span>
        </div>
      </div>

      {/* Skip button */}
      <button
        onClick={onComplete}
        className="mt-6 text-[12.5px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer bg-white hover:bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 shadow-2xs transition-colors"
      >
        <span>스캔 건너뛰고 즉시 결과 확인</span>
        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
      </button>
    </div>
  );
};

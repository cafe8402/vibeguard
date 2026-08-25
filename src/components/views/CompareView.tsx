import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { AuditProject } from '../../types';

interface CompareViewProps {
  project: AuditProject;
  onViewReport: () => void;
  onNavigateHistory: () => void;
  onOpenGuide: () => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  project,
  onViewReport,
  onOpenGuide,
}) => {
  const comparison = project.comparison;

  useEffect(() => {
    // Fire celebratory confetti once
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#059669', '#3B82F6', '#10B981'],
      });
    } catch {
      // ignore
    }
  }, []);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('비교 리포트 링크가 클립보드에 복사되었습니다.');
    }
  };

  return (
    <div className="w-full max-w-container-max mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      {/* Page Title */}
      <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
              Audit Delta
            </span>
            <span className="text-[12px] text-slate-500 font-mono">
              Re-evaluation Report
            </span>
          </div>
          <h1 className="text-[24px] sm:text-[28px] font-bold text-slate-900 leading-tight">
            재점검 결과 비교
          </h1>
          <p className="text-[13.5px] text-slate-600 mt-1">
            이전 점검 대비 취약점 조치 현황 및 보안 점수 상승 지표를 확인하세요.
          </p>
        </div>

        <button
          onClick={handleShare}
          className="bg-white border border-slate-200 text-slate-700 px-3.5 py-2 text-[13px] font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[16px] text-slate-500">share</span>
          리포트 공유
        </button>
      </div>

      {/* Score Comparison Hero */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-14 relative overflow-hidden">
        {/* Old Score */}
        <div className="flex flex-col items-center gap-2 z-10">
          <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
            이전 점검 점수
          </p>
          <div className="relative w-36 h-36 sm:w-40 sm:h-40">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-slate-100"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
              />
              <circle
                className="text-amber-500"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="currentColor"
                strokeDasharray="251.2"
                strokeDashoffset="105.5"
                strokeWidth="8"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-[32px] sm:text-[36px] font-bold text-slate-800">
                {comparison?.prevScore || 58}
              </span>
              <span className="text-[11px] text-amber-600 font-semibold uppercase tracking-wider">
                Fair
              </span>
            </div>
          </div>
          <p className="text-[12px] text-slate-400 font-mono">
            {comparison?.prevDate || '2023.10.15 14:30'}
          </p>
        </div>

        {/* Arrow & Improvement Text */}
        <div className="flex flex-col items-center gap-3 z-10">
          <div className="bg-emerald-600 text-white px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold flex items-center gap-1.5 shadow-xs">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            +{comparison?.scoreDiff || 36}점 상승
          </div>
          <span className="material-symbols-outlined text-slate-300 text-[32px] md:text-[38px] hidden md:block">
            arrow_forward
          </span>
          <span className="material-symbols-outlined text-slate-300 text-[26px] md:hidden">
            arrow_downward
          </span>
        </div>

        {/* New Score */}
        <div className="flex flex-col items-center gap-2 z-10">
          <p className="text-[12px] font-semibold text-slate-900 uppercase tracking-wider">
            현재 재점검 점수
          </p>
          <div className="relative w-40 h-40 sm:w-44 sm:h-44">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-slate-100"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
              />
              <circle
                className="text-emerald-600"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="currentColor"
                strokeDasharray="251.2"
                strokeDashoffset="15"
                strokeLinecap="round"
                strokeWidth="8"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-[38px] sm:text-[44px] font-extrabold text-emerald-600">
                {comparison?.newScore || 94}
              </span>
              <span className="text-[11.5px] text-emerald-700 font-semibold uppercase tracking-wider">
                Excellent
              </span>
            </div>
          </div>
          <p className="text-[12px] text-slate-500 font-mono">
            {comparison?.newDate || '방금 전'}
          </p>
        </div>
      </div>

      {/* Bento Grid Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Resolved */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">check_circle</span>
          </div>
          <div>
            <p className="text-[12px] text-slate-500 font-medium">
              조치 완료된 항목
            </p>
            <p className="text-[24px] font-bold text-slate-900 leading-tight mt-0.5">
              {comparison?.resolvedCount || 9}
              <span className="text-[14px] text-slate-500 ml-1 font-normal">
                개
              </span>
            </p>
          </div>
        </div>

        {/* Card 2: Remaining */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">warning</span>
          </div>
          <div>
            <p className="text-[12px] text-slate-500 font-medium">
              잔여 조치 항목
            </p>
            <p className="text-[24px] font-bold text-slate-900 leading-tight mt-0.5">
              {comparison?.remainingCount || 2}
              <span className="text-[14px] text-slate-500 ml-1 font-normal">
                개
              </span>
            </p>
          </div>
        </div>

        {/* Card 3: New */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">info</span>
          </div>
          <div>
            <p className="text-[12px] text-slate-500 font-medium">
              신규 감지 항목
            </p>
            <p className="text-[24px] font-bold text-slate-900 leading-tight mt-0.5">
              {comparison?.newIssuesCount || 0}
              <span className="text-[14px] text-slate-500 ml-1 font-normal">
                개
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Lists (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Resolved Issues List */}
        <div className="bg-white border border-slate-200 rounded-xl flex flex-col shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[19px]">
                task_alt
              </span>
              <h3 className="text-[15px] font-semibold text-slate-900">
                조치 완료 항목
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              Resolved
            </span>
          </div>

          <ul className="p-4 space-y-2 flex-1">
            {comparison?.resolvedList.map((item, idx) => (
              <li
                key={idx}
                className="p-3 border border-slate-100 rounded-lg bg-slate-50/40 hover:bg-slate-50 flex items-start gap-3 transition-colors"
              >
                <span className="material-symbols-outlined text-emerald-600 mt-0.5 text-[17px]">
                  check
                </span>
                <div>
                  <p className="text-[13.5px] font-medium text-slate-900">
                    {item.title}
                  </p>
                  <p className="text-[12.5px] text-slate-600 mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Remaining Issues List */}
        <div className="bg-white border border-slate-200 rounded-xl flex flex-col shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-[19px]">
                pending_actions
              </span>
              <h3 className="text-[15px] font-semibold text-slate-900">
                미조치 항목 (조치 권장)
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              Pending
            </span>
          </div>

          <ul className="p-4 space-y-2 flex-1">
            {comparison?.remainingList.map((item, idx) => {
              const isMedium = item.severity === 'medium';
              return (
                <li
                  key={idx}
                  className={`p-3 border rounded-lg flex items-start gap-3 transition-colors ${
                    isMedium
                      ? 'bg-amber-50/40 border-amber-200/70'
                      : 'bg-slate-50/40 border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined mt-0.5 text-[17px] ${
                      isMedium ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  >
                    {isMedium ? 'error_outline' : 'info'}
                  </span>
                  <div className="flex-1">
                    <p className="text-[13.5px] font-medium text-slate-900">
                      {item.title}
                    </p>
                    <p className="text-[12.5px] text-slate-600 mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  {item.guideUrl && (
                    <button
                      onClick={onOpenGuide}
                      className="text-blue-600 text-[12px] font-medium hover:underline whitespace-nowrap self-center cursor-pointer"
                    >
                      가이드 보기
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Success Banner / CTA */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-5 shadow-sm">
        <div className="flex items-center gap-4 z-10">
          <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">celebration</span>
          </div>
          <div>
            <h2 className="text-[17px] sm:text-[19px] font-bold text-white">
              보안 취약점 조치가 성공적으로 반영되었습니다
            </h2>
            <p className="text-[13px] text-slate-300 mt-0.5">
              주요 핵심 취약점이 해결되어 안정적인 배포 기준을 충족했습니다.
            </p>
          </div>
        </div>

        <div className="z-10 flex gap-3 w-full md:w-auto">
          <button
            onClick={onViewReport}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
          >
            <span>상세 리포트 보기</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};

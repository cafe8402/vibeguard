import React, { useState } from 'react';
import { SecurityIssue } from '../../types';

interface DetailViewProps {
  issue: SecurityIssue;
  onBack: () => void;
  onToggleResolve: (issueId: string) => void;
  onRequestAiFix: (issue: SecurityIssue) => void;
}

export const DetailView: React.FC<DetailViewProps> = ({
  issue,
  onBack,
  onToggleResolve,
  onRequestAiFix,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    const fullCode = issue.codeSnippet.lines.map((l) => l.code).join('\n');
    navigator.clipboard.writeText(fullCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isResolved = issue.isResolved;

  return (
    <div className="w-full max-w-container-max mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-6">
      {/* Breadcrumbs & Back */}
      <div className="flex items-center gap-2 text-slate-500 text-[12.5px]">
        <button
          onClick={onBack}
          className="hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer font-medium"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          대시보드
        </button>
        <span className="text-slate-300">/</span>
        <span className="hover:text-slate-800 cursor-pointer" onClick={onBack}>
          취약점 진단서
        </span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-medium">{issue.title}</span>
      </div>

      {/* Header Section */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11.5px] font-medium rounded-md border ${
              issue.severity === 'critical'
                ? 'bg-red-50 text-red-700 border-red-200'
                : issue.severity === 'high'
                ? 'bg-orange-50 text-orange-700 border-orange-200'
                : issue.severity === 'medium'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {issue.severity === 'critical' ? 'error' : 'warning'}
            </span>
            <span className="capitalize">{issue.severity}</span>
          </span>

          <h1 className="text-[24px] sm:text-[28px] font-bold text-slate-900 leading-tight">
            {issue.title}
          </h1>

          {isResolved && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[11.5px] font-medium rounded-md">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              조치 완료됨
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-700 font-mono text-[12.5px] bg-slate-100 px-3 py-1.5 rounded-lg w-fit border border-slate-200">
          <span className="material-symbols-outlined text-[16px] text-slate-500">folder_open</span>
          <span>{issue.location}</span>
        </div>
      </div>

      {/* Top: Code Viewer Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
          <h3 className="text-[14px] font-semibold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-slate-500">
              code
            </span>
            취약점 발견 소스 라인
          </h3>

          <button
            onClick={handleCopyCode}
            className="text-slate-700 text-[12px] font-medium flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer shadow-2xs transition-colors"
          >
            <span className="material-symbols-outlined text-[14px] text-slate-500">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? '복사됨!' : '코드 복사'}</span>
          </button>
        </div>

        <div className="p-5 bg-slate-900 text-slate-100 overflow-x-auto relative">
          <div className="font-mono text-[12.5px] whitespace-pre min-w-max relative z-10 leading-relaxed">
            {issue.codeSnippet.lines.map((line) => (
              <div
                key={line.num}
                className={`flex items-center ${
                  line.highlight
                    ? 'bg-red-950/80 -mx-5 px-5 border-l-4 border-amber-400 text-amber-200 font-medium py-1.5 my-1'
                    : 'py-0.5 text-slate-300'
                }`}
              >
                <span className="text-slate-500 w-12 text-right select-none pr-4 shrink-0 font-mono text-[12px]">
                  {line.num}
                </span>
                <span className="flex-1">
                  {line.code}
                  {line.comment && (
                    <span className="text-amber-400 text-[11.5px] ml-4 font-mono font-normal">
                      /* {line.comment} */
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle: Bento Grid (Why Dangerous & Current vs Recommended) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Why is it dangerous? */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-[15px] font-semibold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-600 text-[19px]">
                warning
              </span>
              보안 위험 분석
            </h3>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Impact
            </span>
          </div>

          <div className="flex flex-col gap-4 mt-1">
            {issue.whyDangerous.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <div className="w-full h-[1px] bg-slate-100"></div>}
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[17px] text-slate-600">
                      {item.icon}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-slate-900">
                      {item.title}
                    </h4>
                    <p className="text-[13px] text-slate-600 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Card 2: Diagram (Current vs Recommended) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-[15px] font-semibold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[19px]">
                architecture
              </span>
              현재 구조 vs 권장 구조
            </h3>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Remediation
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center gap-3 mt-1">
            {/* Current (Bad) */}
            <div className="w-full bg-red-50/50 border border-red-200/70 rounded-lg p-3.5 flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[17px]">lock_open</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-red-700 font-semibold uppercase tracking-wider block">
                  {issue.comparison.current.label}
                </span>
                <p className="font-mono text-[12px] text-slate-800 mt-1 bg-white border border-red-200 px-2 py-0.5 rounded inline-block max-w-full truncate">
                  {issue.comparison.current.code}
                </p>
              </div>
            </div>

            {/* Arrow */}
            <span className="material-symbols-outlined text-slate-400 text-[18px]">
              arrow_downward
            </span>

            {/* Recommended (Good) */}
            <div className="w-full bg-emerald-50/50 border border-emerald-200/70 rounded-lg p-3.5 flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[17px]">
                  verified_user
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wider block">
                  {issue.comparison.recommended.label}
                </span>
                <p className="font-mono text-[12px] text-slate-800 mt-1 bg-white border border-emerald-200 px-2 py-0.5 rounded inline-block max-w-full truncate font-medium">
                  {issue.comparison.recommended.code}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Actions */}
      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 pt-5 border-t border-slate-200">
        <button
          onClick={() => onToggleResolve(issue.id)}
          className={`px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all flex items-center justify-center gap-2 cursor-pointer border ${
            isResolved
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">
            {isResolved ? 'check_circle' : 'task_alt'}
          </span>
          <span>{isResolved ? '조치 완료됨 (클릭하여 취소)' : '조치 완료로 표시'}</span>
        </button>

        <button
          onClick={() => onRequestAiFix(issue)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-medium transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
        >
          <span className="material-symbols-outlined text-[17px]">auto_awesome</span>
          <span>AI에게 수정 요청하기</span>
        </button>
      </div>
    </div>
  );
};

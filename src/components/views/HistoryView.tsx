import React from 'react';
import { AuditHistoryItem } from '../../types';

interface HistoryViewProps {
  historyList: AuditHistoryItem[];
  onSelectReport: (reportId: string) => void;
  onNewScan: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  historyList,
  onSelectReport,
  onNewScan,
}) => {
  return (
    <div className="w-full max-w-container-max mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              ARCHIVES
            </span>
            <span className="text-[12px] text-slate-500 font-medium">
              보안 감사 타임라인
            </span>
          </div>
          <h1 className="text-[24px] sm:text-[28px] font-bold text-slate-900">
            보안 점검 기록 (Audit History)
          </h1>
          <p className="text-[14px] text-slate-600 mt-1">
            프로젝트별 과거 점검 이력과 보안 점수 변동 추이를 확인하세요.
          </p>
        </div>

        <button
          onClick={onNewScan}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-[13px] px-4 py-2.5 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer active:scale-98"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>새 프로젝트 점검하기</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {historyList.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectReport(item.id)}
              className="p-5 sm:p-6 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors shrink-0">
                  <span className="material-symbols-outlined text-[22px]">folder_zip</span>
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-[16px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.projectName}
                    </h3>
                    <span className="font-mono text-[11px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                      {item.filename}
                    </span>
                    <span className="text-[12px] text-slate-400">
                      {item.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[12.5px] text-slate-600">
                    <span className="text-emerald-700 font-semibold">{item.resolvedRatio}</span>
                    <span>•</span>
                    <span className="text-rose-700 font-medium">Critical {item.criticalCount}</span>
                    <span>•</span>
                    <span className="text-amber-700 font-medium">High {item.highCount}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span
                      className={`text-[22px] font-extrabold ${
                        item.score >= 80
                          ? 'text-emerald-600'
                          : item.score >= 50
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {item.score}점
                    </span>
                    {item.scoreDiff && (
                      <span className="font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        +{item.scoreDiff} PTS
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] uppercase text-slate-400 font-semibold tracking-wider">
                    보안 점수
                  </span>
                </div>

                <button className="text-slate-700 font-medium text-[12.5px] flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                  <span>리포트 열기</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

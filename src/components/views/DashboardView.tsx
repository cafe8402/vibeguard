import React, { useState } from 'react';
import { AuditProject, SecurityIssue, Severity } from '../../types';

interface DashboardViewProps {
  project: AuditProject;
  onSelectIssue: (issue: SecurityIssue) => void;
  onDownloadReport: () => void;
  onNavigateCompare: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  onSelectIssue,
  onDownloadReport,
  onNavigateCompare,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [tableSearch, setTableSearch] = useState('');
  const [showAllRows, setShowAllRows] = useState(false);

  // Filter issues according to tab and table search
  const filteredIssues = project.issues.filter((issue) => {
    // Tab filter
    if (activeTab === 'critical' && issue.severity !== 'critical') return false;
    if (activeTab === 'high' && issue.severity !== 'high') return false;
    if (activeTab === 'medium' && issue.severity !== 'medium') return false;
    if (activeTab === 'low' && issue.severity !== 'low') return false;
    if (activeTab === 'safe' && !issue.isResolved) return false;

    // Search filter
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      return (
        issue.title.toLowerCase().includes(q) ||
        issue.location.toLowerCase().includes(q) ||
        issue.description.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const displayedIssues = showAllRows ? filteredIssues : filteredIssues.slice(0, 6);

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200/80 px-2.5 py-0.5 rounded-md text-[11.5px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200/80 px-2.5 py-0.5 rounded-md text-[11.5px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-0.5 rounded-md text-[11.5px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200/80 px-2.5 py-0.5 rounded-md text-[11.5px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Low
          </span>
        );
      case 'safe':
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-md text-[11.5px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Safe
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-container-max mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      {/* Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[12px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
              Audit Report
            </span>
            <span className="text-[12px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
              {project.filename}
            </span>
          </div>
          <h1 className="text-[24px] sm:text-[28px] font-bold text-slate-900 mt-1.5 leading-tight tracking-tight">
            {project.name}
          </h1>
          <p className="text-[13px] text-slate-500 flex items-center gap-1.5 mt-1">
            <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
            분석 일시: {project.analyzedAt}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onNavigateCompare}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all border border-slate-200 shadow-xs cursor-pointer active:scale-98"
          >
            <span className="material-symbols-outlined text-[17px] text-slate-500">compare_arrows</span>
            재점검 비교 보기
          </button>
          <button
            onClick={onDownloadReport}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <span className="material-symbols-outlined text-[17px]">download</span>
            리포트 다운로드
          </button>
        </div>
      </div>

      {/* Top Fold: 40/60 Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 40%: Score Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-xs p-6 flex flex-col items-center justify-center relative">
          <div className="flex justify-between items-center w-full border-b border-slate-100 pb-3 mb-5">
            <h3 className="text-[15px] font-semibold text-slate-900">
              종합 보안 평가 점수
            </h3>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              SECURITY SCORE
            </span>
          </div>

          {/* Circular Gauge */}
          <div className="relative w-40 h-40 sm:w-44 sm:h-44 mb-3">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                fill="none"
                r="40"
                stroke="#F1F5F9"
                strokeWidth="9"
              />
              {/* Progress Circle */}
              <circle
                className="transition-all duration-1000 ease-out text-blue-600"
                cx="50"
                cy="50"
                fill="none"
                r="40"
                stroke="currentColor"
                strokeDasharray="251.2"
                strokeDashoffset="105.5"
                strokeLinecap="round"
                strokeWidth="9"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[42px] font-extrabold text-slate-900 leading-none tracking-tight">
                {project.score}
              </span>
              <span className="text-[11px] font-medium text-slate-400 mt-1">
                / 100 점
              </span>
            </div>
          </div>

          <div className="text-center mb-5">
            <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-[12px] font-semibold mb-1.5">
              <span className="material-symbols-outlined text-[15px]">warning</span>
              {project.statusText}
            </span>
            <p className="text-[13px] text-slate-500 max-w-xs mx-auto leading-relaxed">
              {project.statusDesc}
            </p>
          </div>

          {/* Severity Breakdown Badges */}
          <div className="grid grid-cols-4 gap-2 w-full mt-auto pt-4 border-t border-slate-100">
            <div className="flex flex-col items-center p-2.5 rounded-lg bg-red-50/60 border border-red-100">
              <span className="text-[11px] text-red-700 font-semibold">
                Critical
              </span>
              <span className="text-[18px] font-bold text-red-900">
                {project.stats.critical}
              </span>
            </div>
            <div className="flex flex-col items-center p-2.5 rounded-lg bg-orange-50/60 border border-orange-100">
              <span className="text-[11px] text-orange-700 font-semibold">
                High
              </span>
              <span className="text-[18px] font-bold text-orange-900">
                {project.stats.high}
              </span>
            </div>
            <div className="flex flex-col items-center p-2.5 rounded-lg bg-amber-50/60 border border-amber-100">
              <span className="text-[11px] text-amber-700 font-semibold">
                Medium
              </span>
              <span className="text-[18px] font-bold text-amber-900">
                {project.stats.medium}
              </span>
            </div>
            <div className="flex flex-col items-center p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
              <span className="text-[11px] text-blue-700 font-semibold">
                Low
              </span>
              <span className="text-[18px] font-bold text-blue-900">
                {project.stats.low}
              </span>
            </div>
          </div>
        </div>

        {/* Right 60%: Action Items */}
        <div className="lg:col-span-7 flex flex-col gap-3.5">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <h3 className="text-[16px] font-semibold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600 text-[20px]">priority_high</span>
              최우선 조치 3대 취약점
            </h3>
            <span className="text-[12px] font-medium text-slate-400">
              Action Required
            </span>
          </div>

          <div className="space-y-3">
            {/* Action Item 1 */}
            <div
              onClick={() => onSelectIssue(project.topActions[0] || project.issues[0])}
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer group flex items-start gap-4"
            >
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[19px]">key</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h4 className="text-[14.5px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    1. API Key 하드코딩 노출
                  </h4>
                  <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[11px] font-semibold shrink-0">
                    Critical
                  </span>
                </div>
                <p className="text-[13px] text-slate-600 mb-2.5">
                  소스코드 <code className="font-mono text-[12px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">config/auth.js</code> 42번째 줄에 OpenAI API Key가 평문으로 노출되어 있습니다.
                </p>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[12px] overflow-x-auto leading-relaxed">
                  <div className="text-slate-500 select-none">41: const model = "gpt-4";</div>
                  <div className="text-amber-300 font-medium -mx-3 px-3 py-0.5 bg-slate-800/80">
                    42: const apiKey = "[REDACTED_API_KEY]";
                  </div>
                  <div className="text-slate-500 select-none">43: const client = new OpenAI(&#123; apiKey &#125;);</div>
                </div>
              </div>
            </div>

            {/* Action Item 2 */}
            <div
              onClick={() => onSelectIssue(project.topActions[1] || project.issues[1])}
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer group flex items-start gap-4"
            >
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[19px]">password</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h4 className="text-[14.5px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    2. 관리자 데이터베이스 비밀번호 노출
                  </h4>
                  <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[11px] font-semibold shrink-0">
                    Critical
                  </span>
                </div>
                <p className="text-[13px] text-slate-600">
                  환경 변수 설정 파일 <code className="font-mono text-[12px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">.env.production</code>이 저장소에 커밋되어 노출되었습니다.
                </p>
              </div>
            </div>

            {/* Action Item 3 */}
            <div
              onClick={() => onSelectIssue(project.topActions[2] || project.issues[2])}
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer group flex items-start gap-4"
            >
              <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[19px]">gpp_bad</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h4 className="text-[14.5px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    3. 클라이언트 인증 로직 우회 가능
                  </h4>
                  <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded text-[11px] font-semibold shrink-0">
                    High
                  </span>
                </div>
                <p className="text-[13px] text-slate-600">
                  <code className="font-mono text-[12px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">middleware/verify.js</code>에서 JWT 토큰 검증 시 서버 비밀키가 아닌 클라이언트 제공 값을 신뢰하는 결함이 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Issues Table Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Table Header & Search */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-[16px] font-semibold text-slate-900">
              상세 취약점 발견 목록
            </h3>
            <p className="text-[12.5px] text-slate-500 mt-0.5">
              전체 보안 감사 항목을 위험도별로 조회하고 AI 권장 패치를 확인하세요.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[17px]">
                search
              </span>
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="이슈명 또는 파일명 검색..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-normal text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <button 
              onClick={() => {
                setActiveTab(activeTab === 'all' ? 'critical' : 'all');
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg text-slate-700 p-2 hover:bg-slate-100 transition-colors cursor-pointer"
              title="위험도 필터 토글"
            >
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/50 px-4 sm:px-6 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2.5 px-3 text-[13px] font-medium whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({project.issues.length})
          </button>
          <button
            onClick={() => setActiveTab('critical')}
            className={`py-2.5 px-3 text-[13px] font-medium whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
              activeTab === 'critical'
                ? 'border-red-600 text-red-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Critical ({project.stats.critical})
          </button>
          <button
            onClick={() => setActiveTab('high')}
            className={`py-2.5 px-3 text-[13px] font-medium whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
              activeTab === 'high'
                ? 'border-orange-600 text-orange-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            High ({project.stats.high})
          </button>
          <button
            onClick={() => setActiveTab('medium')}
            className={`py-2.5 px-3 text-[13px] font-medium whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
              activeTab === 'medium'
                ? 'border-amber-600 text-amber-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Medium ({project.stats.medium})
          </button>
          <button
            onClick={() => setActiveTab('low')}
            className={`py-2.5 px-3 text-[13px] font-medium whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
              activeTab === 'low'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Low ({project.stats.low})
          </button>
          <button
            onClick={() => setActiveTab('safe')}
            className={`py-2.5 px-3 text-[13px] font-medium whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
              activeTab === 'safe'
                ? 'border-emerald-600 text-emerald-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Safe ({project.stats.safeCount})
          </button>
        </div>

        {/* Issues Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[12px] text-slate-500 font-semibold">
                <th className="py-3 px-5 w-32">위험도</th>
                <th className="py-3 px-5">이슈명</th>
                <th className="py-3 px-5">파일 경로 및 위치</th>
                <th className="py-3 px-5 text-right w-28">진단서</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {displayedIssues.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-500">
                    해당 조건에 일치하는 취약점 항목이 없습니다.
                  </td>
                </tr>
              ) : (
                displayedIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    onClick={() => onSelectIssue(issue)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-5">{getSeverityBadge(issue.severity)}</td>
                    <td className="py-3.5 px-5 font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                      {issue.title}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[12.5px] text-slate-600">
                      {issue.location}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectIssue(issue);
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium text-[12.5px] inline-flex items-center justify-end gap-0.5 cursor-pointer ml-auto"
                      >
                        <span>상세보기</span>
                        <span className="material-symbols-outlined text-[16px]">
                          chevron_right
                        </span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Expand / Collapse Footer */}
        {filteredIssues.length > 6 && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/40 flex justify-center">
            <button
              onClick={() => setShowAllRows(!showAllRows)}
              className="text-slate-700 hover:text-blue-600 font-medium text-[12.5px] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{showAllRows ? '목록 접기' : `전체 ${filteredIssues.length}개 항목 보기`}</span>
              <span className="material-symbols-outlined text-[16px]">
                {showAllRows ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { SecurityIssue } from '../../types';

interface AiFixModalProps {
  issue: SecurityIssue | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyFix: (issueId: string, patchedCodeSnippet?: any) => void;
}

export const AiFixModal: React.FC<AiFixModalProps> = ({
  issue,
  isOpen,
  onClose,
  onApplyFix,
}) => {
  const [activeTab, setActiveTab] = useState<'diff' | 'env' | 'explanation'>('diff');
  const [isApplying, setIsApplying] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !issue) return null;

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      onApplyFix(issue.id);
      setIsApplying(false);
      onClose();
    }, 600);
  };

  const handleCopyPatch = () => {
    const patchCode = issue.aiSuggestedFix?.patchedCode || issue.comparison.recommended.code;
    navigator.clipboard.writeText(patchCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[17px] sm:text-[19px] font-bold text-slate-900">
                  AI 자동 코드 패치 제안
                </h3>
                <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded">
                  AI Patch
                </span>
              </div>
              <p className="text-[12.5px] text-slate-500 font-mono mt-0.5">
                {issue.title} ({issue.location})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6 gap-2">
          <button
            onClick={() => setActiveTab('diff')}
            className={`py-3 px-3 text-[13px] font-medium cursor-pointer transition-colors border-b-2 ${
              activeTab === 'diff'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            코드 수정 비교 (Diff)
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`py-3 px-3 text-[13px] font-medium cursor-pointer transition-colors border-b-2 ${
              activeTab === 'env'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            환경변수 (.env) 가이드
          </button>
          <button
            onClick={() => setActiveTab('explanation')}
            className={`py-3 px-3 text-[13px] font-medium cursor-pointer transition-colors border-b-2 ${
              activeTab === 'explanation'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            보안 개선 원리
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'diff' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-slate-600">
                  하드코딩된 평문 값을 <code className="font-mono text-[12px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-800">process.env</code> 환경 변수 및 안전한 유효성 검증으로 대체합니다.
                </p>
                <button
                  onClick={handleCopyPatch}
                  className="text-slate-700 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-[12px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px] text-slate-500">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>{copied ? '복사됨!' : '패치 코드 복사'}</span>
                </button>
              </div>

              {/* Before Code (Critical Red) */}
              <div className="border border-red-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-red-50/80 border-b border-red-200 px-4 py-2 text-[12px] font-semibold text-red-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">remove_circle</span>
                    수정 전 (취약한 원본 코드)
                  </span>
                  <span className="font-mono text-[11px] text-red-600">{issue.location}</span>
                </div>
                <div className="p-4 bg-slate-900 font-mono text-[12px] text-red-300 overflow-x-auto whitespace-pre leading-relaxed">
                  {issue.comparison.current.code}
                </div>
              </div>

              {/* After Code (Safe Green) */}
              <div className="border border-emerald-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-emerald-50/80 border-b border-emerald-200 px-4 py-2 text-[12px] font-semibold text-emerald-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    수정 후 (AI 권장 보안 패치)
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium">권장 보안 패턴</span>
                </div>
                <div className="p-4 bg-slate-900 font-mono text-[12px] text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed">
                  {issue.aiSuggestedFix?.patchedCode || `// 안전한 환경 변수 로드 및 유효성 검사\nconst ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;\nif (!ADMIN_PASSWORD) {\n  throw new Error("ADMIN_PASSWORD 환경 변수가 설정되지 않았습니다.");\n}`}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'env' && (
            <div className="space-y-3">
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="text-[15px] font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">tune</span>
                  .env 및 .env.example 파일 설정
                </h4>
                <p className="text-[13px] text-slate-600 mb-3 leading-relaxed">
                  프로젝트 루트에 <code className="font-mono text-[12px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-800">.env</code> 파일을 만들고 아래와 같이 값을 주입하세요. (Git 저장소에 .env가 커밋되지 않도록 .gitignore에 추가해야 합니다.)
                </p>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-[12px] overflow-x-auto leading-relaxed">
                  <span className="text-slate-400"># .env (로컬 및 배포 서버 시크릿)</span><br />
                  ADMIN_PASSWORD="[VALUE_FROM_ENV]"<br />
                  OPENAI_API_KEY="[REDACTED_API_KEY]"<br />
                  DB_PASSWORD="[VALUE_FROM_ENV]"
                </div>
              </div>
            </div>
          )}

          {activeTab === 'explanation' && (
            <div className="space-y-4">
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="text-[15px] font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[19px]">verified</span>
                  12-Factor App 보안 가이드라인 준수
                </h4>
                <p className="text-[13px] text-slate-600 leading-relaxed mb-3">
                  소스 코드와 환경 설정을 엄격히 분리하여, 저장소가 노출되거나 협업자가 코드를 열람하더라도 서비스 운영 크리덴셜 및 민감 토큰이 노출되지 않도록 보호합니다.
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-slate-600 text-[13px]">
                  <li>배포 환경별(개발/스테이징/프로덕션) 비밀번호 즉시 교체 가능</li>
                  <li>코드 재빌드 없이 시크릿 순환(Key Rotation) 가능</li>
                  <li>GitHub 커밋 히스토리에 영구 보존되는 위험 원천 차단</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-[12.5px] text-slate-500">
            <span className="material-symbols-outlined text-emerald-600 text-[17px]">verified_user</span>
            <span>적용 시 취약점 상태가 즉시 해결(Resolved)로 갱신됩니다.</span>
          </div>

          <div className="flex gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 text-[13px] font-medium transition-colors cursor-pointer border border-slate-200 rounded-lg bg-white shadow-2xs"
            >
              닫기
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[17px]">
                {isApplying ? 'refresh' : 'check_circle'}
              </span>
              <span>{isApplying ? '패치 적용 중...' : '수정 사항 적용하기'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

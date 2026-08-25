import React from 'react';

interface GuideViewProps {
  onBackToDashboard: () => void;
}

export const GuideView: React.FC<GuideViewProps> = ({ onBackToDashboard }) => {
  return (
    <div className="w-full max-w-container-max mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[12px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded">
              Security Standards
            </span>
            <span className="text-[12px] text-slate-500">
              Best Practices & Guidelines
            </span>
          </div>
          <h1 className="text-[24px] sm:text-[28px] font-bold text-slate-900 leading-tight tracking-tight">
            보안 점검 & 해결 가이드
          </h1>
          <p className="text-[13.5px] text-slate-500 mt-1">
            AI 기반 애플리케이션 및 모던 웹 스택 개발 시 빈번하게 발생하는 주요 취약점 대응 지침입니다.
          </p>
        </div>

        <button
          onClick={onBackToDashboard}
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all shadow-xs cursor-pointer active:scale-98 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[17px] text-slate-500">arrow_back</span>
          대시보드로 복귀
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Guide 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-[19px]">key</span>
              </div>
              <h3 className="text-[15px] font-semibold text-slate-900">
                1. API Key & 시크릿 보호
              </h3>
            </div>
            <span className="text-[11px] font-medium bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded">
              Critical
            </span>
          </div>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            OpenAI, Anthropic, Gemini, AWS 등의 API Key는 절대로 클라이언트 번들이나 Git 저장소에 평문으로 커밋해서는 안 됩니다.
          </p>
          <div className="bg-slate-900 text-slate-100 p-3.5 rounded-lg font-mono text-[12px] leading-relaxed">
            <span className="text-slate-400">// 권장 패턴: 백엔드 프록시 또는 환경변수 사용</span><br />
            const apiKey = process.env.AI_API_KEY;<br />
            if (!apiKey) throw new Error("API Key 미설정");
          </div>
        </div>

        {/* Guide 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-[19px]">admin_panel_settings</span>
              </div>
              <h3 className="text-[15px] font-semibold text-slate-900">
                2. 안전한 인증 및 세션 검증
              </h3>
            </div>
            <span className="text-[11px] font-medium bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded">
              Auth
            </span>
          </div>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            인증 토큰(JWT) 검증 시 반드시 서버 측 비밀키(Secret)로 서명을 검증해야 하며, 토큰 유효 기간 및 HttpOnly 쿠키 저장을 권장합니다.
          </p>
          <div className="bg-slate-900 text-slate-100 p-3.5 rounded-lg font-mono text-[12px] leading-relaxed">
            <span className="text-slate-400">// 권장 패턴: 서명 알고리즘 명시 및 비밀키 검증</span><br />
            jwt.verify(token, process.env.JWT_SECRET, &#123; algorithms: ['HS256'] &#125;);
          </div>
        </div>

        {/* Guide 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-[19px]">database</span>
              </div>
              <h3 className="text-[15px] font-semibold text-slate-900">
                3. SQL Injection 방어
              </h3>
            </div>
            <span className="text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
              Injection
            </span>
          </div>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            사용자 입력값을 SQL 쿼리 문자열에 직접 연결하지 마세요. 반드시 파라미터화된 쿼리(Prepared Statement) 또는 검증된 ORM을 사용해야 합니다.
          </p>
          <div className="bg-slate-900 text-slate-100 p-3.5 rounded-lg font-mono text-[12px] leading-relaxed">
            <span className="text-slate-400">// 권장 패턴: 매개변수화 쿼리</span><br />
            const query = "SELECT * FROM users WHERE email = $1";<br />
            await db.query(query, [userEmail]);
          </div>
        </div>

        {/* Guide 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-[19px]">shield</span>
              </div>
              <h3 className="text-[15px] font-semibold text-slate-900">
                4. 의존성 및 보안 헤더
              </h3>
            </div>
            <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
              Headers
            </span>
          </div>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            정기적인 <code className="font-mono text-[11.5px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">npm audit</code> 실행과 Helmet 미들웨어를 통한 보안 HTTP 응답 헤더 설정을 생활화하세요.
          </p>
          <div className="bg-slate-900 text-slate-100 p-3.5 rounded-lg font-mono text-[12px] leading-relaxed">
            <span className="text-slate-400">// 권장 패턴: Express Helmet 적용</span><br />
            import helmet from 'helmet';<br />
            app.use(helmet());
          </div>
        </div>
      </div>
    </div>
  );
};

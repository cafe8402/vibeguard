import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Code2,
  FileArchive,
  FileCode2,
  FileWarning,
  FolderOpen,
  Globe2,
  Info,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  TerminalSquare,
  UploadCloud,
  X,
  Zap,
} from 'lucide-react';
import { SecurityIssue, Severity } from './types';
import { ArtifactUsage, scanArtifacts, ScanResult } from './utils/scannerEngine';

type AppView = 'upload' | 'scanning' | 'report' | 'detail' | 'compare';
type SeverityFilter = 'all' | Exclude<Severity, 'safe'>;

const usageOptions: { value: ArtifactUsage; title: string; desc: string }[] = [
  { value: 'personal', title: '나만 사용', desc: '개인 PC에서만 사용' },
  { value: 'internal', title: '사내 공유', desc: '동료나 사내 시스템에서 사용' },
  { value: 'external', title: '외부 공개', desc: '고객 또는 인터넷에 공개' },
];

const severityMeta: Record<Exclude<Severity, 'safe'>, { label: string; tone: string; dot: string }> = {
  critical: { label: '즉시 확인', tone: 'text-red-700 bg-red-50 border-red-200', dot: 'bg-red-600' },
  high: { label: '수정 권장', tone: 'text-orange-700 bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  medium: { label: '확인 필요', tone: 'text-amber-800 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  low: { label: '참고', tone: 'text-blue-700 bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
};

const confidenceLabel = { high: '높음', medium: '보통', low: '낮음' };

export const App: React.FC = () => {
  const [view, setView] = useState<AppView>('upload');
  const [usage, setUsage] = useState<ArtifactUsage>('internal');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [previousResult, setPreviousResult] = useState<ScanResult | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<SecurityIssue | null>(null);
  const [progress, setProgress] = useState(0);
  const [scanStep, setScanStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  const startScan = async (files: File[]) => {
    if (!files.length) return;
    const baseline = result;
    setError(null);
    setProgress(8);
    setScanStep(0);
    setView('scanning');

    const timer = window.setInterval(() => {
      setProgress((value) => Math.min(value + Math.max(2, Math.round((88 - value) / 6)), 88));
      setScanStep((value) => Math.min(value + 1, 3));
    }, 420);

    try {
      const nextResult = await scanArtifacts(files, usage);
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      window.clearInterval(timer);
      setProgress(100);
      setScanStep(4);
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      setPreviousResult(baseline);
      setResult(nextResult);
      setView(baseline ? 'compare' : 'report');
    } catch (scanError) {
      window.clearInterval(timer);
      setView('upload');
      const message = scanError instanceof Error && scanError.message === 'SUPPORTED_FILE_NOT_FOUND'
        ? '분석할 수 있는 코드 파일을 찾지 못했습니다. 지원 형식을 확인해주세요.'
        : '파일을 읽는 중 문제가 발생했습니다. 암호화된 ZIP인지 확인하거나 다시 시도해주세요.';
      setError(message);
    }
  };

  const openNewScan = () => {
    setResult(null);
    setPreviousResult(null);
    setSelectedIssue(null);
    setError(null);
    setView('upload');
  };

  const openRescan = () => {
    setSelectedIssue(null);
    setError(null);
    setView('upload');
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900">
      <Header
        result={result}
        view={view}
        onNewScan={openNewScan}
        onReport={() => result && setView('report')}
      />

      <main>
        {view === 'upload' && (
          <UploadScreen
            usage={usage}
            setUsage={setUsage}
            error={error}
            isRescan={Boolean(result)}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            inputRef={inputRef}
            onFiles={startScan}
          />
        )}
        {view === 'scanning' && <ScanningScreen progress={progress} step={scanStep} />}
        {view === 'report' && result && (
          <ReportScreen
            result={result}
            onIssue={(issue) => { setSelectedIssue(issue); setView('detail'); }}
            onRescan={openRescan}
          />
        )}
        {view === 'detail' && selectedIssue && (
          <DetailScreen
            issue={selectedIssue}
            onBack={() => setView('report')}
            onCopy={(message) => showToast(message)}
            onRescan={openRescan}
          />
        )}
        {view === 'compare' && result && previousResult && (
          <CompareScreen
            previous={previousResult}
            current={result}
            onReport={() => setView('report')}
            onRescan={openRescan}
          />
        )}
      </main>

      {result && view !== 'scanning' && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 grid grid-cols-2 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2">
          <button onClick={() => setView('report')} className={`py-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 ${view === 'report' || view === 'detail' ? 'text-blue-700 bg-blue-50' : 'text-slate-500'}`}>
            <ShieldCheck size={19} /> 결과
          </button>
          <button onClick={openRescan} className="py-2 rounded-lg text-xs font-semibold text-slate-500 flex flex-col items-center gap-1">
            <RefreshCw size={19} /> 다시 점검
          </button>
        </nav>
      )}

      {toast && (
        <div className="fixed right-5 bottom-6 md:bottom-6 z-50 rounded-xl bg-slate-950 text-white px-4 py-3 shadow-xl flex items-center gap-2 text-sm">
          <CheckCircle2 size={18} className="text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
};

function Header({ result, view, onNewScan, onReport }: { result: ScanResult | null; view: AppView; onNewScan: () => void; onReport: () => void }) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-[1200px] h-16 mx-auto px-4 sm:px-6 flex items-center justify-between">
        <button onClick={onNewScan} className="flex items-center gap-2.5" aria-label="VibeGuard 처음 화면">
          <span className="w-9 h-9 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center shadow-sm"><ShieldCheck size={20} /></span>
          <span className="font-extrabold tracking-tight text-lg">VibeGuard</span>
          <span className="hidden sm:inline-flex text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">배포 전 AI 안전점검</span>
        </button>
        <div className="hidden md:flex items-center gap-2">
          {result && (
            <button onClick={onReport} className={`px-3.5 py-2 rounded-lg text-sm font-semibold ${view === 'report' || view === 'detail' ? 'text-blue-700 bg-blue-50' : 'text-slate-600 hover:bg-slate-100'}`}>점검 결과</button>
          )}
          <button onClick={onNewScan} className="px-4 py-2 rounded-lg bg-[#1E3A8A] hover:bg-blue-900 text-white text-sm font-semibold transition-colors">새 파일 점검</button>
        </div>
      </div>
    </header>
  );
}

interface UploadScreenProps {
  usage: ArtifactUsage;
  setUsage: (usage: ArtifactUsage) => void;
  error: string | null;
  isRescan: boolean;
  isDragging: boolean;
  setIsDragging: (value: boolean) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFiles: (files: File[]) => void;
}

function UploadScreen({ usage, setUsage, error, isRescan, isDragging, setIsDragging, inputRef, onFiles }: UploadScreenProps) {
  const receiveFiles = (fileList: FileList | null) => fileList && onFiles(Array.from(fileList));
  return (
    <div className="bg-white">
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 mb-5">
            <Sparkles size={15} /> {isRescan ? '수정한 파일을 다시 확인해보세요' : 'AI로 만든 결과물, 공유 전에 한 번 더'}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.035em] leading-[1.12] text-slate-950">
            파일을 올리면,<br className="sm:hidden" /> 위험한 부분부터 알려드려요.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
            웹·스크립트·확장 프로그램 소스를 읽고 비밀번호, 외부 전송, 과도한 권한과 위험한 명령을 쉬운 말로 설명합니다.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mt-9">
          {error && (
            <div role="alert" className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 text-sm">
              <AlertTriangle size={19} className="shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}

          <div
            onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
            onDrop={(event) => { event.preventDefault(); setIsDragging(false); receiveFiles(event.dataTransfer.files); }}
            className={`rounded-2xl border-2 border-dashed p-7 sm:p-10 text-center transition-all ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-slate-300 bg-[#F8FAFC] hover:border-blue-400 hover:bg-blue-50/40'}`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".zip,.html,.htm,.js,.jsx,.ts,.tsx,.json,.css,.env,.bat,.cmd,.ps1,.yml,.yaml"
              onChange={(event) => receiveFiles(event.target.files)}
              className="sr-only"
            />
            <div className="w-14 h-14 rounded-2xl bg-blue-700 text-white mx-auto flex items-center justify-center shadow-md shadow-blue-900/10"><UploadCloud size={26} /></div>
            <h2 className="mt-5 text-xl font-bold">파일이나 프로젝트 ZIP을 놓아주세요</h2>
            <p className="mt-2 text-sm text-slate-500">여러 파일을 한 번에 선택해도 됩니다. 용량 제한은 없습니다.</p>
            <button onClick={() => inputRef.current?.click()} className="mt-5 inline-flex items-center gap-2 bg-[#1E3A8A] hover:bg-blue-900 text-white font-semibold text-sm rounded-xl px-5 py-3 transition-colors shadow-sm">
              <FolderOpen size={18} /> 파일 선택하기
            </button>
            <p className="mt-4 text-xs text-slate-400">대용량 파일은 PC 환경에 따라 분석 시간이 길어질 수 있습니다.</p>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <Globe2 size={20} className="text-blue-700 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-sm">어디에서 사용할 예정인가요?</h3>
                <p className="text-xs text-slate-500 mt-1">사용 범위가 넓을수록 위험 항목을 더 엄격하게 평가합니다.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-2 mt-4">
              {usageOptions.map((option) => (
                <button key={option.value} onClick={() => setUsage(option.value)} className={`text-left p-3.5 rounded-xl border transition-all ${usage === option.value ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/10' : 'border-slate-200 hover:border-slate-300'}`}>
                  <span className="flex items-center justify-between font-semibold text-sm">{option.title}{usage === option.value && <Check size={17} className="text-blue-700" />}</span>
                  <span className="block mt-1 text-xs text-slate-500">{option.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-5">
            <TrustItem icon={<LockKeyhole size={18} />} title="서버 전송 없음" desc="파일은 이 브라우저 안에서 분석합니다." />
            <TrustItem icon={<FileCode2 size={18} />} title="읽을 수 있는 코드 중심" desc="실행하지 않고 내용만 확인합니다." />
            <TrustItem icon={<ShieldQuestion size={18} />} title="근거와 한계 표시" desc="발견 위치와 분석 범위를 함께 알려드립니다." />
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[#F7F8FA]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14">
          <div className="text-center mb-8">
            <p className="text-xs font-bold tracking-[0.16em] text-blue-700 uppercase">VibeGuard V1</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">첫 버전은 잘 설명할 수 있는 파일에 집중합니다</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <FeatureCard icon={<Code2 />} title="웹·앱 코드" desc="HTML, JavaScript, TypeScript와 프로젝트 ZIP의 비밀정보·외부 통신·인증 문제를 확인합니다." tags="HTML · JS · TS · ZIP" />
            <FeatureCard icon={<TerminalSquare />} title="Windows 스크립트" desc="파일 삭제, 설정 변경, 숨겨진 PowerShell 명령과 다운로드 후 실행 동작을 확인합니다." tags="BAT · CMD · PS1" />
            <FeatureCard icon={<Zap />} title="브라우저 확장 프로그램" desc="manifest.json을 읽어 모든 사이트 접근이나 쿠키·디버깅 같은 민감 권한을 설명합니다." tags="Extension source ZIP" />
          </div>
          <div className="mt-6 text-center text-sm text-slate-500"><Info size={15} className="inline mr-1.5 -mt-0.5" />EXE·MSI·DLL과 악성코드 판정은 이번 버전에서 지원하지 않습니다.</div>
        </div>
      </section>
    </div>
  );
}

function TrustItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex gap-3"><span className="text-emerald-700 mt-0.5">{icon}</span><div><strong className="block text-sm">{title}</strong><span className="text-xs text-slate-600 leading-relaxed">{desc}</span></div></div>;
}

function FeatureCard({ icon, title, desc, tags }: { icon: React.ReactNode; title: string; desc: string; tags: string }) {
  return <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm"><span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">{icon}</span><h3 className="font-bold text-lg mt-5">{title}</h3><p className="text-sm text-slate-600 leading-relaxed mt-2">{desc}</p><p className="text-xs font-semibold text-blue-700 mt-5">{tags}</p></div>;
}

function ScanningScreen({ progress, step }: { progress: number; step: number }) {
  const steps = ['파일 종류를 확인하고 있습니다', '비밀번호와 API Key를 찾고 있습니다', '외부 전송과 위험한 명령을 확인하고 있습니다', '결과를 쉬운 말로 정리하고 있습니다', '분석을 마쳤습니다'];
  return (
    <section className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-7 sm:p-10 text-center">
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center rounded-full" style={{ background: `conic-gradient(#2563EB ${progress * 3.6}deg, #E2E8F0 0deg)` }}>
          <div className="absolute inset-[10px] rounded-full bg-white flex flex-col items-center justify-center"><span className="text-3xl font-extrabold">{progress}%</span><span className="text-xs text-slate-500 mt-1">분석 중</span></div>
        </div>
        <h1 className="mt-7 text-2xl font-extrabold">프로젝트를 확인하고 있습니다</h1>
        <p className="text-sm text-slate-500 mt-2">파일은 외부로 전송되지 않으며 현재 브라우저에서만 처리됩니다.</p>
        <div className="mt-8 text-left space-y-2">
          {steps.slice(0, 4).map((label, index) => (
            <div key={label} className={`rounded-xl px-4 py-3 flex items-center gap-3 text-sm ${index === step ? 'bg-blue-50 text-blue-900 font-semibold' : index < step ? 'text-slate-500' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${index < step ? 'bg-emerald-100 text-emerald-700' : index === step ? 'bg-blue-700 text-white' : 'bg-slate-100'}`}>{index < step ? <Check size={15} /> : index === step ? <RefreshCw size={14} className="animate-spin" /> : index + 1}</span>{label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReportScreen({ result, onIssue, onRescan }: { result: ScanResult; onIssue: (issue: SecurityIssue) => void; onRescan: () => void }) {
  const [filter, setFilter] = useState<SeverityFilter>('all');
  const [query, setQuery] = useState('');
  const counts = getCounts(result.issues);
  const topIssues = result.topActions.length ? result.topActions : result.issues.slice(0, 3);
  const filtered = result.issues.filter((issue) => (filter === 'all' || issue.severity === filter) && `${issue.title} ${issue.location}`.toLowerCase().includes(query.toLowerCase()));
  const verdict = getVerdict(result);

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-28 md:pb-12">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">점검 완료</span><span>{result.filename}</span></div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">배포 전 확인 결과</h1>
          <p className="text-sm text-slate-500 mt-1">{result.coverageText}</p>
          {result.contextualIssues > 0 && <p className="text-xs font-semibold text-violet-700 mt-2">테스트·예제·도구 코드 참고 항목 {result.contextualIssues}개는 배포 점수에서 제외했습니다.</p>}
        </div>
        <button onClick={onRescan} className="self-start inline-flex items-center gap-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-sm font-semibold rounded-xl px-4 py-2.5"><RefreshCw size={17} /> 수정한 파일 다시 점검</button>
      </div>

      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-sm">
          <div className="flex items-start justify-between"><div><p className="text-sm font-bold">배포 준비도</p><p className="text-xs text-slate-500 mt-1">발견된 항목과 사용 범위를 기준으로 계산</p></div><span className="text-xs font-semibold text-slate-600 bg-slate-100 rounded-full px-2.5 py-1">분석 확신도 {confidenceLabel[result.overallConfidence]}</span></div>
          <div className="flex flex-col sm:flex-row items-center gap-6 mt-6">
            <ScoreRing score={result.score} />
            <div className="flex-1 text-center sm:text-left"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold border ${verdict.tone}`}>{verdict.label}</span><h2 className="font-extrabold text-xl mt-3">{verdict.title}</h2><p className="text-sm text-slate-600 mt-2 leading-relaxed">{verdict.desc}</p></div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-7 pt-5 border-t border-slate-100">
            {(['critical', 'high', 'medium', 'low'] as const).map((severity) => <div key={severity} className="text-center"><span className="block text-lg font-extrabold">{counts[severity]}</span><span className="text-[11px] text-slate-500">{severityMeta[severity].label}</span></div>)}
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2"><FileWarning size={20} className={topIssues.length ? 'text-red-600' : 'text-emerald-600'} /><h2 className="font-extrabold text-lg">{topIssues.length ? '가장 먼저 확인할 문제' : '중요한 위험을 찾지 못했습니다'}</h2></div>
          {topIssues.length ? (
            <div className="mt-4 divide-y divide-slate-100">
              {topIssues.map((issue, index) => <PriorityIssue key={issue.id} issue={issue} index={index} onClick={() => onIssue(issue)} />)}
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-emerald-50 border border-emerald-100 p-5 flex gap-3"><CheckCircle2 className="text-emerald-700 shrink-0" /><div><strong className="block text-emerald-900">확인 가능한 범위에서 중요한 위험이 발견되지 않았습니다.</strong><p className="text-sm text-emerald-800/80 mt-1">이 결과는 안전 인증이 아니며, 실제 사용 전 기능 테스트와 조직 정책 확인이 필요합니다.</p></div></div>
          )}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">{result.detectedTypes.map((type) => <span key={type} className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1">{type}</span>)}</div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div><h2 className="font-extrabold text-lg">전체 확인 항목</h2><p className="text-sm text-slate-500 mt-1">근거와 위치를 확인한 뒤 필요한 항목부터 수정하세요.</p></div>
          <div className="relative w-full lg:w-72"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="문제 또는 파일 검색" className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" /></div>
        </div>
        <div className="px-5 sm:px-6 py-3 border-b border-slate-100 flex gap-2 overflow-x-auto">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>전체 {result.issues.length}</FilterButton>
          {(['critical', 'high', 'medium', 'low'] as const).map((severity) => <FilterButton key={severity} active={filter === severity} onClick={() => setFilter(severity)}>{severityMeta[severity].label} {counts[severity]}</FilterButton>)}
        </div>
        {filtered.length ? <div className="divide-y divide-slate-100">{filtered.map((issue) => <IssueRow key={issue.id} issue={issue} onClick={() => onIssue(issue)} />)}</div> : <div className="p-10 text-center text-sm text-slate-500">조건에 맞는 항목이 없습니다.</div>}
      </div>

      <div className="mt-5 rounded-xl bg-slate-100 p-4 flex items-start gap-3 text-sm text-slate-600"><Info size={18} className="shrink-0 mt-0.5" /><p><strong className="text-slate-800">결과 해석 안내</strong><br />VibeGuard는 읽을 수 있는 코드에서 위험 신호를 찾는 배포 전 보조 도구입니다. 악성코드 판정이나 실행 안전성을 보장하지 않습니다.</p></div>
    </section>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 85 ? '#16A34A' : score >= 65 ? '#D97706' : '#DC2626';
  return <div className="relative w-36 h-36 rounded-full shrink-0" style={{ background: `conic-gradient(${color} ${score * 3.6}deg, #E2E8F0 0deg)` }}><div className="absolute inset-[10px] rounded-full bg-white flex flex-col items-center justify-center"><span className="text-4xl font-black tracking-tight">{score}</span><span className="text-xs text-slate-500">/ 100</span></div></div>;
}

function PriorityIssue({ issue, index, onClick }: { key?: React.Key; issue: SecurityIssue; index: number; onClick: () => void }) {
  return <button onClick={onClick} className="w-full py-4 flex items-center gap-3 sm:gap-4 text-left group"><span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center shrink-0">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><SeverityBadge severity={issue.severity} />{issue.sourceContext && issue.sourceContext !== 'runtime' && <ContextBadge context={issue.sourceContext} />}<span className="font-bold text-sm sm:text-base group-hover:text-blue-700">{issue.userTitle || issue.title}</span></div><p className="text-xs text-slate-500 mt-1 truncate">{issue.location}</p></div><ChevronRight size={19} className="text-slate-400 group-hover:text-blue-700 shrink-0" /></button>;
}

function IssueRow({ issue, onClick }: { key?: React.Key; issue: SecurityIssue; onClick: () => void }) {
  return <button onClick={onClick} className="w-full px-5 sm:px-6 py-4 text-left hover:bg-slate-50 transition-colors flex items-start sm:items-center gap-3"><SeverityBadge severity={issue.severity} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2">{issue.sourceContext && issue.sourceContext !== 'runtime' && <ContextBadge context={issue.sourceContext} />}<h3 className="font-bold text-sm">{issue.userTitle || issue.title}</h3></div><p className="text-xs text-slate-500 mt-1 truncate">{issue.location}</p></div><span className="hidden sm:inline text-xs text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">확신도 {confidenceLabel[issue.confidence || 'medium']}</span><ChevronRight size={18} className="text-slate-400 mt-0.5 sm:mt-0" /></button>;
}

function ContextBadge({ context }: { context: NonNullable<SecurityIssue['sourceContext']> }) {
  const labels = { runtime: '실행 코드', test: '테스트', example: '예제·샘플', documentation: '문서', tooling: '검사 도구' };
  return <span className="inline-flex text-[10px] font-bold rounded-full border border-violet-200 bg-violet-50 text-violet-700 px-2 py-0.5">{labels[context]}</span>;
}

function SeverityBadge({ severity }: { severity: Severity }) {
  if (severity === 'safe') return <span className="text-xs font-bold rounded-full border text-emerald-700 bg-emerald-50 border-emerald-200 px-2.5 py-1">해결됨</span>;
  const meta = severityMeta[severity];
  return <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold rounded-full border px-2.5 py-1 shrink-0 ${meta.tone}`}><span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />{meta.label}</span>;
}

function FilterButton({ active, onClick, children }: { key?: React.Key; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{children}</button>;
}

function DetailScreen({ issue, onBack, onCopy, onRescan }: { issue: SecurityIssue; onBack: () => void; onCopy: (message: string) => void; onRescan: () => void }) {
  const prompt = buildAiPrompt(issue);
  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    onCopy('AI 수정 프롬프트를 복사했습니다.');
  };
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-28 md:pb-12">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft size={17} /> 결과로 돌아가기</button>
      <div className="mt-5 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2"><SeverityBadge severity={issue.severity} />{issue.sourceContext && issue.sourceContext !== 'runtime' && <ContextBadge context={issue.sourceContext} />}<span className="text-xs text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">분석 확신도 {confidenceLabel[issue.confidence || 'medium']}</span></div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight">{issue.userTitle || issue.title}</h1>
          <p className="mt-2 text-sm text-slate-500 font-mono break-all">{issue.location}</p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <ExplainBlock icon={<Info />} title="왜 확인해야 하나요?"><p>{issue.easyExplanation || issue.description}</p></ExplainBlock>

          <div>
            <h2 className="font-extrabold flex items-center gap-2"><Code2 size={19} className="text-blue-700" /> 어디에서 발견했나요?</h2>
            <div className="mt-3 rounded-xl bg-slate-950 text-slate-200 overflow-x-auto border border-slate-800 py-3 font-mono text-xs sm:text-sm">
              {issue.codeSnippet.lines.map((line) => <div key={line.num} className={`px-4 py-1 flex min-w-max ${line.highlight ? 'bg-amber-400/15 border-l-2 border-amber-400 text-amber-100' : ''}`}><span className="w-10 text-right mr-4 text-slate-500 select-none">{line.num}</span><code>{line.code || ' '}</code></div>)}
            </div>
          </div>

          <ExplainBlock icon={<CheckCircle2 />} title="어떻게 수정하나요?" tone="emerald"><p>{issue.recommendation || issue.aiSuggestedFix?.summary}</p></ExplainBlock>

          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5 sm:p-6">
            <div className="flex items-start gap-3"><span className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0"><Sparkles size={18} /></span><div><h2 className="font-extrabold">AI에게 이렇게 수정 요청하세요</h2><p className="text-sm text-slate-600 mt-1">Claude Code나 Codex에 그대로 붙여넣을 수 있습니다.</p></div></div>
            <div className="mt-4 rounded-xl bg-white border border-blue-100 p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{prompt}</div>
            <button onClick={copyPrompt} className="mt-4 inline-flex items-center gap-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-sm font-semibold rounded-xl px-4 py-2.5"><Clipboard size={17} /> 프롬프트 복사</button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2"><p className="text-sm text-slate-500">수정한 뒤 다시 점검하면 해결 여부를 비교할 수 있습니다.</p><button onClick={onRescan} className="inline-flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl px-4 py-2.5"><RefreshCw size={17} /> 수정한 파일 다시 점검</button></div>
        </div>
      </div>
    </section>
  );
}

function ExplainBlock({ icon, title, tone = 'amber', children }: { icon: React.ReactNode; title: string; tone?: 'amber' | 'emerald'; children: React.ReactNode }) {
  const colors = tone === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-amber-50 border-amber-100 text-amber-950';
  return <div className={`rounded-xl border p-5 ${colors}`}><div className="flex items-start gap-3"><span className="mt-0.5 shrink-0">{icon}</span><div><h2 className="font-extrabold">{title}</h2><div className="text-sm leading-relaxed mt-2 opacity-80">{children}</div></div></div></div>;
}

function CompareScreen({ previous, current, onReport, onRescan }: { previous: ScanResult; current: ScanResult; onReport: () => void; onRescan: () => void }) {
  const previousKeys = new Set(previous.issues.map(issueKey));
  const currentKeys = new Set(current.issues.map(issueKey));
  const resolved = previous.issues.filter((issue) => !currentKeys.has(issueKey(issue)));
  const remaining = current.issues.filter((issue) => previousKeys.has(issueKey(issue)));
  const newIssues = current.issues.filter((issue) => !previousKeys.has(issueKey(issue)));
  const diff = current.score - previous.score;
  return (
    <section className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-28 md:pb-12">
      <div className="text-center"><span className="inline-flex text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5"><Sparkles size={15} className="mr-1.5" />다시 점검한 결과입니다</span><h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-4">수정 전과 비교했어요</h1><p className="text-slate-500 mt-2">점수보다 해결된 문제와 새로 발견된 항목을 먼저 확인하세요.</p></div>

      <div className="mt-8 rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-9">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
          <div className="text-center"><p className="text-xs font-semibold text-slate-500 mb-3">이전 점검</p><ScoreRing score={previous.score} /></div>
          <div className="text-center"><ArrowRight size={34} className="text-slate-300 mx-auto rotate-90 sm:rotate-0" /><span className={`inline-block mt-2 rounded-full px-3 py-1 text-sm font-extrabold ${diff >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>{diff >= 0 ? '+' : ''}{diff}점</span></div>
          <div className="text-center"><p className="text-xs font-semibold text-slate-500 mb-3">현재 점검</p><ScoreRing score={current.score} /></div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-8 pt-6 border-t border-slate-100">
          <CompareStat label="해결된 문제" value={resolved.length} color="emerald" />
          <CompareStat label="남은 문제" value={remaining.length} color="amber" />
          <CompareStat label="새로 발견" value={newIssues.length} color={newIssues.length ? 'red' : 'blue'} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mt-5">
        <CompareList title="해결된 항목" items={resolved} empty="동일한 위치에서 해결된 항목이 아직 없습니다." icon="check" />
        <CompareList title="현재 확인할 항목" items={[...remaining, ...newIssues]} empty="현재 확인할 문제가 없습니다." icon="warning" />
      </div>

      <div className={`mt-5 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 ${current.score > previous.score ? 'bg-emerald-900 text-white' : 'bg-slate-900 text-white'}`}>
        <div className="flex items-start gap-3"><CheckCircle2 className="text-emerald-300 shrink-0" /><div><h2 className="font-extrabold text-lg">{current.score > previous.score ? '수정 효과가 확인되었습니다.' : '남은 문제를 한 번 더 확인해주세요.'}</h2><p className="text-sm text-white/70 mt-1">{resolved.length ? `${resolved.length}개 항목이 더 이상 발견되지 않았습니다.` : '파일명이나 위치가 바뀌면 해결 여부를 직접 확인해야 할 수 있습니다.'}</p></div></div>
        <div className="flex gap-2 shrink-0"><button onClick={onReport} className="rounded-xl bg-white text-slate-900 px-4 py-2.5 text-sm font-bold">현재 결과 보기</button><button onClick={onRescan} className="rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-sm font-bold">한 번 더 점검</button></div>
      </div>
    </section>
  );
}

function CompareStat({ label, value, color }: { label: string; value: number; color: 'emerald' | 'amber' | 'red' | 'blue' }) {
  const colors = { emerald: 'text-emerald-700 bg-emerald-50', amber: 'text-amber-800 bg-amber-50', red: 'text-red-700 bg-red-50', blue: 'text-blue-700 bg-blue-50' };
  return <div className={`rounded-xl p-3 sm:p-4 text-center ${colors[color]}`}><strong className="block text-2xl sm:text-3xl">{value}</strong><span className="text-[11px] sm:text-xs font-semibold">{label}</span></div>;
}

function CompareList({ title, items, empty, icon }: { title: string; items: SecurityIssue[]; empty: string; icon: 'check' | 'warning' }) {
  return <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden"><div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">{icon === 'check' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertTriangle size={18} className="text-amber-600" />}<h2 className="font-extrabold">{title}</h2><span className="ml-auto text-xs font-bold text-slate-500 bg-slate-100 rounded-full px-2 py-1">{items.length}</span></div>{items.length ? <div className="divide-y divide-slate-100">{items.slice(0, 6).map((issue) => <div key={issue.id} className="p-4 flex items-start gap-3"><span className={`mt-0.5 ${icon === 'check' ? 'text-emerald-600' : 'text-amber-600'}`}>{icon === 'check' ? <Check size={17} /> : <AlertTriangle size={17} />}</span><div className="min-w-0"><p className="font-semibold text-sm">{issue.userTitle || issue.title}</p><p className="text-xs text-slate-500 mt-1 truncate">{issue.location}</p></div></div>)}</div> : <p className="p-6 text-sm text-slate-500">{empty}</p>}</div>;
}

function getCounts(issues: SecurityIssue[]) {
  return {
    critical: issues.filter((issue) => issue.severity === 'critical').length,
    high: issues.filter((issue) => issue.severity === 'high').length,
    medium: issues.filter((issue) => issue.severity === 'medium').length,
    low: issues.filter((issue) => issue.severity === 'low').length,
  };
}

function getVerdict(result: ScanResult) {
  const actionableIssues = result.issues.filter((issue) => issue.sourceContext === 'runtime' || issue.category === 'secret' || issue.category === 'credential');
  const counts = getCounts(actionableIssues);
  if (counts.critical > 0) return { label: '사용 전 즉시 확인', title: '중요한 문제부터 수정해주세요', desc: `즉시 확인이 필요한 항목 ${counts.critical}개가 발견되었습니다. 공유하거나 공개하기 전에 먼저 확인하세요.`, tone: 'text-red-700 bg-red-50 border-red-200' };
  if (counts.high > 0) return { label: '수정 후 사용 권장', title: '몇 가지 수정이 필요합니다', desc: `수정이 권장되는 항목 ${counts.high}개가 있습니다. 상세 설명을 확인하고 다시 점검해주세요.`, tone: 'text-orange-700 bg-orange-50 border-orange-200' };
  if (actionableIssues.length > 0) return { label: '확인 후 사용', title: '사용 목적에 맞는지 확인해주세요', desc: '치명적인 문제는 없지만 외부 통신이나 설정처럼 사용자가 판단해야 할 항목이 있습니다.', tone: 'text-amber-800 bg-amber-50 border-amber-200' };
  if (result.contextualIssues > 0) return { label: '실행 코드 중요 위험 미발견', title: '실행 코드에서는 중요한 위험을 찾지 못했습니다', desc: `테스트·예제·도구 코드의 참고 항목 ${result.contextualIssues}개는 배포 점수에 반영하지 않았습니다.`, tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  return { label: '중요 위험 미발견', title: '확인 가능한 범위에서는 양호합니다', desc: '중요한 위험 신호를 찾지 못했습니다. 다만 실행 안전성을 보장하는 결과는 아닙니다.', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
}

function buildAiPrompt(issue: SecurityIssue) {
  return `현재 프로젝트의 ${issue.location}에서 다음 문제를 확인했습니다.\n\n문제: ${issue.userTitle || issue.title}\n발견된 코드: ${issue.evidence || issue.comparison.current.code}\n\n${issue.recommendation || issue.aiSuggestedFix?.summary}\n\n기존 기능과 UI는 유지하고, 변경된 파일과 보안상 개선된 내용을 마지막에 쉬운 한국어로 정리해주세요.`;
}

function issueKey(issue: SecurityIssue) {
  return `${issue.ruleId || issue.title}:${issue.codeSnippet.filename}`;
}

export default App;

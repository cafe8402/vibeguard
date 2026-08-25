export type ViewType = 
  | 'upload' 
  | 'scanning' 
  | 'dashboard' 
  | 'detail' 
  | 'compare' 
  | 'history' 
  | 'guide';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'safe';

export type Category = 
  | 'credential' 
  | 'secret' 
  | 'authentication' 
  | 'network' 
  | 'sensitive' 
  | 'dangerous';

export interface CodeLine {
  num: number;
  code: string;
  highlight?: boolean;
  comment?: string;
}

export interface SecurityIssue {
  id: string;
  orderNumber?: string;
  title: string;
  severity: Severity;
  category: Category;
  location: string;
  description: string;
  codeSnippet: {
    filename: string;
    startLine: number;
    highlightLine: number;
    lines: CodeLine[];
  };
  whyDangerous: {
    title: string;
    desc: string;
    icon: string;
    iconColor?: string;
  }[];
  comparison: {
    current: {
      location: string;
      code: string;
      label: string;
    };
    recommended: {
      location?: string;
      code: string;
      label: string;
    };
  };
  isResolved: boolean;
  /** V1 사용자용 설명 필드. 기존 목 데이터와 호환되도록 선택값으로 둔다. */
  userTitle?: string;
  technicalTitle?: string;
  confidence?: 'high' | 'medium' | 'low';
  easyExplanation?: string;
  recommendation?: string;
  evidence?: string;
  ruleId?: string;
  aiSuggestedFix?: {
    summary: string;
    envVarsNeeded?: string[];
    fixedCode?: string;
    patchedCode?: string;
    explanation: string;
  };
}

export interface AuditProject {
  id: string;
  name: string;
  filename: string;
  fileSize?: string;
  analyzedAt: string;
  score: number;
  status: 'critical' | 'high' | 'medium' | 'safe';
  statusText: string;
  statusDesc: string;
  stats: {
    totalFiles: number;
    scannedFiles: number;
    completedFiles: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    safeCount: number;
  };
  topActions: SecurityIssue[];
  issues: SecurityIssue[];
  comparison?: {
    prevScore: number;
    prevDate: string;
    newScore: number;
    newDate: string;
    scoreDiff: number;
    resolvedCount: number;
    remainingCount: number;
    newIssuesCount: number;
    resolvedList: {
      title: string;
      desc: string;
    }[];
    remainingList: {
      title: string;
      desc: string;
      guideUrl?: string;
      severity: Severity;
    }[];
  };
}

export interface AuditHistoryItem {
  id: string;
  projectName: string;
  filename: string;
  date: string;
  score: number;
  prevScore?: number;
  scoreDiff?: number;
  status: 'safe' | 'risk' | 'warning';
  criticalCount: number;
  highCount: number;
  medCount: number;
  resolvedRatio: string;
}

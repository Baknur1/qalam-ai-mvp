export type FlagType = 'claim' | 'entity' | 'number' | 'quote';

export type FlagDecision = 'pending' | 'approved' | 'declined';

export type FactStatus = 'pending' | 'approved' | 'declined' | 'fixed';

export type QuickFixType = 'apply_ai' | 'remove' | 'footnote';

export interface FactAuditInfo {
  type: 'discrepancy' | 'unverified' | 'verified';
  title: string;
  claimed: string;
  verified: string;
  source: string;
  suggestedFix?: string;
}

export interface FactCheckItem {
  id: string;
  time: string;
  speaker: string;
  textBefore: string;
  underlinedPhrase?: string;
  textMid: string;
  highlightedFact: string;
  textAfter: string;
  factCheckInfo: FactAuditInfo;
  defaultDeclineRed?: boolean;
  defaultApproveGreen?: boolean;
  targetPhrases: {
    ru: string;
    kz: string;
    en: string;
  };
  fixes: {
    ru: {
      replacement: string;
      footnote: string;
    };
    kz: {
      replacement: string;
      footnote: string;
    };
    en: {
      replacement: string;
      footnote: string;
    };
  };
  translations?: Record<OutputLanguage, {
    speaker?: string;
    textBefore: string;
    underlinedPhrase?: string;
    textMid: string;
    highlightedFact: string;
    textAfter: string;
    factCheckInfo: FactAuditInfo;
  }>;
}

export interface VerificationFlag {
  id: string;
  text: string;
  type: FlagType;
  timestamp: string;
  reason: string;
  verified: boolean;
  decision?: FlagDecision;
  verifiedBy?: string;
  verifiedAt?: string;
  suggestedCorrection?: string;
}

export interface TranscriptItem {
  id: string;
  timestamp: string;
  speaker: string;
  text: string;
  flagIds: string[];
}

export interface PlatformOutputs {
  web_article: string;
  telegram_post: string;
  social_script: string;
}

export interface MultilingualOutputs {
  ru: PlatformOutputs;
  kz: PlatformOutputs;
  en: PlatformOutputs;
}

export type AgentStepId = 'stt' | 'factcheck' | 'editorial' | 'smm';

export interface AgentInfo {
  id: AgentStepId;
  name: string;
  role: string;
  iconName: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress?: number;
  message?: string;
  durationMs?: number;
}

export interface PipelineResult {
  id: string;
  title: string;
  sourceLang: 'kz' | 'ru' | 'en' | 'mixed';
  rawTranscriptText: string;
  transcript: TranscriptItem[];
  flags: VerificationFlag[];
  outputs: MultilingualOutputs;
  isMock: boolean;
  createdAt: string;
  stats: {
    audioLength?: string;
    wordCount: number;
    totalFlags: number;
    verifiedFlags: number;
    processingTimeSec: number;
  };
}

export type ContentFormat = 'web_article' | 'telegram_post' | 'social_script';
export type OutputLanguage = 'en' | 'kz' | 'ru';

export interface ApiKeysConfig {
  groqApiKey?: string;
  geminiApiKey?: string;
}


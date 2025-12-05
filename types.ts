
export interface ProcessDistribution {
  material: number;
  mental: number;
  relational: number;
  verbal: number;
}

export interface SFLAnalysisResult {
  personaStyle: string;
  tone: string;
  explanationTendency: string;
  dialoguePattern: string;
  confidenceLevel: string;
  hedgingFrequency: string;
  statementStrength: string;
  informationPackaging: string;
  topicDevelopment: string;
  referenceStyle: string;
  processDistribution: ProcessDistribution;
  technicalityLevel: number; // Scale 1-10
  topics: string[];
  analysisExplanation: string;
}

export type SourceType = 'text' | 'audio' | 'video' | 'image' | 'youtube';

export interface SourceContent {
  id: string;
  name: string;
  type: SourceType;
  mimeType: string;
  data: string; // Text content or Base64 string
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  speakingStyle: string;
  sources: SourceContent[];
  sflProfile: SFLAnalysisResult | null;
  isAnalyzing: boolean;
}

export interface ShowStructure {
  title: string;
  primaryHostId: string | null;
  intro: string;
  topics: string[];
  contextSources: SourceContent[];
}

export interface ShowContextAnalysisResult {
  title: string;
  intro: string;
  topics: string[];
}

export interface DialogueLine {
  id:string;
  speakerName: string;
  personaId: string | null;
  line: string;
}

export enum AppStep {
  PERSONA_CONFIG = 1,
  SHOW_STRUCTURE = 2,
  GENERATE_DIALOGUE = 3,
  REFINE_SCRIPT = 4,
  FINAL_REVIEW = 5,
}

export interface SearchResultItem {
  title: string;
  link: string;
  snippet: string;
  thumbnail?: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  hasThinking: boolean;
  description: string;
}
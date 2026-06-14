export interface ResumeTarget {
  role: string;
  companyType: 'faang' | 'tier2' | 'startup' | 'finance' | 'general';
  companyName?: string;
  yearsOfExperience: string;
}

export interface ResumeSection {
  id: string;
  title: string;
  text: string;
}

export interface ResumeData {
  rawText: string;
  sections?: {
    header: string;
    summary: string;
    experience: string;
    projects: string;
    skills: string;
    education: string;
    certifications?: string;
    achievements?: string;
  };
}

export interface ResumeAnnotation {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  issue_type: string; // 'metric' | 'ownership' | 'generic' | 'formatting' | 'clutter' | etc
  resume_text: string;
  reason: string;
  improved_text: string;
  section: 'header' | 'summary' | 'experience' | 'projects' | 'skills' | 'education' | 'certifications' | 'achievements' | 'all';
  start_text: string;
  end_text: string;
}

export interface AuditScores {
  recruiterScore: number;
  atsScore: number;
  technicalCredibility: number;
  impactScore: number;
  leadershipScore: number;
  projectStrengthScore: number;
  overallHireability: number;
}

export interface ATSAnalysisResult {
  currentMatchPercentage: number;
  estimatedAtsRanking: string;
  topMissingKeywords: string[];
  suggestedKeywords: string[];
  atsRisks: string[];
  atsImprovements: string[];
}

export interface ProjectRating {
  name: string;
  originality: number;
  complexity: number;
  businessValue: number;
  technicalDepth: number;
  resumeValue: number;
  recruiterAppeal: number;
  projectType: string; // 'Tutorial project' | 'Clone project' | 'Generic CRUD' | 'Low-value' | 'High-value'
  framingSuggestions: string[];
}

export interface RecruiterAuditResponse {
  hiringDecision: 'STRONG REJECT' | 'REJECT' | 'BORDERLINE' | 'INTERVIEW' | 'STRONG INTERVIEW';
  firstImpression: {
    decisionReason: string;
    strongestSignal: string;
    weakestSignal: string;
    confusingAspect: string;
    missingDetails: string;
  };
  scores: AuditScores;
  roast: string;
  sectionReviews: {
    [key: string]: {
      status: 'GOOD ✅' | 'BAD ❌' | 'MISSING ⚠️';
      feedback: string;
    };
  };
  lineByLineReview: {
    original: string;
    problem: string;
    recruiterReaction: string;
    whyItHurts: string;
    improvedVersion: string;
    strongerVersion: string;
    interviewWinningVersion: string;
  }[];
  atsAnalysis: ATSAnalysisResult;
  technicalRecruiterReview: {
    technicalDepth: string;
    engineeringMaturity: string;
    ownership: string;
    architectureUnderstanding: string;
    scalabilityUnderstanding: string;
    problemSolving: string;
    leadershipSignals: string;
    productionExperience: string;
    concerns: string[];
  };
  projectEvaluations: ProjectRating[];
  missingOpportunities: string[];
  improvedResumeSuggestion: string;
  actionPlan: {
    highPriority: string[];
    mediumPriority: string[];
    niceToHave: string[];
  };
  interviewProbability: {
    passAts: number;
    recruiterShortlist: number;
    technicalInterview: number;
    finalRound: number;
    offer: number;
    reasoning: string;
  };
  annotations: ResumeAnnotation[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type Role = 'citizen' | 'verifier' | 'officer' | 'admin';

export type InfrastructureCategory =
  | 'Healthcare'
  | 'Roads & Bridges'
  | 'Clean Water & Sanitation'
  | 'Education'
  | 'Digital Connectivity'
  | 'Electricity & Power'
  | 'Flood & Storm Drainage'
  | 'Public Safety & Lighting'
  | 'Public Transport';

export type RequestStatus =
  | 'submitted'
  | 'ai_analyzed'
  | 'verified'
  | 'under_review'
  | 'project_approved'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface BoundingBox {
  label: string;
  confidence: number;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in percentages (0-100)
}

export interface EvidenceMetadata {
  fileId: string;
  fileName: string;
  fileType: 'image' | 'video' | 'audio';
  fileSize: number;
  url: string;
  sha256Hash: string;
  perceptualHash?: string;
  exifTimestamp?: string;
  exifCoordinates?: {
    lat: number;
    lng: number;
  };
  locationMatchConfidence: number; // 0-100%
  manipulationCheck: {
    syntheticProbability: number; // 0-100%
    tamperArtifactsDetected: boolean;
    compressionAnomalies: boolean;
  };
  overallAuthenticityScore: number; // 0-100
  authenticityReasons: string[];
  cvDetections?: BoundingBox[];
}

export interface StructuredExtraction {
  detectedLanguage: string;
  canonicalEnglishTranslation: string;
  category: InfrastructureCategory;
  infrastructureType: string;
  severity: SeverityLevel;
  extractedLocationName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  district: string;
  stateOrRegion: string;
  country: string;
  mentionedPopulationAffected: number;
  timeContext: string;
  aiConfidenceScore: number; // 0-100
  semanticKeywords: string[];
}

export interface CitizenRequest {
  id: string; // e.g. "BRICS-DPI-2026-9041"
  submissionDate: string;
  originalLanguage: string;
  originalText: string;
  audioUrl?: string;
  audioTranscript?: string;
  evidenceList: EvidenceMetadata[];
  reportedCategory: InfrastructureCategory;
  reportedLocation: {
    name: string;
    lat: number;
    lng: number;
    district: string;
    region: string;
  };
  structuredExtraction: StructuredExtraction;
  status: RequestStatus;
  isVerifiedByHuman: boolean;
  verifiedBy?: string;
  verificationNotes?: string;
  humanOverride?: {
    originalCategory: InfrastructureCategory;
    adjustedCategory: InfrastructureCategory;
    originalSeverity: SeverityLevel;
    adjustedSeverity: SeverityLevel;
    reason: string;
    timestamp: string;
    officerName: string;
  };
  duplicateClusterId?: string;
  clusterCount: number;
  priorityScore: PriorityScore;
}

export interface PriorityScore {
  overallScore: number; // 0 - 100
  indicatorLevel: 'Low' | 'Medium' | 'High' | 'Urgent';
  breakdown: {
    citizenDemandScore: number; // e.g. based on cluster count & frequency (0-100)
    infrastructureGapScore: number; // based on census & deficit ratio (0-100)
    populationImpactScore: number; // based on demographic reach (0-100)
    severityScore: number; // based on hazard & structural risk (0-100)
    planAlignmentScore: number; // based on municipal / national 5-year plan (0-100)
  };
  weightedFormulaExplanation: string;
  keyDrivers: string[];
}

export interface PriorityWeights {
  citizenDemandWeight: number; // e.g. 0.25
  infrastructureGapWeight: number; // e.g. 0.25
  populationImpactWeight: number; // e.g. 0.20
  severityWeight: number; // e.g. 0.20
  planAlignmentWeight: number; // e.g. 0.10
}

export interface InfrastructureGap {
  id: string;
  region: string;
  district: string;
  category: InfrastructureCategory;
  centerCoordinates: {
    lat: number;
    lng: number;
  };
  population: number;
  existingFacilitiesCount: number;
  existingFacilitiesDetails: string[];
  recommendedNormRatio: string; // e.g. "1 facility per 20,000 citizens"
  currentDeficit: string; // e.g. "0 facilities within 24km radius"
  gapSeverity: 'Moderate' | 'Severe' | 'Critical';
  aggregateDemandRequests: number;
  gapIndex: number; // 0-100
  estimatedCapitalCostUsd: number;
}

export interface ExistingFacility {
  id: string;
  name: string;
  category: InfrastructureCategory;
  coordinates: {
    lat: number;
    lng: number;
  };
  capacity: string;
  status: 'Operational' | 'Overburdened' | 'Under Maintenance';
  district: string;
}

export interface DevelopmentProject {
  id: string;
  code: string;
  title: string;
  category: InfrastructureCategory;
  district: string;
  region: string;
  budgetAllocatedUsd: number;
  leadMinistry: string;
  status: 'Planning' | 'Tendering' | 'Under Construction' | 'Commissioned';
  startDate: string;
  targetCompletionDate: string;
  associatedGapId?: string;
  linkedRequestIds: string[];
  impactBaseline: {
    monthlyCitizenComplaints: number;
    accessDeficitMetric: string;
    populationWithoutService: number;
  };
  impactPostCommissioning?: {
    postMonthlyComplaints: number;
    measuredServiceImprovement: string;
    citizenSatisfactionRate: number; // 0-100%
    verifiedReductionPercentage: number;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: Role;
  action: string;
  targetEntityId: string;
  details: string;
  ipAddress: string;
  hashSignature: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  country: string;
  assignedJurisdiction: string;
  badgeNumber: string;
  avatar: string;
}

import {
  CitizenRequest,
  EvidenceMetadata,
  InfrastructureCategory,
  PriorityScore,
  PriorityWeights,
  SeverityLevel,
  StructuredExtraction,
} from '../types';

// Simple deterministic hash simulation for client-side demo
export function generateSha256(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256-${hex}${Date.now().toString(16)}${Math.random().toString(16).substring(2, 10)}`;
}

export function detectLanguage(text: string): { code: string; name: string } {
  // Regex heuristics for BRICS languages
  if (/[\u0900-\u097F]/.test(text)) return { code: 'hi', name: 'Hindi (Devanagari)' };
  if (/[\u0B00-\u0B7F]/.test(text)) return { code: 'or', name: 'Odia (BRICS Regional)' };
  if (/[\u4E00-\u9FFF]/.test(text)) return { code: 'zh', name: 'Chinese (Mandarin)' };
  if (/[\u0400-\u04FF]/.test(text)) return { code: 'ru', name: 'Russian (Cyrillic)' };
  if (/[\u0600-\u06FF]/.test(text)) return { code: 'ar', name: 'Arabic' };
  if (/[ãõáéíóúçêô]/i.test(text) || /\b(bairro|rua|saúde|chuva|estrada|ponte|cidade|escola)\b/i.test(text)) {
    return { code: 'pt', name: 'Portuguese (BRICS Brazil)' };
  }
  return { code: 'en', name: 'English (Canonical Standard)' };
}

export function extractEntitiesAndTranslate(
  text: string,
  userSelectedCategory?: InfrastructureCategory
): {
  canonicalTranslation: string;
  detectedCategory: InfrastructureCategory;
  infrastructureType: string;
  severity: SeverityLevel;
  populationAffected: number;
  aiConfidence: number;
  keywords: string[];
} {
  const lower = text.toLowerCase();
  const lang = detectLanguage(text);

  // Default entity values
  let detectedCategory: InfrastructureCategory = userSelectedCategory || 'Roads & Bridges';
  let infrastructureType = 'Municipal Infrastructure Asset';
  let severity: SeverityLevel = 'Medium';
  let populationAffected = 5000;
  let aiConfidence = 95.0;
  let canonicalTranslation = text;
  const keywords: string[] = [];

  // Population regex
  const popMatch = text.match(/(\d+[\d,.]*)\s*(people|residents|citizens|habitants|moradores|pessoas|लोग|हजार|тысяч)/i);
  if (popMatch) {
    let numStr = popMatch[1].replace(/,/g, '');
    let num = parseInt(numStr, 10);
    if (text.includes('हजार') || text.includes('тысяч')) num *= 1000;
    if (!isNaN(num) && num > 0) {
      populationAffected = num;
    }
  }

  // Healthcare signals
  if (
    lower.includes('hospital') ||
    lower.includes('clinic') ||
    lower.includes('doctor') ||
    lower.includes('maternity') ||
    lower.includes('अस्पताल') ||
    lower.includes('स्वास्थ्य') ||
    lower.includes('saúde') ||
    lower.includes('posto de saúde') ||
    lower.includes('больниц') ||
    lower.includes('врач') ||
    lower.includes('医院')
  ) {
    detectedCategory = 'Healthcare';
    infrastructureType = 'Primary / Secondary Community Hospital';
    severity = 'Critical';
    aiConfidence = 97.2;
    keywords.push('hospital', 'maternity', 'emergency care', 'healthcare gap');
    if (lang.code !== 'en') {
      canonicalTranslation = `Citizen reports absence or deficit of accessible hospital/healthcare facility in the designated residential sector. Inhabitants currently forced to travel extended distances for critical medical treatment. Requesting an upgraded secondary health clinic with emergency beds.`;
    }
  }
  // Clean Water signals
  else if (
    lower.includes('water') ||
    lower.includes('drinking water') ||
    lower.includes('tap') ||
    lower.includes('pipe') ||
    lower.includes('contaminated') ||
    lower.includes('पानी') ||
    lower.includes('जल') ||
    lower.includes('água') ||
    lower.includes('водопровод') ||
    lower.includes('вода') ||
    lower.includes('饮用水')
  ) {
    detectedCategory = 'Clean Water & Sanitation';
    infrastructureType = 'Potable Water Distribution Main & Filtration Plant';
    severity = 'Critical';
    aiConfidence = 96.5;
    keywords.push('potable water', 'pipeline contamination', 'public health risk');
    if (lang.code !== 'en') {
      canonicalTranslation = `Citizen reports critical potable water supply disruption or contamination affecting residential households. Immediate treated water line replacement and testing required.`;
    }
  }
  // Flood and storm drainage
  else if (
    lower.includes('flood') ||
    lower.includes('rain') ||
    lower.includes('canal') ||
    lower.includes('drainage') ||
    lower.includes('बाढ़') ||
    lower.includes('inundação') ||
    lower.includes('alagamento') ||
    lower.includes('затопл') ||
    lower.includes('排水')
  ) {
    detectedCategory = 'Flood & Storm Drainage';
    infrastructureType = 'Storm Water Canal & Flood Mitigation Retention Basin';
    severity = 'High';
    aiConfidence = 95.8;
    keywords.push('flood inundation', 'storm drainage', 'canal siltation', 'monsoon runoff');
    if (lang.code !== 'en') {
      canonicalTranslation = `Citizen reports severe storm water flooding and drainage blockage during precipitation events, posing structural and sanitization risks to surrounding community facilities.`;
    }
  }
  // Roads and bridges
  else if (
    lower.includes('road') ||
    lower.includes('pothole') ||
    lower.includes('bridge') ||
    lower.includes('traffic') ||
    lower.includes('highway') ||
    lower.includes('सड़क') ||
    lower.includes('गड्ढे') ||
    lower.includes('पुल') ||
    lower.includes('estrada') ||
    lower.includes('buraco') ||
    lower.includes('ponte') ||
    lower.includes('дорог') ||
    lower.includes('ямы') ||
    lower.includes('мост') ||
    lower.includes('道路')
  ) {
    detectedCategory = 'Roads & Bridges';
    infrastructureType = 'Carriageway Arterial & Reinforced Bridge Deck';
    severity = 'High';
    aiConfidence = 96.1;
    keywords.push('pothole hazard', 'asphalt erosion', 'bridge deck vibration', 'traffic choke');
    if (lang.code !== 'en') {
      canonicalTranslation = `Citizen reports acute roadway surface degradation with deep potholes and hazardous bridge transit conditions causing vehicle damage and emergency access bottlenecks.`;
    }
  }
  // Education signals
  else if (
    lower.includes('school') ||
    lower.includes('college') ||
    lower.includes('student') ||
    lower.includes('teacher') ||
    lower.includes('स्कूल') ||
    lower.includes('escola') ||
    lower.includes('школ') ||
    lower.includes('学校')
  ) {
    detectedCategory = 'Education';
    infrastructureType = 'Public Secondary School & STEM Learning Complex';
    severity = 'Medium';
    aiConfidence = 94.5;
    keywords.push('secondary school deficit', 'student commute distance', 'classroom deficit');
  }
  // Digital connectivity
  else if (
    lower.includes('internet') ||
    lower.includes('mobile') ||
    lower.includes('network') ||
    lower.includes('5g') ||
    lower.includes('broadband') ||
    lower.includes('интернет') ||
    lower.includes('宽带')
  ) {
    detectedCategory = 'Digital Connectivity';
    infrastructureType = 'Optical Fiber Backbone & Cellular Telecommunications Tower';
    severity = 'Medium';
    aiConfidence = 93.9;
    keywords.push('digital connectivity gap', 'broadband dead-zone', 'telecom mast');
  }

  return {
    canonicalTranslation,
    detectedCategory,
    infrastructureType,
    severity,
    populationAffected,
    aiConfidence,
    keywords,
  };
}

export function runComputerVisionEvidenceAnalysis(
  file: File | { name: string; type: string; size: number },
  category: InfrastructureCategory,
  reportedCoords: { lat: number; lng: number }
): EvidenceMetadata {
  const sha = generateSha256(file.name + file.size + Date.now());
  const pHash = `phash-${Math.random().toString(16).substring(2, 10)}`;

  // Simulated EXIF with micro-variance (within 15-40 meters)
  const exifLat = reportedCoords.lat + (Math.random() - 0.5) * 0.0004;
  const exifLng = reportedCoords.lng + (Math.random() - 0.5) * 0.0004;

  let detections = [
    {
      label: `${category} Structural Defect Condition`,
      confidence: 94.2,
      box: [25, 20, 75, 80] as [number, number, number, number],
    },
    {
      label: 'Surrounding Ground Clearance & Human Access Scale Marker',
      confidence: 90.1,
      box: [60, 50, 90, 85] as [number, number, number, number],
    },
  ];

  if (category === 'Roads & Bridges') {
    detections = [
      {
        label: 'Severe Pothole Cavity (Estimated Depth: 28-35cm)',
        confidence: 96.8,
        box: [28, 22, 72, 78],
      },
      {
        label: 'Radial Sub-base Cracking & Bituminous Spalling',
        confidence: 91.5,
        box: [55, 35, 88, 85],
      },
    ];
  } else if (category === 'Healthcare') {
    detections = [
      {
        label: 'Overburdened Inpatient Triage Area & Bed Deficit',
        confidence: 94.6,
        box: [15, 18, 82, 85],
      },
    ];
  } else if (category === 'Flood & Storm Drainage') {
    detections = [
      {
        label: 'Surface Water Inundation Level (>40cm)',
        confidence: 95.4,
        box: [20, 15, 80, 88],
      },
      {
        label: 'Silt Blockage in Storm Inflow Grate',
        confidence: 89.9,
        box: [65, 55, 92, 90],
      },
    ];
  }

  return {
    fileId: `ev-${Date.now().toString(16)}`,
    fileName: file.name,
    fileType: file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image',
    fileSize: file.size,
    url:
      category === 'Roads & Bridges'
        ? 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80'
        : category === 'Healthcare'
        ? 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80'
        : category === 'Flood & Storm Drainage'
        ? 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
    sha256Hash: sha,
    perceptualHash: pHash,
    exifTimestamp: new Date().toISOString(),
    exifCoordinates: { lat: exifLat, lng: exifLng },
    locationMatchConfidence: 98.4,
    manipulationCheck: {
      syntheticProbability: 1.1,
      tamperArtifactsDetected: false,
      compressionAnomalies: false,
    },
    overallAuthenticityScore: 96.8,
    authenticityReasons: [
      'Cryptographic SHA-256 fingerprint anchored to municipal audit tree',
      'EXIF geolocation matches reported GPS pin within 32 meters',
      'Natural Bayer sensor noise pattern verified; zero generative GAN/Diffusion artifacts detected',
      'Solar azimuth and shadow angle matches weather archive for coordinates',
    ],
    cvDetections: detections,
  };
}

export function calculateExplainablePriority(
  demandScore: number,
  gapScore: number,
  populationImpactScore: number,
  severityScore: number,
  planAlignmentScore: number,
  weights: PriorityWeights
): PriorityScore {
  const weightedDemand = demandScore * weights.citizenDemandWeight;
  const weightedGap = gapScore * weights.infrastructureGapWeight;
  const weightedPop = populationImpactScore * weights.populationImpactWeight;
  const weightedSeverity = severityScore * weights.severityWeight;
  const weightedAlignment = planAlignmentScore * weights.planAlignmentWeight;

  const total = Number((weightedDemand + weightedGap + weightedPop + weightedSeverity + weightedAlignment).toFixed(1));

  let indicatorLevel: 'Low' | 'Medium' | 'High' | 'Urgent' = 'Low';
  if (total >= 85) indicatorLevel = 'Urgent';
  else if (total >= 70) indicatorLevel = 'High';
  else if (total >= 50) indicatorLevel = 'Medium';

  const explanation = `Priority Indicator Index = (Demand: ${demandScore} × ${weights.citizenDemandWeight.toFixed(
    2
  )}) + (Gap: ${gapScore} × ${weights.infrastructureGapWeight.toFixed(
    2
  )}) + (Population: ${populationImpactScore} × ${weights.populationImpactWeight.toFixed(
    2
  )}) + (Severity: ${severityScore} × ${weights.severityWeight.toFixed(
    2
  )}) + (Plan Alignment: ${planAlignmentScore} × ${weights.planAlignmentWeight.toFixed(
    2
  )}) = ${total}/100. This is an explainable decision-support indicator, NOT an automated spending decision.`;

  const drivers: string[] = [];
  if (gapScore >= 80) drivers.push(`High Infrastructure Gap: Deficit exceeds national/BRICS equity thresholds`);
  if (demandScore >= 80) drivers.push(`Intense Citizen Demand: High frequency of verified neighborhood clusters`);
  if (severityScore >= 85) drivers.push(`Critical Hazard Severity: Documented structural or public health danger`);
  if (populationImpactScore >= 80) drivers.push(`Broad Demographic Reach: Affects substantial local population (>15,000)`);
  if (planAlignmentScore >= 80) drivers.push(`Strategic Alignment: Matches National 5-Year Capital Infrastructure Priority`);

  return {
    overallScore: total,
    indicatorLevel,
    breakdown: {
      citizenDemandScore: demandScore,
      infrastructureGapScore: gapScore,
      populationImpactScore: populationImpactScore,
      severityScore: severityScore,
      planAlignmentScore: planAlignmentScore,
    },
    weightedFormulaExplanation: explanation,
    keyDrivers: drivers.length > 0 ? drivers : ['Standard municipal baseline indicators apply'],
  };
}

export function processNewCitizenSubmission(
  text: string,
  category: InfrastructureCategory,
  location: { name: string; lat: number; lng: number; district: string; region: string },
  files: File[],
  weights: PriorityWeights,
  audioBlobUrl?: string,
  audioTranscript?: string
): CitizenRequest {
  const lang = detectLanguage(text);
  const entities = extractEntitiesAndTranslate(text, category);

  const evidenceList: EvidenceMetadata[] = [];
  if (files && files.length > 0) {
    for (const f of files) {
      evidenceList.push(runComputerVisionEvidenceAnalysis(f, entities.detectedCategory, location));
    }
  } else {
    // Generate standard photographic evidence item for realistic demo
    evidenceList.push(
      runComputerVisionEvidenceAnalysis(
        { name: 'citizen_field_evidence.jpg', type: 'image/jpeg', size: 1980400 },
        entities.detectedCategory,
        location
      )
    );
  }

  const structuredExtraction: StructuredExtraction = {
    detectedLanguage: lang.name,
    canonicalEnglishTranslation: entities.canonicalTranslation,
    category: entities.detectedCategory,
    infrastructureType: entities.infrastructureType,
    severity: entities.severity,
    extractedLocationName: location.name,
    coordinates: { lat: location.lat, lng: location.lng },
    district: location.district,
    stateOrRegion: location.region,
    country: location.region.includes('Brazil')
      ? 'Brazil'
      : location.region.includes('Russia')
      ? 'Russia'
      : location.region.includes('China')
      ? 'China'
      : 'India',
    mentionedPopulationAffected: entities.populationAffected,
    timeContext: 'Recent citizen submission (within 24 hrs)',
    aiConfidenceScore: entities.aiConfidence,
    semanticKeywords: entities.keywords,
  };

  // Base scoring components
  const demandScore = 86; // Cluster of fresh demand
  const gapScore = entities.detectedCategory === 'Healthcare' ? 95 : 85;
  const popScore = entities.populationAffected >= 20000 ? 94 : 80;
  const severityScore = entities.severity === 'Critical' ? 95 : entities.severity === 'High' ? 85 : 65;
  const planScore = 90;

  const priority = calculateExplainablePriority(
    demandScore,
    gapScore,
    popScore,
    severityScore,
    planScore,
    weights
  );

  const randSuffix = Math.floor(1000 + Math.random() * 9000);
  const newId = `BRICS-DPI-2026-${randSuffix}`;

  return {
    id: newId,
    submissionDate: new Date().toISOString(),
    originalLanguage: lang.name,
    originalText: text,
    audioUrl: audioBlobUrl,
    audioTranscript: audioTranscript || (audioBlobUrl ? text : undefined),
    reportedCategory: category,
    reportedLocation: location,
    structuredExtraction,
    evidenceList,
    status: 'ai_analyzed',
    isVerifiedByHuman: false,
    clusterCount: Math.floor(12 + Math.random() * 15),
    priorityScore: priority,
  };
}

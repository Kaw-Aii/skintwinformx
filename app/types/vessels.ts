/**
 * Type definitions for SKIN-TWIN Vessels and Formulations
 */

// Core Formulation Types
export interface FormulationSchema {
  // Core Identity
  id: string;
  name: string;
  version: string;
  type: FormulationType;
  
  // Composition
  phases: Phase[];
  ingredients: IngredientUsage[];
  totalWeight: number;
  
  // Properties
  properties: FormulationProperties;
  performance?: PerformanceMetrics;
  stability: StabilityData;
  
  // Manufacturing
  process?: ProcessingInstructions;
  equipment?: EquipmentRequirements;
  qualityControl?: QCParameters;
  
  // Regulatory & Compliance
  regulatory: RegulatoryData;
  claims: string[];
  restrictions?: UsageRestrictions;
  
  // Metadata
  developedBy?: string;
  developmentDate?: Date;
  lastModified?: Date;
  status: FormulationStatus;
  tags: string[];
}

export interface Phase {
  id: string;
  name: string;
  type: PhaseType;
  temperature: TemperatureRange;
  pH?: pHRange;
  ingredients: string[];
  processingTime: number;
  mixingSpeed?: number;
}

export interface IngredientUsage {
  ingredientId: string;
  concentration: number;
  concentrationRange?: {
    min: number;
    max: number;
  };
  function: string;
  phase: string;
  additionOrder: number;
  notes?: string;
}

export interface FormulationProperties {
  appearance: {
    color: string;
    clarity: 'clear' | 'translucent' | 'opaque';
    texture: string;
  };
  rheology: {
    viscosity: number;
    flowBehavior: 'newtonian' | 'shear-thinning' | 'shear-thickening';
  };
  physicochemical: {
    pH: number;
    density: number;
    refractionIndex?: number;
  };
  sensory: {
    spreadability: number;
    absorption: number;
    afterfeel: string;
  };
}

export interface PerformanceMetrics {
  efficacy?: EfficacyData[];
  safety?: SafetyProfile;
  compatibility?: CompatibilityData;
  consumer?: ConsumerTesting;
}

export interface StabilityData {
  accelerated: StabilityTest[];
  realTime: StabilityTest[];
  photostability: PhotostabilityData;
  microbiological: MicrobiologicalStability;
  packaging: PackagingCompatibility[];
}

export interface RegulatoryData {
  region: string;
  compliance: string[];
  cpsr?: boolean;
  pif?: boolean;
  notifications?: string[];
}

export interface UsageRestrictions {
  maxConcentration?: number;
  restrictedRegions?: string[];
  warningLabels?: string[];
}

// Supporting Types
export type FormulationType = 
  | 'serum' 
  | 'cream' 
  | 'lotion' 
  | 'gel' 
  | 'oil' 
  | 'balm' 
  | 'mask' 
  | 'cleanser' 
  | 'toner' 
  | 'treatment';

export type FormulationStatus = 
  | 'development' 
  | 'testing' 
  | 'approved' 
  | 'discontinued' 
  | 'reformulated';

export type PhaseType = 
  | 'aqueous' 
  | 'oil' 
  | 'emulsion' 
  | 'powder';

export interface TemperatureRange {
  min: number;
  max: number;
}

export interface pHRange {
  min: number;
  max: number;
}

// Detailed supporting interfaces
export interface ProcessingInstructions {
  steps: ProcessStep[];
  totalTime: number;
  criticalControlPoints: string[];
}

export interface ProcessStep {
  order: number;
  description: string;
  temperature?: number;
  time?: number;
  speed?: number;
}

export interface EquipmentRequirements {
  mixer: string;
  vessels: string[];
  specialEquipment?: string[];
}

export interface QCParameters {
  inProcess: QCCheck[];
  finished: QCCheck[];
  release: ReleaseSpec[];
}

export interface QCCheck {
  parameter: string;
  method: string;
  specification: string;
  frequency: string;
}

export interface ReleaseSpec {
  test: string;
  specification: string;
  method: string;
}

export interface EfficacyData {
  claim: string;
  testMethod: string;
  results: string;
  substantiated: boolean;
}

export interface SafetyProfile {
  irritation: string;
  sensitization: string;
  phototoxicity?: string;
}

export interface CompatibilityData {
  skinTypes: string[];
  incompatibleWith?: string[];
}

export interface ConsumerTesting {
  panelSize: number;
  duration: string;
  satisfaction: number;
}

export interface StabilityTest {
  temperature: number;
  humidity?: number;
  duration: string;
  results: string;
}

export interface PhotostabilityData {
  uvStability: string;
  colorChange: string;
  activeRetention: number;
}

export interface MicrobiologicalStability {
  preservativeSystem: string;
  challengeTest: string;
  shelfLife: number;
}

export interface PackagingCompatibility {
  material: string;
  compatible: boolean;
  notes?: string;
}

// Template definitions for formulation generation
export interface FormulationTemplate {
  id: string;
  name: string;
  description: string;
  category: FormulationType;
  baseFormulation: Partial<FormulationSchema>;
  variables: TemplateVariable[];
  constraints: TemplateConstraint[];
}

export interface TemplateVariable {
  name: string;
  type: 'ingredient' | 'concentration' | 'ph' | 'viscosity';
  defaultValue: any;
  range?: {
    min: number;
    max: number;
  };
}

export interface TemplateConstraint {
  type: 'total_concentration' | 'ph_range' | 'incompatibility';
  parameters: Record<string, any>;
}
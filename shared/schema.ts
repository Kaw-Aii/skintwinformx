import { pgTable, varchar, text, integer, decimal, boolean, jsonb, timestamp, real, serial, primaryKey, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==================== INGREDIENTS ====================
export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  inciName: varchar('inci_name', { length: 500 }).notNull(),
  casNumber: varchar('cas_number', { length: 50 }),
  ecNumber: varchar('ec_number', { length: 50 }),
  function: varchar('function', { length: 255 }),
  concentrationMin: decimal('concentration_min', { precision: 10, scale: 4 }).default('0.01'),
  concentrationMax: decimal('concentration_max', { precision: 10, scale: 4 }).default('100.00'),
  description: text('description'),
  isNatural: boolean('is_natural').default(false),
  isRestricted: boolean('is_restricted').default(false),
  isActive: boolean('is_active').default(false),
  source: varchar('source', { length: 100 }).default('COSING'),
  restrictions: jsonb('restrictions'),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  inciNameIdx: index('idx_inci_name').on(table.inciName),
  casNumberIdx: index('idx_cas_number').on(table.casNumber),
  functionIdx: index('idx_function').on(table.function),
}));

// ==================== FORMULATIONS ====================
export const formulations = pgTable('formulations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // serum, cream, lotion, gel, etc
  totalWeight: decimal('total_weight', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 50 }).notNull().default('development'), // development, testing, approved, discontinued, reformulated
  developedBy: varchar('developed_by', { length: 255 }),
  developmentDate: timestamp('development_date'),
  lastModified: timestamp('last_modified').defaultNow(),
  tags: jsonb('tags').default('[]'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  nameIdx: index('idx_formulation_name').on(table.name),
  typeIdx: index('idx_formulation_type').on(table.type),
  statusIdx: index('idx_formulation_status').on(table.status),
}));

// ==================== PHASES ====================
export const phases = pgTable('phases', {
  id: serial('id').primaryKey(),
  formulationId: integer('formulation_id').notNull().references(() => formulations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // aqueous, oil, emulsion, powder
  temperatureMin: real('temperature_min'),
  temperatureMax: real('temperature_max'),
  phMin: real('ph_min'),
  phMax: real('ph_max'),
  processingTime: integer('processing_time'), // in minutes
  mixingSpeed: integer('mixing_speed'), // in rpm
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  formulationIdx: index('idx_phase_formulation').on(table.formulationId),
}));

// ==================== INGREDIENT USAGE (Junction Table) ====================
export const ingredientUsage = pgTable('ingredient_usage', {
  id: serial('id').primaryKey(),
  formulationId: integer('formulation_id').notNull().references(() => formulations.id, { onDelete: 'cascade' }),
  ingredientId: integer('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'cascade' }),
  phaseId: integer('phase_id').references(() => phases.id, { onDelete: 'set null' }),
  concentration: decimal('concentration', { precision: 10, scale: 4 }).notNull(),
  concentrationMin: decimal('concentration_min', { precision: 10, scale: 4 }),
  concentrationMax: decimal('concentration_max', { precision: 10, scale: 4 }),
  function: varchar('function', { length: 255 }),
  additionOrder: integer('addition_order'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  formulationIdx: index('idx_usage_formulation').on(table.formulationId),
  ingredientIdx: index('idx_usage_ingredient').on(table.ingredientId),
  phaseIdx: index('idx_usage_phase').on(table.phaseId),
}));

// ==================== FORMULATION PROPERTIES ====================
export const formulationProperties = pgTable('formulation_properties', {
  id: serial('id').primaryKey(),
  formulationId: integer('formulation_id').notNull().references(() => formulations.id, { onDelete: 'cascade' }),
  
  // Appearance
  color: varchar('color', { length: 100 }),
  clarity: varchar('clarity', { length: 50 }), // clear, translucent, opaque
  texture: varchar('texture', { length: 100 }),
  
  // Rheology
  viscosity: decimal('viscosity', { precision: 10, scale: 2 }),
  flowBehavior: varchar('flow_behavior', { length: 50 }), // newtonian, shear-thinning, shear-thickening
  
  // Physicochemical
  ph: decimal('ph', { precision: 4, scale: 2 }),
  density: decimal('density', { precision: 6, scale: 4 }),
  refractionIndex: decimal('refraction_index', { precision: 6, scale: 4 }),
  
  // Sensory
  spreadability: integer('spreadability'), // 1-10 scale
  absorption: integer('absorption'), // 1-10 scale
  afterfeel: varchar('afterfeel', { length: 255 }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  formulationIdx: index('idx_properties_formulation').on(table.formulationId),
}));

// ==================== STABILITY DATA ====================
export const stabilityTests = pgTable('stability_tests', {
  id: serial('id').primaryKey(),
  formulationId: integer('formulation_id').notNull().references(() => formulations.id, { onDelete: 'cascade' }),
  testType: varchar('test_type', { length: 50 }).notNull(), // accelerated, real-time, photostability, microbiological
  temperature: real('temperature'),
  humidity: real('humidity'),
  duration: varchar('duration', { length: 50 }),
  results: text('results'),
  
  // Photostability specific
  uvStability: varchar('uv_stability', { length: 100 }),
  colorChange: varchar('color_change', { length: 100 }),
  activeRetention: decimal('active_retention', { precision: 5, scale: 2 }), // percentage
  
  // Microbiological specific
  preservativeSystem: varchar('preservative_system', { length: 255 }),
  challengeTest: varchar('challenge_test', { length: 100 }),
  shelfLife: integer('shelf_life'), // in months
  
  testDate: timestamp('test_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  formulationIdx: index('idx_stability_formulation').on(table.formulationId),
  testTypeIdx: index('idx_stability_test_type').on(table.testType),
}));

// ==================== REGULATORY DATA ====================
export const regulatoryData = pgTable('regulatory_data', {
  id: serial('id').primaryKey(),
  formulationId: integer('formulation_id').notNull().references(() => formulations.id, { onDelete: 'cascade' }),
  region: varchar('region', { length: 100 }).notNull(),
  compliance: jsonb('compliance').default('[]'), // array of compliance standards
  cpsr: boolean('cpsr').default(false), // Cosmetic Product Safety Report
  pif: boolean('pif').default(false), // Product Information File
  notifications: jsonb('notifications').default('[]'),
  maxConcentration: decimal('max_concentration', { precision: 10, scale: 4 }),
  restrictedRegions: jsonb('restricted_regions').default('[]'),
  warningLabels: jsonb('warning_labels').default('[]'),
  claims: jsonb('claims').default('[]'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  formulationIdx: index('idx_regulatory_formulation').on(table.formulationId),
  regionIdx: index('idx_regulatory_region').on(table.region),
}));

// ==================== PERFORMANCE METRICS ====================
export const performanceMetrics = pgTable('performance_metrics', {
  id: serial('id').primaryKey(),
  formulationId: integer('formulation_id').notNull().references(() => formulations.id, { onDelete: 'cascade' }),
  
  // Efficacy
  claim: varchar('claim', { length: 500 }),
  testMethod: varchar('test_method', { length: 255 }),
  results: text('results'),
  substantiated: boolean('substantiated').default(false),
  
  // Safety
  irritation: varchar('irritation', { length: 255 }),
  sensitization: varchar('sensitization', { length: 255 }),
  phototoxicity: varchar('phototoxicity', { length: 255 }),
  
  // Compatibility
  skinTypes: jsonb('skin_types').default('[]'),
  incompatibleWith: jsonb('incompatible_with').default('[]'),
  
  // Consumer Testing
  panelSize: integer('panel_size'),
  testDuration: varchar('test_duration', { length: 100 }),
  satisfactionScore: decimal('satisfaction_score', { precision: 5, scale: 2 }), // percentage
  
  testDate: timestamp('test_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  formulationIdx: index('idx_performance_formulation').on(table.formulationId),
}));

// ==================== PROCESSING INSTRUCTIONS ====================
export const processingInstructions = pgTable('processing_instructions', {
  id: serial('id').primaryKey(),
  formulationId: integer('formulation_id').notNull().references(() => formulations.id, { onDelete: 'cascade' }),
  stepOrder: integer('step_order').notNull(),
  description: text('description').notNull(),
  temperature: real('temperature'),
  time: integer('time'), // in minutes
  speed: integer('speed'), // in rpm
  criticalControlPoint: boolean('critical_control_point').default(false),
  equipment: varchar('equipment', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  formulationIdx: index('idx_processing_formulation').on(table.formulationId),
  orderIdx: index('idx_processing_order').on(table.formulationId, table.stepOrder),
}));

// ==================== QUALITY CONTROL ====================
export const qualityControl = pgTable('quality_control', {
  id: serial('id').primaryKey(),
  formulationId: integer('formulation_id').notNull().references(() => formulations.id, { onDelete: 'cascade' }),
  checkType: varchar('check_type', { length: 50 }).notNull(), // in-process, finished, release
  parameter: varchar('parameter', { length: 255 }).notNull(),
  method: varchar('method', { length: 255 }).notNull(),
  specification: text('specification').notNull(),
  frequency: varchar('frequency', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  formulationIdx: index('idx_qc_formulation').on(table.formulationId),
  checkTypeIdx: index('idx_qc_check_type').on(table.checkType),
}));

// ==================== PACKAGING COMPATIBILITY ====================
export const packagingCompatibility = pgTable('packaging_compatibility', {
  id: serial('id').primaryKey(),
  formulationId: integer('formulation_id').notNull().references(() => formulations.id, { onDelete: 'cascade' }),
  material: varchar('material', { length: 255 }).notNull(),
  compatible: boolean('compatible').notNull(),
  notes: text('notes'),
  testDate: timestamp('test_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  formulationIdx: index('idx_packaging_formulation').on(table.formulationId),
}));

// ==================== FORMULATION TEMPLATES ====================
export const formulationTemplates = pgTable('formulation_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(),
  baseFormulation: jsonb('base_formulation'),
  variables: jsonb('variables').default('[]'),
  constraints: jsonb('constraints').default('[]'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  nameIdx: index('idx_template_name').on(table.name),
  categoryIdx: index('idx_template_category').on(table.category),
}));

// ==================== RELATIONS ====================
export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  usages: many(ingredientUsage),
}));

export const formulationsRelations = relations(formulations, ({ many }) => ({
  phases: many(phases),
  ingredientUsages: many(ingredientUsage),
  properties: many(formulationProperties),
  stabilityTests: many(stabilityTests),
  regulatoryData: many(regulatoryData),
  performanceMetrics: many(performanceMetrics),
  processingInstructions: many(processingInstructions),
  qualityControl: many(qualityControl),
  packagingCompatibility: many(packagingCompatibility),
}));

export const phasesRelations = relations(phases, ({ one, many }) => ({
  formulation: one(formulations, {
    fields: [phases.formulationId],
    references: [formulations.id],
  }),
  ingredientUsages: many(ingredientUsage),
}));

export const ingredientUsageRelations = relations(ingredientUsage, ({ one }) => ({
  formulation: one(formulations, {
    fields: [ingredientUsage.formulationId],
    references: [formulations.id],
  }),
  ingredient: one(ingredients, {
    fields: [ingredientUsage.ingredientId],
    references: [ingredients.id],
  }),
  phase: one(phases, {
    fields: [ingredientUsage.phaseId],
    references: [phases.id],
  }),
}));

export const formulationPropertiesRelations = relations(formulationProperties, ({ one }) => ({
  formulation: one(formulations, {
    fields: [formulationProperties.formulationId],
    references: [formulations.id],
  }),
}));

export const stabilityTestsRelations = relations(stabilityTests, ({ one }) => ({
  formulation: one(formulations, {
    fields: [stabilityTests.formulationId],
    references: [formulations.id],
  }),
}));

export const regulatoryDataRelations = relations(regulatoryData, ({ one }) => ({
  formulation: one(formulations, {
    fields: [regulatoryData.formulationId],
    references: [formulations.id],
  }),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  formulation: one(formulations, {
    fields: [performanceMetrics.formulationId],
    references: [formulations.id],
  }),
}));

export const processingInstructionsRelations = relations(processingInstructions, ({ one }) => ({
  formulation: one(formulations, {
    fields: [processingInstructions.formulationId],
    references: [formulations.id],
  }),
}));

export const qualityControlRelations = relations(qualityControl, ({ one }) => ({
  formulation: one(formulations, {
    fields: [qualityControl.formulationId],
    references: [formulations.id],
  }),
}));

export const packagingCompatibilityRelations = relations(packagingCompatibility, ({ one }) => ({
  formulation: one(formulations, {
    fields: [packagingCompatibility.formulationId],
    references: [formulations.id],
  }),
}));
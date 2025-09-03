import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Create a PostgreSQL connection using the DATABASE_URL environment variable
const connectionString = process.env.DATABASE_URL!;

// Create a postgres client
const client = postgres(connectionString, {
  max: 1,
  ssl: 'require',
});

// Create the drizzle database instance with all schema
export const db = drizzle(client, {
  schema,
});

// Export all tables for easy access
export {
  ingredients,
  formulations,
  phases,
  ingredientUsage,
  formulationProperties,
  stabilityTests,
  regulatoryData,
  performanceMetrics,
  processingInstructions,
  qualityControl,
  packagingCompatibility,
  formulationTemplates,
} from '../shared/schema';

// Export all relations
export {
  ingredientsRelations,
  formulationsRelations,
  phasesRelations,
  ingredientUsageRelations,
  formulationPropertiesRelations,
  stabilityTestsRelations,
  regulatoryDataRelations,
  performanceMetricsRelations,
  processingInstructionsRelations,
  qualityControlRelations,
  packagingCompatibilityRelations,
} from '../shared/schema';
import { db } from '../server/storage';
import { 
  ingredients, 
  formulations, 
  phases,
  ingredientUsage,
  formulationProperties,
  stabilityTests,
  regulatoryData,
  performanceMetrics
} from '../shared/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

// Load data from JSON files
async function loadVesselDatabase() {
  const databasePath = path.join(process.cwd(), 'vessels/database/vessel_database_2025-09-03.json');
  const data = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
  console.log(`Found vessel database with ${Object.keys(data.ingredients).length} ingredients`);
  return data;
}

async function loadIngredientsData() {
  const ingredientsPath = path.join(process.cwd(), 'vessels/database/ingredients_master.json');
  const data = JSON.parse(fs.readFileSync(ingredientsPath, 'utf8'));
  console.log(`Found ${data.length} ingredients in master file`);
  return data;
}

// Import ingredients from both sources
async function importIngredients() {
  console.log('\n📦 Importing ingredients...');
  
  // Load ingredients from master file
  const ingredientsMaster = await loadIngredientsData();
  
  // Also load from vessel database for more complete data
  const vesselDb = await loadVesselDatabase();
  const vesselIngredients = Object.values(vesselDb.ingredients);
  
  // Combine both sources, using master as primary
  const ingredientsMap = new Map();
  
  // Add from master file first
  for (const ing of ingredientsMaster) {
    ingredientsMap.set(ing.id || ing.inci_name, ing);
  }
  
  // Add/update from vessel database
  for (const ing of vesselIngredients) {
    const key = (ing as any).id || (ing as any).inci_name;
    if (!ingredientsMap.has(key)) {
      ingredientsMap.set(key, ing);
    }
  }
  
  const allIngredients = Array.from(ingredientsMap.values());
  console.log(`Total unique ingredients to import: ${allIngredients.length}`);
  
  const batchSize = 100;
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < allIngredients.length; i += batchSize) {
    const batch = allIngredients.slice(i, i + batchSize);
    
    const ingredientsToInsert = batch
      .filter((ing: any) => ing.inci_name && ing.inci_name.length > 0)
      .map((ing: any) => ({
        inciName: ing.inci_name.substring(0, 500), // Truncate if too long
        casNumber: ing.cas_number ? String(ing.cas_number).substring(0, 50) : null,
        ecNumber: ing.ec_number ? String(ing.ec_number).substring(0, 50) : null,
        function: ing.function || 'Not specified',
        concentrationMin: ing.concentration_min ? String(ing.concentration_min) : '0.01',
        concentrationMax: ing.concentration_max ? String(ing.concentration_max) : '100.00',
        description: ing.description ? String(ing.description) : null,
        isNatural: Boolean(ing.is_natural),
        isRestricted: Boolean(ing.is_restricted),
        isActive: Boolean(ing.is_active),
        source: ing.source || 'cosing',
        restrictions: ing.restrictions || null,
        usageCount: ing.usage_count || 0,
      }));
    
    if (ingredientsToInsert.length > 0) {
      try {
        await db.insert(ingredients).values(ingredientsToInsert);
        successCount += ingredientsToInsert.length;
        console.log(`  ✅ Imported batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allIngredients.length/batchSize)} (${ingredientsToInsert.length} ingredients)`);
      } catch (error: any) {
        errorCount += batch.length;
        console.error(`  ❌ Error in batch ${Math.floor(i/batchSize) + 1}:`, error.message);
      }
    }
  }
  
  console.log(`✅ Successfully imported ${successCount} ingredients`);
  if (errorCount > 0) {
    console.log(`⚠️  Failed to import ${errorCount} ingredients`);
  }
}

// Import sample formulations with clean data
async function importSampleFormulations() {
  console.log('\n📋 Creating sample formulations...');
  
  const sampleFormulations = [
    {
      name: 'Anti-Aging Serum Formula',
      type: 'serum',
      ingredients: ['WATER', 'GLYCERIN', 'HYALURONIC ACID', 'RETINOL', 'NIACINAMIDE'],
      concentrations: [60, 15, 2, 0.5, 5]
    },
    {
      name: 'Moisturizing Cream Base',
      type: 'cream',
      ingredients: ['WATER', 'GLYCERIN', 'CETEARYL ALCOHOL', 'DIMETHICONE', 'SHEA BUTTER'],
      concentrations: [65, 10, 5, 3, 5]
    },
    {
      name: 'Cleansing Gel Formula',
      type: 'cleanser',
      ingredients: ['WATER', 'SODIUM LAURETH SULFATE', 'COCAMIDOPROPYL BETAINE', 'GLYCERIN'],
      concentrations: [70, 10, 5, 5]
    }
  ];
  
  for (const sample of sampleFormulations) {
    try {
      // Create formulation
      const [newFormulation] = await db.insert(formulations).values({
        name: sample.name,
        version: '1.0.0',
        type: sample.type,
        totalWeight: '100.00',
        status: 'development',
        developedBy: 'System',
        tags: ['sample', sample.type],
      }).returning();
      
      console.log(`  📝 Created formulation: ${sample.name}`);
      
      // Create main phase
      const [mainPhase] = await db.insert(phases).values({
        formulationId: newFormulation.id,
        name: 'Main Phase',
        type: 'aqueous',
        order: 1,
      }).returning();
      
      // Add ingredients
      for (let i = 0; i < sample.ingredients.length; i++) {
        const ingName = sample.ingredients[i];
        const concentration = sample.concentrations[i];
        
        // Find ingredient in database
        const dbIngredientResults = await db.select()
          .from(ingredients)
          .where(eq(ingredients.inciName, ingName))
          .limit(1);
        const dbIngredient = dbIngredientResults[0];
        
        if (dbIngredient) {
          await db.insert(ingredientUsage).values({
            formulationId: newFormulation.id,
            ingredientId: dbIngredient.id,
            phaseId: mainPhase.id,
            concentration: String(concentration),
            function: 'Primary',
            additionOrder: i + 1,
          });
        }
      }
      
      // Add formulation properties
      await db.insert(formulationProperties).values({
        formulationId: newFormulation.id,
        clarity: 'clear',
        ph: '5.5',
      });
      
      console.log(`  ✅ Completed formulation: ${sample.name}`);
      
    } catch (error: any) {
      console.error(`  ❌ Error creating sample formulation:`, error.message);
    }
  }
}

// Main import function
async function main() {
  console.log('🚀 Starting Vessels Data Import...\n');
  
  try {
    // Import ingredients first
    await importIngredients();
    
    // Create sample formulations
    await importSampleFormulations();
    
    console.log('\n✨ Import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
main();
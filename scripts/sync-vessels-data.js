#!/usr/bin/env node

/**
 * Vessels Data Synchronization Script for skintwinformx
 * 
 * This script synchronizes data from the vessels directory with the database.
 * It supports both Neon and Supabase database connections.
 * 
 * Usage:
 *   node scripts/sync-vessels-data.js [--neon|--supabase]
 * 
 * Environment variables:
 *   DATABASE_URL - The database connection URL
 *   SUPABASE_URL - The Supabase project URL (if using Supabase)
 *   SUPABASE_KEY - The Supabase anon key (if using Supabase)
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
const useNeon = args.includes('--neon');
const useSupabase = args.includes('--supabase');
const dryRun = args.includes('--dry-run');

// Determine which database to use
let databaseUrl = process.env.DATABASE_URL;

if (useSupabase && process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  // Extract project reference from Supabase URL
  const projectRef = process.env.SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  if (!projectRef) {
    console.error('Invalid SUPABASE_URL format. Expected https://<project-ref>.supabase.co');
    process.exit(1);
  }
  
  // Construct PostgreSQL connection string for Supabase
  databaseUrl = `postgresql://postgres:${process.env.SUPABASE_KEY}@db.${projectRef}.supabase.co:5432/postgres`;
  console.log(`Using Supabase database connection for project: ${projectRef}`);
} else if (useNeon && !databaseUrl) {
  console.error('DATABASE_URL environment variable is required for Neon connection');
  process.exit(1);
} else if (!databaseUrl) {
  console.error('No database connection specified. Please provide DATABASE_URL or use --supabase with SUPABASE_URL and SUPABASE_KEY');
  process.exit(1);
}

// Create a database connection pool
const pool = new Pool({
  connectionString: databaseUrl,
});

// Path to vessels database file
const vesselsDatabasePath = path.join(__dirname, '../vessels/database/vessel_database_2025-09-03.json');

// Function to read and parse the vessels database file
async function readVesselsDatabase() {
  try {
    const data = fs.readFileSync(vesselsDatabasePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading vessels database file:', error);
    throw error;
  }
}

// Function to synchronize ingredients
async function syncIngredients(client, ingredients) {
  console.log(`Synchronizing ${ingredients.entries.size} ingredients...`);
  
  if (dryRun) {
    console.log('DRY RUN: Would sync ingredients');
    return;
  }
  
  // Convert Map to array for processing
  const ingredientsArray = Array.from(ingredients.entries.entries());
  
  for (const [id, ingredient] of ingredientsArray) {
    try {
      // Check if ingredient exists
      const existingResult = await client.query('SELECT id FROM ingredients WHERE id = $1', [id]);
      
      if (existingResult.rows.length > 0) {
        // Update existing ingredient
        await client.query(`
          UPDATE ingredients 
          SET 
            inci_name = $1,
            trade_names = $2,
            cas_number = $3,
            functions = $4,
            description = $5,
            concentration_range = $6,
            safety_rating = $7,
            usage_frequency = $8,
            cosing = $9,
            regulatory = $10,
            physical_properties = $11,
            network_properties = $12,
            updated_at = NOW()
          WHERE id = $13
        `, [
          ingredient.inciName,
          JSON.stringify(ingredient.tradenames || []),
          ingredient.casNumber,
          JSON.stringify(ingredient.functions || []),
          ingredient.description,
          JSON.stringify(ingredient.concentrationRange || { min: 0.001, max: 100 }),
          ingredient.safetyRating || 'Unknown',
          ingredient.usageFrequency || 0,
          JSON.stringify(ingredient.cosing || {}),
          JSON.stringify(ingredient.regulatory || {}),
          JSON.stringify(ingredient.physicalProperties || {}),
          JSON.stringify(ingredient.networkProperties || {}),
          id
        ]);
        console.log(`Updated ingredient: ${id} - ${ingredient.inciName}`);
      } else {
        // Insert new ingredient
        await client.query(`
          INSERT INTO ingredients (
            id, inci_name, trade_names, cas_number, functions, description,
            concentration_range, safety_rating, usage_frequency, cosing,
            regulatory, physical_properties, network_properties
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          id,
          ingredient.inciName,
          JSON.stringify(ingredient.tradenames || []),
          ingredient.casNumber,
          JSON.stringify(ingredient.functions || []),
          ingredient.description,
          JSON.stringify(ingredient.concentrationRange || { min: 0.001, max: 100 }),
          ingredient.safetyRating || 'Unknown',
          ingredient.usageFrequency || 0,
          JSON.stringify(ingredient.cosing || {}),
          JSON.stringify(ingredient.regulatory || {}),
          JSON.stringify(ingredient.physicalProperties || {}),
          JSON.stringify(ingredient.networkProperties || {})
        ]);
        console.log(`Inserted ingredient: ${id} - ${ingredient.inciName}`);
      }
    } catch (error) {
      console.error(`Error processing ingredient ${id}:`, error);
    }
  }
}

// Function to synchronize formulations
async function syncFormulations(client, formulations) {
  console.log(`Synchronizing ${formulations.entries.size} formulations...`);
  
  if (dryRun) {
    console.log('DRY RUN: Would sync formulations');
    return;
  }
  
  // Convert Map to array for processing
  const formulationsArray = Array.from(formulations.entries.entries());
  
  for (const [id, formulation] of formulationsArray) {
    try {
      // Check if formulation exists
      const existingResult = await client.query('SELECT id FROM formulations WHERE id = $1', [id]);
      
      if (existingResult.rows.length > 0) {
        // Update existing formulation
        await client.query(`
          UPDATE formulations 
          SET 
            name = $1,
            type = $2,
            description = $3,
            ingredient_count = $4,
            complexity_score = $5,
            target_benefits = $6,
            target_skin_types = $7,
            updated_at = NOW()
          WHERE id = $8
        `, [
          formulation.name,
          formulation.type,
          formulation.description,
          formulation.ingredientCount || 0,
          formulation.complexityScore || 0,
          JSON.stringify(formulation.targetBenefits || []),
          JSON.stringify(formulation.targetSkinTypes || []),
          id
        ]);
        console.log(`Updated formulation: ${id} - ${formulation.name}`);
      } else {
        // Insert new formulation
        await client.query(`
          INSERT INTO formulations (
            id, name, type, description, ingredient_count,
            complexity_score, target_benefits, target_skin_types
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          id,
          formulation.name,
          formulation.type,
          formulation.description,
          formulation.ingredientCount || 0,
          formulation.complexityScore || 0,
          JSON.stringify(formulation.targetBenefits || []),
          JSON.stringify(formulation.targetSkinTypes || [])
        ]);
        console.log(`Inserted formulation: ${id} - ${formulation.name}`);
      }
      
      // Process phases if available
      if (formulation.phases && formulation.phases.length > 0) {
        // First delete existing phases for this formulation
        if (!dryRun) {
          await client.query('DELETE FROM phases WHERE formulation_id = $1', [id]);
        }
        
        // Insert new phases
        for (let i = 0; i < formulation.phases.length; i++) {
          const phase = formulation.phases[i];
          await client.query(`
            INSERT INTO phases (
              formulation_id, name, order, description, processing_instructions
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING id
          `, [
            id,
            phase.name,
            i + 1,
            phase.description || '',
            phase.processingInstructions || ''
          ]);
        }
      }
    } catch (error) {
      console.error(`Error processing formulation ${id}:`, error);
    }
  }
}

// Function to synchronize suppliers
async function syncSuppliers(client, suppliers) {
  console.log(`Synchronizing ${suppliers.entries.size} suppliers...`);
  
  if (dryRun) {
    console.log('DRY RUN: Would sync suppliers');
    return;
  }
  
  // Convert Map to array for processing
  const suppliersArray = Array.from(suppliers.entries.entries());
  
  for (const [id, supplier] of suppliersArray) {
    try {
      // Check if supplier exists
      const existingResult = await client.query('SELECT id FROM suppliers WHERE id = $1', [id]);
      
      if (existingResult.rows.length > 0) {
        // Update existing supplier
        await client.query(`
          UPDATE suppliers 
          SET 
            name = $1,
            code = $2,
            contact_info = $3,
            certifications = $4,
            regions_served = $5,
            specialties = $6,
            updated_at = NOW()
          WHERE id = $7
        `, [
          supplier.name,
          supplier.code,
          JSON.stringify(supplier.contactInfo || {}),
          JSON.stringify(supplier.certifications || []),
          JSON.stringify(supplier.regionsServed || []),
          JSON.stringify(supplier.specialties || []),
          id
        ]);
        console.log(`Updated supplier: ${id} - ${supplier.name}`);
      } else {
        // Insert new supplier
        await client.query(`
          INSERT INTO suppliers (
            id, name, code, contact_info, certifications, regions_served, specialties
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          id,
          supplier.name,
          supplier.code,
          JSON.stringify(supplier.contactInfo || {}),
          JSON.stringify(supplier.certifications || []),
          JSON.stringify(supplier.regionsServed || []),
          JSON.stringify(supplier.specialties || [])
        ]);
        console.log(`Inserted supplier: ${id} - ${supplier.name}`);
      }
    } catch (error) {
      console.error(`Error processing supplier ${id}:`, error);
    }
  }
}

// Function to synchronize products
async function syncProducts(client, products) {
  console.log(`Synchronizing ${products.entries.size} products...`);
  
  if (dryRun) {
    console.log('DRY RUN: Would sync products');
    return;
  }
  
  // Convert Map to array for processing
  const productsArray = Array.from(products.entries.entries());
  
  for (const [id, product] of productsArray) {
    try {
      // Check if product exists
      const existingResult = await client.query('SELECT id FROM products WHERE id = $1', [id]);
      
      if (existingResult.rows.length > 0) {
        // Update existing product
        await client.query(`
          UPDATE products 
          SET 
            name = $1,
            description = $2,
            category = $3,
            target_market = $4,
            price_point = $5,
            benefits = $6,
            ingredient_count = $7,
            complexity_score = $8,
            updated_at = NOW()
          WHERE id = $9
        `, [
          product.name,
          product.description,
          product.category,
          product.targetMarket,
          product.pricePoint,
          JSON.stringify(product.benefits || []),
          product.ingredientCount || 0,
          product.complexityScore || 0,
          id
        ]);
        console.log(`Updated product: ${id} - ${product.name}`);
      } else {
        // Insert new product
        await client.query(`
          INSERT INTO products (
            id, name, description, category, target_market,
            price_point, benefits, ingredient_count, complexity_score
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          id,
          product.name,
          product.description,
          product.category,
          product.targetMarket,
          product.pricePoint,
          JSON.stringify(product.benefits || []),
          product.ingredientCount || 0,
          product.complexityScore || 0
        ]);
        console.log(`Inserted product: ${id} - ${product.name}`);
      }
    } catch (error) {
      console.error(`Error processing product ${id}:`, error);
    }
  }
}

// Main function to run the synchronization
async function main() {
  let client;
  
  try {
    // Read the vessels database
    const vesselsDb = await readVesselsDatabase();
    console.log('Vessels database loaded successfully');
    
    // Get a client from the pool
    client = await pool.connect();
    console.log('Connected to database');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Synchronize data
    await syncIngredients(client, vesselsDb.ingredients);
    await syncFormulations(client, vesselsDb.formulations);
    await syncSuppliers(client, vesselsDb.suppliers);
    await syncProducts(client, vesselsDb.products);
    
    // Commit transaction if not a dry run
    if (!dryRun) {
      await client.query('COMMIT');
      console.log('Transaction committed successfully');
    } else {
      await client.query('ROLLBACK');
      console.log('DRY RUN: Transaction rolled back');
    }
    
    console.log('Data synchronization completed successfully');
  } catch (error) {
    // Rollback transaction on error
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error during data synchronization:', error);
    process.exit(1);
  } finally {
    // Release client back to the pool
    if (client) {
      client.release();
    }
    
    // Close the pool
    await pool.end();
  }
}

// Run the main function
main().catch(console.error);

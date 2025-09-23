#!/usr/bin/env node

/**
 * Database migration script for skintwinformx
 * 
 * This script runs the Drizzle migrations against the configured database.
 * It supports both Neon and Supabase database connections.
 * 
 * Usage:
 *   node scripts/run-migrations.js [--neon|--supabase]
 * 
 * Environment variables:
 *   DATABASE_URL - The database connection URL
 *   SUPABASE_URL - The Supabase project URL (if using Supabase)
 *   SUPABASE_KEY - The Supabase anon key (if using Supabase)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
const useNeon = args.includes('--neon');
const useSupabase = args.includes('--supabase');

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

// Create a temporary drizzle config file with the correct database URL
const tempConfigPath = path.join(__dirname, '../drizzle.config.temp.js');
const configContent = `
module.exports = {
  schema: './shared/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: '${databaseUrl}',
  },
};
`;

try {
  // Write temporary config
  fs.writeFileSync(tempConfigPath, configContent);
  console.log('Created temporary Drizzle configuration');
  
  // Run the migration
  console.log('Running database migrations...');
  execSync(`npx drizzle-kit push:pg --config=${tempConfigPath}`, { stdio: 'inherit' });
  
  console.log('Migrations completed successfully');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
} finally {
  // Clean up temporary config file
  if (fs.existsSync(tempConfigPath)) {
    fs.unlinkSync(tempConfigPath);
    console.log('Removed temporary Drizzle configuration');
  }
}

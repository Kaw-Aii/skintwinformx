const { Client } = require('pg');
require('dotenv').config();

async function checkDatabaseTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database\n');
    
    // Get all tables
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log('📊 DATABASE TABLES AND RECORD COUNTS:\n');
    console.log('=' .repeat(70));
    
    let totalRecords = 0;
    const tableCounts = [];
    
    for (const row of tablesResult.rows) {
      const tableName = row.tablename;
      
      // Get count for each table
      const countResult = await client.query(
        `SELECT COUNT(*) as count FROM "${tableName}"`
      );
      const count = parseInt(countResult.rows[0].count);
      totalRecords += count;
      
      tableCounts.push({ table: tableName, count });
      
      // Check if table has any non-corrupted data
      let dataQuality = '';
      if (count > 0 && tableName === 'ingredients') {
        const sampleResult = await client.query(
          `SELECT inci_name FROM ingredients WHERE inci_name IS NOT NULL LIMIT 5`
        );
        const hasCleanData = sampleResult.rows.some(row => {
          const name = row.inci_name;
          return name && !/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/.test(name);
        });
        dataQuality = hasCleanData ? '✅' : '⚠️ (contains corrupt data)';
      }
      
      console.log(`${tableName.padEnd(35)} ${count.toString().padStart(8)} records ${dataQuality}`);
    }
    
    console.log('=' .repeat(70));
    console.log(`\nTotal Tables: ${tablesResult.rows.length}`);
    console.log(`Total Records: ${totalRecords.toLocaleString()}`);
    
    // Check for missing expected tables
    const expectedTables = [
      'ingredients',
      'formulations', 
      'phases',
      'phase_ingredients',
      'suppliers',
      'regulatory_data',
      'stability_tests',
      'stability_observations',
      'performance_metrics',
      'processing_instructions',
      'quality_control',
      'batch_records'
    ];
    
    const existingTables = tablesResult.rows.map(r => r.tablename);
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.log('\n⚠️ MISSING EXPECTED TABLES:');
      missingTables.forEach(table => {
        console.log(`  - ${table}`);
      });
    } else {
      console.log('\n✅ All expected tables exist');
    }
    
    // Check for tables with no data
    const emptyTables = tableCounts.filter(t => t.count === 0);
    if (emptyTables.length > 0) {
      console.log('\n📭 EMPTY TABLES (need data):');
      emptyTables.forEach(t => {
        console.log(`  - ${t.table}`);
      });
    }
    
    // Check for potential corrupt data in formulations
    console.log('\n🔍 CHECKING DATA QUALITY IN KEY TABLES:\n');
    
    // Check formulations table
    const formCheck = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN name ~ '[\\x00-\\x08\\x0B-\\x0C\\x0E-\\x1F\\x7F-\\x9F]' THEN 1 END) as corrupt
      FROM formulations
    `);
    
    const formTotal = parseInt(formCheck.rows[0].total);
    const formCorrupt = parseInt(formCheck.rows[0].corrupt);
    
    console.log(`Formulations Table:`);
    console.log(`  Total: ${formTotal}`);
    console.log(`  Clean: ${formTotal - formCorrupt} ✅`);
    console.log(`  Corrupt: ${formCorrupt} ${formCorrupt > 0 ? '⚠️' : '✅'}`);
    
    // Check ingredients table
    const ingCheck = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN inci_name ~ '[\\x00-\\x08\\x0B-\\x0C\\x0E-\\x1F\\x7F-\\x9F]' THEN 1 END) as corrupt
      FROM ingredients
    `);
    
    const ingTotal = parseInt(ingCheck.rows[0].total);
    const ingCorrupt = parseInt(ingCheck.rows[0].corrupt);
    
    console.log(`\nIngredients Table:`);
    console.log(`  Total: ${ingTotal}`);
    console.log(`  Clean: ${ingTotal - ingCorrupt} ✅`);
    console.log(`  Corrupt: ${ingCorrupt} ${ingCorrupt > 0 ? '⚠️' : '✅'}`);
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n💡 Tables may not be created yet. Run: npm run db:push');
    }
  } finally {
    await client.end();
  }
}

checkDatabaseTables().catch(console.error);

const fs = require('fs');
const path = require('path');

function validateAndFixJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Try to parse JSON
    try {
      const parsed = JSON.parse(content);
      console.log(`✓ ${filePath} - Valid JSON`);
      return { valid: true, fixed: false };
    } catch (parseError) {
      console.log(`⚠ ${filePath} - Invalid JSON, attempting to fix...`);
      
      // Common JSON fixes
      let fixed = content
        // Remove trailing commas
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix unescaped quotes in strings
        .replace(/(?<!\\)"/g, '\\"')
        .replace(/\\"/g, '"')
        // Fix missing quotes around keys
        .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
        // Remove comments
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
      
      try {
        const parsed = JSON.parse(fixed);
        
        // Write fixed version
        const backupPath = `${filePath}.backup`;
        fs.writeFileSync(backupPath, content);
        fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2));
        
        console.log(`✓ ${filePath} - Fixed and saved (backup created)`);
        return { valid: true, fixed: true, backup: backupPath };
      } catch (fixError) {
        console.error(`✗ ${filePath} - Could not fix: ${fixError.message}`);
        return { valid: false, fixed: false, error: fixError.message };
      }
    }
  } catch (error) {
    console.error(`✗ ${filePath} - Read error: ${error.message}`);
    return { valid: false, fixed: false, error: error.message };
  }
}

function validateJsonFiles(directory) {
  const results = [];
  
  function walkDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDirectory(filePath);
      } else if (file.endsWith('.json')) {
        const result = validateAndFixJson(filePath);
        results.push({
          path: filePath,
          ...result
        });
      }
    }
  }
  
  walkDirectory(directory);
  return results;
}

function main() {
  console.log('🔍 Validating and fixing JSON files...\n');
  
  // Check vessels directory
  const vesselsDir = 'vessels';
  if (fs.existsSync(vesselsDir)) {
    const results = validateJsonFiles(vesselsDir);
    
    console.log('\n📊 Validation Summary:');
    console.log(`Total files checked: ${results.length}`);
    console.log(`Valid files: ${results.filter(r => r.valid).length}`);
    console.log(`Fixed files: ${results.filter(r => r.fixed).length}`);
    console.log(`Failed files: ${results.filter(r => !r.valid).length}`);
    
    if (results.some(r => !r.valid)) {
      console.log('\n❌ Failed files:');
      results.filter(r => !r.valid).forEach(r => {
        console.log(`  - ${r.path}: ${r.error}`);
      });
    }
    
    if (results.some(r => r.fixed)) {
      console.log('\n🔧 Fixed files (backups created):');
      results.filter(r => r.fixed).forEach(r => {
        console.log(`  - ${r.path} (backup: ${r.backup})`);
      });
    }
  } else {
    console.log('❌ Vessels directory not found');
  }
}

main();

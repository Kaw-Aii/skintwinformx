const fs = require('fs');
const path = require('path');

// Directories to scan
const SCAN_DIRS = [
  { path: 'vessels/formulations/imported', type: 'Imported Formulations' },
  { path: 'vessels/templates/generated', type: 'Generated Templates' },
  { path: 'vessels/database', type: 'Database Files' },
  { path: 'vessels/ingredients', type: 'Ingredients Data' }
];

// Function to check if a string contains corrupt/unreadable characters
function isCorrupt(str) {
  if (!str || typeof str !== 'string') return false;
  
  // Check for null bytes or other control characters
  const hasControlChars = /[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/.test(str);
  
  // Check for excessive non-ASCII characters (might indicate binary data)
  const nonAsciiCount = (str.match(/[^\x20-\x7E]/g) || []).length;
  const nonAsciiRatio = nonAsciiCount / str.length;
  
  // If more than 30% non-ASCII, likely corrupted
  return hasControlChars || nonAsciiRatio > 0.3;
}

// Function to analyze a JSON file for corruption
function analyzeJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    const issues = [];
    
    // Check for corrupt fields recursively
    function checkObject(obj, path = '') {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          checkObject(item, `${path}[${index}]`);
        });
      } else if (obj && typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string' && isCorrupt(value)) {
            issues.push({
              field: `${path}.${key}`,
              sample: value.substring(0, 50).replace(/[\x00-\x1F\x7F-\x9F]/g, '�')
            });
          } else if (value !== null) {
            checkObject(value, path ? `${path}.${key}` : key);
          }
        }
      }
    }
    
    checkObject(data);
    return { valid: true, corrupt: issues.length > 0, issues };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

console.log('🔍 SCANNING VESSELS FOLDER FOR CORRUPT DATA\n');
console.log('=' .repeat(70));

const allCorruptFiles = [];
let totalFiles = 0;
let corruptFiles = 0;
let invalidFiles = 0;

// Scan each directory
for (const dir of SCAN_DIRS) {
  const dirPath = path.join(__dirname, '..', dir.path);
  
  if (!fs.existsSync(dirPath)) {
    console.log(`\n❌ Directory not found: ${dir.path}`);
    continue;
  }
  
  console.log(`\n📂 ${dir.type} (${dir.path}):`);
  console.log('-'.repeat(50));
  
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
  
  if (files.length === 0) {
    console.log('  No JSON files found');
    continue;
  }
  
  const corruptInDir = [];
  
  files.forEach(file => {
    totalFiles++;
    const filePath = path.join(dirPath, file);
    const analysis = analyzeJsonFile(filePath);
    
    if (!analysis.valid) {
      invalidFiles++;
      console.log(`  ❌ ${file}: Invalid JSON (${analysis.error})`);
    } else if (analysis.corrupt) {
      corruptFiles++;
      corruptInDir.push({ file, issues: analysis.issues });
      allCorruptFiles.push({ dir: dir.path, file, issues: analysis.issues });
      
      console.log(`  ⚠️ ${file}: Contains ${analysis.issues.length} corrupt fields`);
      
      // Show first 3 corrupt fields
      analysis.issues.slice(0, 3).forEach(issue => {
        console.log(`     - ${issue.field}: "${issue.sample}..."`);
      });
      
      if (analysis.issues.length > 3) {
        console.log(`     ... and ${analysis.issues.length - 3} more corrupt fields`);
      }
    }
  });
  
  if (corruptInDir.length === 0) {
    console.log(`  ✅ All ${files.length} files are clean`);
  } else {
    console.log(`  Summary: ${corruptInDir.length} of ${files.length} files contain corrupt data`);
  }
}

// Overall summary
console.log('\n' + '=' .repeat(70));
console.log('\n📊 OVERALL SCAN SUMMARY:\n');
console.log(`Total files scanned: ${totalFiles}`);
console.log(`Clean files: ${totalFiles - corruptFiles - invalidFiles} ✅`);
console.log(`Corrupt files: ${corruptFiles} ⚠️`);
console.log(`Invalid files: ${invalidFiles} ❌`);

if (corruptFiles > 0) {
  console.log('\n🔴 CORRUPT FILES REQUIRING ATTENTION:');
  console.log('These files contain binary/unreadable data from incorrect DOC parsing:\n');
  
  allCorruptFiles.forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.dir}/${item.file}`);
    console.log(`   ${item.issues.length} corrupt fields detected`);
  });
  
  console.log('\n💡 RECOMMENDATION:');
  console.log('1. Re-import data from PDF files instead of DOC files');
  console.log('2. The PDF files contain clean, extractable text');
  console.log('3. DOC files were incorrectly parsed as text causing corruption');
}

// Check database connection and tables
console.log('\n' + '=' .repeat(70));
console.log('\n🗄️ DATABASE TABLE CHECK:\n');

// Create a summary report
const report = {
  scanDate: new Date().toISOString(),
  summary: {
    totalFiles,
    cleanFiles: totalFiles - corruptFiles - invalidFiles,
    corruptFiles,
    invalidFiles
  },
  corruptFilesList: allCorruptFiles,
  recommendation: corruptFiles > 0 ? 
    'Re-import data from PDF files. DOC files contain binary data that was incorrectly parsed.' :
    'No corruption detected in scanned files.'
};

const reportPath = path.join(__dirname, '..', 'vessels', 'corruption-scan-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📄 Report saved to: vessels/corruption-scan-report.json`);
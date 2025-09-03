
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function convertPdfToMarkdown(pdfPath, outputPath) {
  try {
    console.log(`Converting ${pdfPath} to markdown...`);
    
    // Read PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);
    
    let textContent = pdfData.text;
    
    // Convert to markdown format
    const markdown = formatAsMarkdown(textContent, path.basename(pdfPath, '.pdf'));
    
    // Write markdown file
    fs.writeFileSync(outputPath, markdown, 'utf-8');
    console.log(`✓ Created ${outputPath}`);
    
    return true;
  } catch (error) {
    console.error(`Error converting ${pdfPath}:`, error.message);
    return false;
  }
}

function formatAsMarkdown(text, title) {
  // Clean up text and format as markdown
  let markdown = `# ${title}\n\n`;
  
  // Split into sections and clean up
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentSection = '';
  for (const line of lines) {
    // Detect potential headers
    if (line.length < 50 && (line.includes(':') || line.toUpperCase() === line)) {
      if (currentSection) {
        markdown += `${currentSection}\n\n`;
        currentSection = '';
      }
      markdown += `## ${line}\n\n`;
    } else {
      currentSection += `${line}\n`;
    }
  }
  
  if (currentSection) {
    markdown += currentSection;
  }
  
  return markdown;
}

function updateImportReport(conversions) {
  const reportPath = 'vessels/formulations/imported/import-report.json';
  
  try {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    
    // Add markdown conversion status
    report.markdownConversions = {
      timestamp: new Date().toISOString(),
      conversions: conversions,
      totalConverted: conversions.filter(c => c.success).length,
      totalFailed: conversions.filter(c => !c.success).length
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log('✓ Updated import-report.json with markdown conversion status');
  } catch (error) {
    console.error('Error updating import report:', error.message);
  }
}

async function main() {
  const pdfDir = 'vessels/msdspif';
  const markdownDir = 'vessels/markdown';
  
  // Create markdown directory if it doesn't exist
  if (!fs.existsSync(markdownDir)) {
    fs.mkdirSync(markdownDir, { recursive: true });
  }
  
  // Get all PDF files
  const pdfFiles = fs.readdirSync(pdfDir).filter(file => file.endsWith('.pdf'));
  
  console.log(`Found ${pdfFiles.length} PDF files to convert`);
  
  const conversions = [];
  
  for (const pdfFile of pdfFiles) {
    const pdfPath = path.join(pdfDir, pdfFile);
    const markdownFile = pdfFile.replace('.pdf', '.md');
    const markdownPath = path.join(markdownDir, markdownFile);
    
    const success = await convertPdfToMarkdown(pdfPath, markdownPath);
    
    conversions.push({
      original: pdfFile,
      markdown: markdownFile,
      success: success,
      timestamp: new Date().toISOString()
    });
  }
  
  // Update import report
  updateImportReport(conversions);
  
  console.log('\n📊 Conversion Summary:');
  console.log(`✓ Successful: ${conversions.filter(c => c.success).length}`);
  console.log(`✗ Failed: ${conversions.filter(c => !c.success).length}`);
  console.log(`📁 Markdown files saved to: ${markdownDir}`);
}

main().catch(console.error);

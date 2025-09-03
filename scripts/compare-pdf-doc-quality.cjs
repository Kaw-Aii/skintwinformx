const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function extractPDFContent(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
  try {
    const data = await pdf(dataBuffer);
    return {
      text: data.text,
      numpages: data.numpages,
      info: data.info
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function compareDocAndPDF() {
  // File to compare
  const baseName = 'Marine Replenishing Peptide Masque';
  const pdfFile = path.join('vessels', 'msdspif', 'PIF - SpaZone - Marine Replenishing Peptide Masque - 2021_08.pdf');
  const docJsonFile = path.join('vessels', 'formulations', 'imported', 'pif___spazone___marine_replenishing_peptide_masque___2021_08_doc.json');
  
  console.log('📊 Comparing PDF and DOC extraction quality\n');
  console.log('=' .repeat(70));
  
  // Check DOC extraction quality
  console.log('\n📄 DOC File Extraction (via JSON):\n');
  const docData = JSON.parse(fs.readFileSync(docJsonFile, 'utf8'));
  
  console.log('Product Name (from DOC):', docData.name ? docData.name.substring(0, 50) : 'Not extracted');
  console.log('Number of Ingredients:', docData.ingredients ? docData.ingredients.length : 0);
  
  if (docData.ingredients && docData.ingredients.length > 0) {
    console.log('\nFirst 3 ingredients (DOC extraction):');
    docData.ingredients.slice(0, 3).forEach((ing, idx) => {
      const inciName = ing.inciName || '';
      const readable = /^[A-Za-z0-9\s\-\/,()]+$/.test(inciName);
      console.log(`  ${idx + 1}. INCI: ${readable ? inciName : '[CORRUPTED DATA]'}`);
      console.log(`     CAS: ${ing.casNumber ? (ing.casNumber.substring(0, 20) + '...') : 'N/A'}`);
      console.log(`     Readable: ${readable ? '✅' : '❌ (contains unreadable characters)'}`);
    });
  }
  
  // Check PDF extraction quality
  console.log('\n' + '=' .repeat(70));
  console.log('\n📄 PDF File Extraction:\n');
  
  const pdfData = await extractPDFContent(pdfFile);
  
  if (pdfData.error) {
    console.log('Error extracting PDF:', pdfData.error);
  } else {
    console.log('Number of pages:', pdfData.numpages);
    console.log('Text length:', pdfData.text.length, 'characters');
    
    // Extract some key information from PDF text
    const lines = pdfData.text.split('\n').filter(line => line.trim());
    
    // Look for product name
    const productNameLine = lines.find(line => line.includes('Product Name') || line.includes('PRODUCT NAME'));
    if (productNameLine) {
      console.log('\nProduct Name (from PDF):', productNameLine);
    }
    
    // Look for ingredients section
    console.log('\nSearching for ingredients in PDF...');
    const ingredientLines = [];
    let inIngredientSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('INCI Name') || line.includes('Ingredients') || line.includes('COMPOSITION')) {
        inIngredientSection = true;
        console.log('Found ingredients section at line', i);
      }
      
      if (inIngredientSection && line.match(/^[A-Z][A-Z\s\/\-,()]+$/)) {
        // Likely an INCI name (all caps, valid characters)
        if (line.length > 3 && !line.includes('TABLE') && !line.includes('SECTION')) {
          ingredientLines.push(line);
        }
      }
      
      if (ingredientLines.length >= 10) break; // Get first 10 potential ingredients
    }
    
    if (ingredientLines.length > 0) {
      console.log(`\nFirst ${Math.min(5, ingredientLines.length)} potential ingredients from PDF:`);
      ingredientLines.slice(0, 5).forEach((ing, idx) => {
        console.log(`  ${idx + 1}. ${ing}`);
      });
    }
    
    // Show a sample of the extracted text
    console.log('\nSample of extracted PDF text (first 500 chars):');
    console.log(pdfData.text.substring(0, 500).replace(/\n+/g, ' '));
  }
  
  // Summary comparison
  console.log('\n' + '=' .repeat(70));
  console.log('\n📊 QUALITY COMPARISON SUMMARY:\n');
  
  const docReadable = docData.ingredients && docData.ingredients.some(ing => 
    /^[A-Za-z0-9\s\-\/,()]+$/.test(ing.inciName || '')
  );
  
  const pdfReadable = !pdfData.error && pdfData.text && pdfData.text.length > 100;
  
  console.log('DOC File:');
  console.log(`  - Data Quality: ${docReadable ? '⚠️ Partially readable' : '❌ Severely corrupted'}`);
  console.log(`  - Usability: ${docReadable ? 'Limited' : 'Not usable'}`);
  console.log(`  - Issue: Binary DOC file was incorrectly parsed as text`);
  
  console.log('\nPDF File:');
  console.log(`  - Data Quality: ${pdfReadable ? '✅ Readable text extracted' : '❌ Extraction failed'}`);
  console.log(`  - Usability: ${pdfReadable ? 'Good - can extract structured data' : 'Limited'}`);
  console.log(`  - Text Length: ${pdfData.text ? pdfData.text.length : 0} characters`);
  
  console.log('\n📍 RECOMMENDATION:');
  if (pdfReadable && !docReadable) {
    console.log('  ✅ PDF files are MUCH clearer than DOC files');
    console.log('  → Re-import data using PDF extraction instead of DOC parsing');
    console.log('  → PDF text can be properly parsed to extract ingredients and formulation data');
  } else if (!pdfReadable && !docReadable) {
    console.log('  ⚠️ Both formats have extraction issues');
    console.log('  → May need OCR or manual data entry');
  } else {
    console.log('  → Both formats are partially readable, PDF may be slightly better');
  }
}

// Run the comparison
compareDocAndPDF().catch(console.error);
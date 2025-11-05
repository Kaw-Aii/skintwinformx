#!/usr/bin/env node
/**
 * Comprehensive PIF Document Processor
 * Identifies and processes PIF documents (.doc, .docx, .pdf) to generate vessel structures
 * 
 * Usage: npm run process-pif
 */

const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

class PIFDocumentProcessor {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.outputDir = path.join(rootDir, 'vessels');
    this.results = [];
  }

  /**
   * Main processing pipeline
   */
  async run() {
    console.log('🧪 SkinTwin PIF Document Processor');
    console.log('='.repeat(60));
    console.log();

    // Step 1: Identify all PIF documents
    const pifDocuments = await this.identifyPIFDocuments();
    console.log(`\n📁 Found ${pifDocuments.length} PIF documents\n`);

    if (pifDocuments.length === 0) {
      console.log('⚠️  No PIF documents found!');
      return;
    }

    // Step 2: Process each document
    for (const doc of pifDocuments) {
      await this.processSingleDocument(doc);
    }

    // Step 3: Generate report
    this.generateReport();
  }

  /**
   * Identify all PIF documents in the repository
   */
  async identifyPIFDocuments() {
    const pifDocuments = [];

    // Check root directory for .doc files
    const rootFiles = fs.readdirSync(this.rootDir);
    for (const file of rootFiles) {
      if (this.isPIFDocument(file)) {
        const fullPath = path.join(this.rootDir, file);
        const stats = fs.statSync(fullPath);
        const format = file.endsWith('.pdf') ? 'pdf' : file.endsWith('.docx') ? 'docx' : 'doc';
        
        pifDocuments.push({
          fileName: file,
          fullPath,
          format,
          size: stats.size
        });

        console.log(`  ✓ Found: ${file} (${this.formatBytes(stats.size)})`);
      }
    }

    // Check vessels/msdspif directory
    const msdspifDir = path.join(this.rootDir, 'vessels', 'msdspif');
    if (fs.existsSync(msdspifDir)) {
      const msdspifFiles = fs.readdirSync(msdspifDir);
      for (const file of msdspifFiles) {
        if (this.isPIFDocument(file)) {
          const fullPath = path.join(msdspifDir, file);
          const stats = fs.statSync(fullPath);
          const format = file.endsWith('.pdf') ? 'pdf' : file.endsWith('.docx') ? 'docx' : 'doc';
          
          pifDocuments.push({
            fileName: file,
            fullPath,
            format,
            size: stats.size
          });

          console.log(`  ✓ Found: ${file} (${this.formatBytes(stats.size)})`);
        }
      }
    }

    return pifDocuments;
  }

  /**
   * Check if a file is a PIF document
   */
  isPIFDocument(fileName) {
    const pifPattern = /^PIF.*\.(doc|docx|pdf)$/i;
    return pifPattern.test(fileName);
  }

  /**
   * Process a single PIF document
   */
  async processSingleDocument(doc) {
    console.log(`\n📄 Processing: ${doc.fileName}`);
    console.log(`   Format: ${doc.format.toUpperCase()}`);

    try {
      // Extract text from document
      const extractedData = await this.extractDocumentContent(doc);
      
      if (extractedData.extractionQuality < 50) {
        console.log(`   ⚠️  Low extraction quality: ${extractedData.extractionQuality}%`);
      } else {
        console.log(`   ✓ Extraction quality: ${extractedData.extractionQuality}%`);
      }

      console.log(`   ✓ Product: ${extractedData.productInfo.name}`);
      console.log(`   ✓ Ingredients: ${extractedData.ingredients.length}`);

      // Generate vessels
      const vessels = await this.generateVessels(extractedData, doc);
      
      this.results.push({
        fileName: doc.fileName,
        success: true,
        productName: extractedData.productInfo.name,
        vesselsGenerated: vessels
      });

      console.log(`   ✅ Successfully processed`);

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      
      this.results.push({
        fileName: doc.fileName,
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Extract content from document based on format
   */
  async extractDocumentContent(doc) {
    let rawText;

    if (doc.format === 'pdf') {
      rawText = await this.extractFromPDF(doc.fullPath);
    } else {
      rawText = await this.extractFromWord(doc.fullPath);
    }

    // Parse the extracted text
    return this.parseDocumentText(rawText, doc.fileName);
  }

  /**
   * Extract text from PDF using pdf-parse
   */
  async extractFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  /**
   * Extract text from Word document using mammoth for .docx or antiword for .doc
   */
  async extractFromWord(filePath) {
    // Check if it's an old .doc file by trying to detect the format
    const { execSync } = require('child_process');
    
    try {
      // Try using antiword for .doc files (older format)
      const text = execSync(`antiword "${filePath}"`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
      return text;
    } catch (error) {
      // If antiword fails, try mammoth for .docx
      try {
        const result = await mammoth.extractRawText({ path: filePath });
        
        if (result.messages.length > 0) {
          console.log(`   ℹ️  Conversion messages: ${result.messages.length}`);
        }

        return result.value;
      } catch (mammothError) {
        throw new Error(`Failed to extract text from Word document: ${mammothError.message}`);
      }
    }
  }

  /**
   * Parse document text to extract structured data
   */
  parseDocumentText(text, fileName) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // Extract product name from filename as fallback
    const productNameFromFile = fileName
      .replace(/^PIF\s*-\s*/i, '')
      .replace(/\s*-\s*\d{4}_\d{2}\.(doc|docx|pdf)$/i, '')
      .trim();

    const productInfo = {
      name: productNameFromFile,
      type: 'treatment',
      form: 'unknown',
      manufacturer: 'Unknown',
      code: ''
    };

    // Try to extract more specific product info from text
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Product name patterns
      if (line.toLowerCase().includes('product name') && lines[i + 1]) {
        const nameMatch = lines[i + 1].match(/^[\w\s\-']+/);
        if (nameMatch) {
          productInfo.name = nameMatch[0].trim();
        }
      }

      // Product type
      if (line.toLowerCase().includes('product type')) {
        if (lines[i].includes(':')) {
          productInfo.type = lines[i].split(':')[1].trim();
        } else if (lines[i + 1]) {
          productInfo.type = lines[i + 1];
        }
      }

      // Form
      if (line.toLowerCase().includes('form') && !line.toLowerCase().includes('formulation')) {
        if (lines[i].includes(':')) {
          productInfo.form = lines[i].split(':')[1].trim();
        } else if (lines[i + 1]) {
          productInfo.form = lines[i + 1];
        }
      }
    }

    // Extract ingredients
    const ingredients = this.extractIngredients(text);

    // Calculate extraction quality
    const extractionQuality = this.calculateExtractionQuality(
      productInfo,
      ingredients,
      text
    );

    return {
      productInfo,
      ingredients,
      rawText: text,
      extractionQuality
    };
  }

  /**
   * Extract ingredients from text
   */
  extractIngredients(text) {
    const ingredients = [];
    const lines = text.split('\n');
    let inIngredientsSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect ingredients section
      if (
        line.toLowerCase().includes('ingredient') ||
        line.toLowerCase().includes('inci') ||
        line.toLowerCase().includes('composition')
      ) {
        inIngredientsSection = true;
        continue;
      }

      // Stop at next major section
      if (inIngredientsSection && (
        line.toLowerCase().includes('manufacturing') ||
        line.toLowerCase().includes('stability') ||
        line.toLowerCase().includes('physical and chemical')
      )) {
        break;
      }

      // Parse ingredient lines
      if (inIngredientsSection && line.trim()) {
        // Pattern: Ingredient name followed by percentage or CAS number
        const percentMatch = line.match(/(\d+\.?\d*)\s*%/);
        if (percentMatch) {
          // Extract ingredient name (everything before the percentage or number)
          const ingredientName = line
            .split(/\d+\.?\d*\s*%/)[0]
            .replace(/^[\d\s\-\.\|]+/, '')
            .trim();

          if (ingredientName && ingredientName.length > 2) {
            ingredients.push({
              inciName: ingredientName,
              concentration: parseFloat(percentMatch[1])
            });
          }
        }
      }
    }

    return ingredients;
  }

  /**
   * Calculate extraction quality score
   */
  calculateExtractionQuality(productInfo, ingredients, rawText) {
    let score = 0;

    // Product name extracted
    if (productInfo.name && productInfo.name !== 'Unknown') score += 20;

    // Product type extracted
    if (productInfo.type && productInfo.type !== 'treatment') score += 15;

    // Product form extracted
    if (productInfo.form && productInfo.form !== 'unknown') score += 15;

    // Ingredients found
    if (ingredients.length > 0) score += 30;
    if (ingredients.length >= 5) score += 10;
    if (ingredients.length >= 10) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Generate vessel structures from extracted data
   */
  async generateVessels(data, doc) {
    const vessels = {};

    // Generate unique ID from product name
    const baseId = data.productInfo.name
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 15)
      .toUpperCase();

    // Create product vessel
    const productId = `B19PRD${baseId}`;
    const productVessel = {
      id: productId,
      label: data.productInfo.name,
      type: data.productInfo.type,
      form: data.productInfo.form,
      category: this.categorizeProduct(data.productInfo.type),
      ingredient_count: data.ingredients.length,
      source: {
        pif_document: doc.fileName,
        extraction_date: new Date().toISOString(),
        extraction_quality: data.extractionQuality
      },
      metadata: {
        manufacturer: data.productInfo.manufacturer,
        code: data.productInfo.code
      }
    };

    // Create formulation vessel
    const formulationId = `B19FRM${baseId}`;
    const formulationVessel = {
      id: formulationId,
      product_reference: productId,
      name: data.productInfo.name,
      ingredients: data.ingredients.map((ing, idx) => ({
        order: idx + 1,
        inci_name: ing.inciName,
        concentration: ing.concentration,
        cas_number: ing.casNumber,
        function: ing.function || 'active'
      })),
      total_concentration: data.ingredients.reduce((sum, ing) => sum + ing.concentration, 0),
      extraction_metadata: {
        source_document: doc.fileName,
        extraction_date: new Date().toISOString(),
        quality_score: data.extractionQuality
      }
    };

    // Create PIF vessel
    const pifId = `B19PIF${baseId}`;
    const pifVessel = {
      id: pifId,
      product_reference: productId,
      formulation_reference: formulationId,
      document_metadata: {
        filename: doc.fileName,
        format: doc.format,
        size: doc.size,
        path: doc.fullPath
      },
      extraction: {
        date: new Date().toISOString(),
        quality: data.extractionQuality,
        raw_text_length: data.rawText.length
      },
      product_info: data.productInfo,
      ingredients_count: data.ingredients.length
    };

    // Ensure output directories exist
    const productsDir = path.join(this.outputDir, 'products');
    const formulationsDir = path.join(this.outputDir, 'formulations');
    const pifsDir = path.join(this.outputDir, 'msdspif', 'processed');

    for (const dir of [productsDir, formulationsDir, pifsDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // Write vessels to files
    const productPath = path.join(productsDir, `${productId}.json`);
    fs.writeFileSync(productPath, JSON.stringify(productVessel, null, 2));
    vessels.product = productId;
    console.log(`   ✓ Created product vessel: ${productId}.json`);

    const formulationPath = path.join(formulationsDir, `${formulationId}.json`);
    fs.writeFileSync(formulationPath, JSON.stringify(formulationVessel, null, 2));
    vessels.formulation = formulationId;
    console.log(`   ✓ Created formulation vessel: ${formulationId}.json`);

    const pifPath = path.join(pifsDir, `${pifId}.json`);
    fs.writeFileSync(pifPath, JSON.stringify(pifVessel, null, 2));
    vessels.pif = pifId;
    console.log(`   ✓ Created PIF vessel: ${pifId}.json`);

    return vessels;
  }

  /**
   * Categorize product based on type
   */
  categorizeProduct(type) {
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('serum')) return 'serum';
    if (lowerType.includes('cream')) return 'cream';
    if (lowerType.includes('gel')) return 'gel';
    if (lowerType.includes('mask') || lowerType.includes('masque')) return 'mask';
    if (lowerType.includes('cleanser')) return 'cleanser';
    if (lowerType.includes('toner')) return 'toner';
    if (lowerType.includes('oil')) return 'oil';
    if (lowerType.includes('lotion')) return 'lotion';
    
    return 'treatment';
  }

  /**
   * Generate processing report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Processing Report');
    console.log('='.repeat(60));

    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;

    console.log(`\n✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${this.results.length}`);

    if (successful > 0) {
      console.log('\n✅ Successfully Processed:');
      this.results
        .filter(r => r.success)
        .forEach(r => {
          console.log(`   ✓ ${r.fileName}`);
          console.log(`     Product: ${r.productName}`);
          if (r.vesselsGenerated) {
            console.log(`     Vessels: Product, Formulation, PIF`);
          }
        });
    }

    if (failed > 0) {
      console.log('\n❌ Failed:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   ✗ ${r.fileName}`);
          console.log(`     Error: ${r.error}`);
        });
    }

    // Write report to file
    const reportPath = path.join(this.outputDir, 'pif-processing-report.json');
    const report = {
      generated: new Date().toISOString(),
      summary: {
        total: this.results.length,
        successful,
        failed
      },
      results: this.results
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);
    console.log('='.repeat(60));
  }

  /**
   * Format bytes to human-readable format
   */
  formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}

// Main execution
async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const processor = new PIFDocumentProcessor(rootDir);
  await processor.run();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { PIFDocumentProcessor };

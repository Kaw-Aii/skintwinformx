#!/usr/bin/env node
/**
 * Multi-Product PIF Extractor
 * Extracts individual product PIFs from combined PDF documents
 * Converts each PIF to markdown and generates vessel structures
 * 
 * Usage: node scripts/extract-multi-product-pifs.cjs
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

class MultiProductPIFExtractor {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.msdspifDir = path.join(rootDir, 'vessels', 'msdspif');
    this.markdownDir = path.join(rootDir, 'vessels', 'markdown');
    this.productsDir = path.join(rootDir, 'vessels', 'products');
    this.formulationsDir = path.join(rootDir, 'vessels', 'formulations');
    this.processedDir = path.join(this.msdspifDir, 'processed');
    
    this.results = [];
    this.allProducts = [];
  }

  /**
   * Main execution pipeline
   */
  async run() {
    console.log('🧪 Multi-Product PIF Extractor');
    console.log('='.repeat(70));
    console.log();

    // Ensure output directories exist
    this.ensureDirectories();

    // Target PDF files
    const targetPdfs = [
      'PIF - Zone - (8 Products) - 1 of 3 - 2021_08.pdf',
      'PIF - Zone - (8 Products) - 2 of 3 - 2021_08.pdf',
      'PIF - Zone - (8 Products) - 3 of 3 - 2021_08.pdf'
    ];

    console.log(`📁 Target PDFs: ${targetPdfs.length}`);
    console.log();

    // Process each PDF
    for (const pdfFile of targetPdfs) {
      await this.processMultiProductPdf(pdfFile);
    }

    // Generate comprehensive report
    this.generateReport();
  }

  /**
   * Ensure all output directories exist
   */
  ensureDirectories() {
    const dirs = [
      this.markdownDir,
      this.productsDir,
      this.formulationsDir,
      this.processedDir
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Process a single multi-product PDF
   */
  async processMultiProductPdf(pdfFile) {
    const pdfPath = path.join(this.msdspifDir, pdfFile);
    
    console.log(`📄 Processing: ${pdfFile}`);
    
    if (!fs.existsSync(pdfPath)) {
      console.log(`   ❌ File not found: ${pdfPath}`);
      return;
    }

    try {
      // Read and parse PDF
      const dataBuffer = fs.readFileSync(pdfPath);
      const pdfData = await pdfParse(dataBuffer);
      
      console.log(`   ✓ Pages: ${pdfData.numpages}`);
      console.log(`   ✓ Text length: ${pdfData.text.length} characters`);

      // Split into individual product PIFs
      const products = this.splitIntoProducts(pdfData.text, pdfFile);
      
      console.log(`   ✓ Products identified: ${products.length}`);

      // Process each product
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        console.log(`\n   📦 Product ${i + 1}/${products.length}: ${product.name}`);
        
        await this.processIndividualProduct(product, pdfFile, i + 1);
      }

      this.results.push({
        pdfFile,
        success: true,
        productsExtracted: products.length
      });

    } catch (error) {
      console.error(`   ❌ Error processing ${pdfFile}:`, error.message);
      this.results.push({
        pdfFile,
        success: false,
        error: error.message
      });
    }

    console.log();
  }

  /**
   * Split PDF text into individual products
   */
  splitIntoProducts(text, pdfFile) {
    const products = [];
    const lines = text.split('\n');
    
    // Find product boundaries by looking for "PRODUCT INFORMATION FILE" or "Product Name:"
    let currentProduct = null;
    let currentText = '';
    let inProduct = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect start of new product
      if (line.includes('PRODUCT') && line.includes('INFORMATION') && line.includes('FILE')) {
        // Save previous product if exists
        if (currentProduct && currentText) {
          currentProduct.rawText = currentText;
          products.push(currentProduct);
        }
        
        // Start new product
        currentProduct = {
          name: 'Unknown Product',
          rawText: '',
          sourceFile: pdfFile
        };
        currentText = line + '\n';
        inProduct = true;
        continue;
      }

      // Extract product name
      if (inProduct && !currentProduct.nameExtracted && line.toLowerCase().includes('product name')) {
        // Look ahead for the actual product name
        const nextLines = lines.slice(i, i + 5);
        for (const nextLine of nextLines) {
          const trimmed = nextLine.trim();
          // Product name is usually on the next non-empty line or after colon
          if (trimmed.includes(':')) {
            const parts = trimmed.split(':');
            if (parts.length > 1 && parts[1].trim().length > 3) {
              currentProduct.name = parts[1].trim();
              currentProduct.nameExtracted = true;
              break;
            }
          } else if (trimmed.length > 3 && !trimmed.includes('Product') && trimmed.match(/^[A-Za-z0-9\s\-']+$/)) {
            currentProduct.name = trimmed;
            currentProduct.nameExtracted = true;
            break;
          }
        }
      }

      // Accumulate text for current product
      if (inProduct) {
        currentText += line + '\n';
      }
    }

    // Don't forget the last product
    if (currentProduct && currentText) {
      currentProduct.rawText = currentText;
      products.push(currentProduct);
    }

    // If no products found using PIF header, try alternative method
    if (products.length === 0) {
      console.log('   ℹ️  Using alternative product detection method...');
      return this.splitProductsAlternative(text, pdfFile);
    }

    return products;
  }

  /**
   * Alternative method to split products based on page patterns
   */
  splitProductsAlternative(text, pdfFile) {
    const products = [];
    
    // Split by looking for product name patterns
    const productNameRegex = /Product Name:\s*([^\n]+)/gi;
    const matches = [];
    let match;
    
    while ((match = productNameRegex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        name: match[1].trim()
      });
    }

    // Extract text sections for each product
    for (let i = 0; i < matches.length; i++) {
      const startIndex = matches[i].index;
      const endIndex = i < matches.length - 1 ? matches[i + 1].index : text.length;
      
      products.push({
        name: matches[i].name,
        rawText: text.substring(startIndex, endIndex),
        sourceFile: pdfFile
      });
    }

    return products;
  }

  /**
   * Process individual product and generate outputs
   */
  async processIndividualProduct(product, pdfFile, productNumber) {
    try {
      // Parse product data
      const productData = this.parseProductData(product);
      
      // Generate markdown file
      const markdownPath = this.generateMarkdown(productData, pdfFile, productNumber);
      console.log(`      ✓ Markdown: ${path.basename(markdownPath)}`);

      // Generate product vessel
      const productVessel = this.generateProductVessel(productData);
      const productPath = path.join(this.productsDir, `${productVessel.id}.json`);
      fs.writeFileSync(productPath, JSON.stringify(productVessel, null, 2));
      console.log(`      ✓ Product vessel: ${productVessel.id}.json`);

      // Generate formulation vessel
      const formulationVessel = this.generateFormulationVessel(productData, productVessel.id);
      const formulationPath = path.join(this.formulationsDir, `${formulationVessel.id}.json`);
      fs.writeFileSync(formulationPath, JSON.stringify(formulationVessel, null, 2));
      console.log(`      ✓ Formulation vessel: ${formulationVessel.id}.json`);

      // Generate PIF vessel
      const pifVessel = this.generatePIFVessel(productData, productVessel.id, formulationVessel.id);
      const pifPath = path.join(this.processedDir, `${pifVessel.id}.json`);
      fs.writeFileSync(pifPath, JSON.stringify(pifVessel, null, 2));
      console.log(`      ✓ PIF vessel: ${pifVessel.id}.json`);

      this.allProducts.push({
        name: productData.name,
        productId: productVessel.id,
        formulationId: formulationVessel.id,
        pifId: pifVessel.id,
        ingredientCount: productData.ingredients.length,
        sourceFile: pdfFile
      });

    } catch (error) {
      console.error(`      ❌ Error: ${error.message}`);
    }
  }

  /**
   * Parse product data from raw text
   */
  parseProductData(product) {
    const lines = product.rawText.split('\n').map(l => l.trim()).filter(l => l);
    
    const data = {
      name: product.name,
      type: 'Unknown',
      form: 'Unknown',
      color: 'Unknown',
      packSize: 'Unknown',
      manufacturerCode: 'Unknown',
      normalUse: 'Unknown',
      ingredients: [],
      sourceFile: product.sourceFile
    };

    // Look for the product information table section (first 50 lines)
    const tableSection = lines.slice(0, 50);
    
    // Extract product metadata - improved table parsing
    for (let i = 0; i < tableSection.length; i++) {
      const line = tableSection[i];
      const lowerLine = line.toLowerCase();

      // Product type - look for exact matches and reasonable values
      if (lowerLine.includes('product type') && !lowerLine.includes('product name')) {
        const value = this.extractTableValue(line, tableSection[i + 1], tableSection[i + 2]);
        if (value && value !== 'Product type' && this.isReasonableValue(value, 100)) {
          data.type = value;
        }
      }

      // Form
      if (lowerLine === 'form' || (lowerLine.startsWith('form ') && !lowerLine.includes('formulation'))) {
        const value = this.extractTableValue(line, tableSection[i + 1], tableSection[i + 2]);
        if (value && value !== 'Form' && this.isReasonableValue(value, 50)) {
          data.form = value;
        }
      }

      // Color/Colour
      if (lowerLine === 'colour' || lowerLine === 'color') {
        const value = this.extractTableValue(line, tableSection[i + 1], tableSection[i + 2]);
        if (value && value !== 'Colour' && value !== 'Color' && this.isReasonableValue(value, 30)) {
          data.color = value;
        }
      }

      // Pack size
      if (lowerLine.includes('pack size')) {
        const value = this.extractTableValue(line, tableSection[i + 1], tableSection[i + 2]);
        if (value && this.isReasonableValue(value, 30)) {
          data.packSize = value;
        }
      }

      // Manufacturer code
      if (lowerLine.includes('manufacturer code')) {
        const value = this.extractTableValue(line, tableSection[i + 1], tableSection[i + 2]);
        if (value && this.isReasonableValue(value, 20)) {
          data.manufacturerCode = value;
        }
      }

      // Normal use
      if (lowerLine.includes('normal use')) {
        const value = this.extractTableValue(line, tableSection[i + 1], tableSection[i + 2]);
        if (value && this.isReasonableValue(value, 200)) {
          data.normalUse = value;
        }
      }
    }

    // Extract ingredients
    data.ingredients = this.extractIngredients(product.rawText);

    return data;
  }

  /**
   * Extract value from table (handles inline, next-line, and multi-line patterns)
   */
  extractTableValue(line, nextLine, nextNextLine) {
    // Try inline (after colon or space after label)
    if (line.includes(':')) {
      const parts = line.split(':');
      if (parts.length > 1) {
        const value = parts.slice(1).join(':').trim();
        if (value && value.length > 0 && value.length < 200) {
          return value;
        }
      }
    }

    // Try next line (most common in PDF tables)
    if (nextLine && nextLine.length > 0 && nextLine.length < 200) {
      // Skip if it looks like another field label
      if (!this.looksLikeFieldLabel(nextLine)) {
        return nextLine;
      }
    }

    // Try next-next line
    if (nextNextLine && nextNextLine.length > 0 && nextNextLine.length < 200) {
      if (!this.looksLikeFieldLabel(nextNextLine)) {
        return nextNextLine;
      }
    }

    return null;
  }

  /**
   * Check if a value looks like a field label
   */
  looksLikeFieldLabel(text) {
    const lowerText = text.toLowerCase();
    const fieldLabels = [
      'product name', 'product type', 'form', 'colour', 'color', 
      'pack size', 'pack type', 'dispenser type', 'part of a set',
      'manufacturer code', 'normal use', 'pictures', 'formulation'
    ];
    
    return fieldLabels.some(label => lowerText.includes(label));
  }

  /**
   * Check if value is reasonable (not too long, not another field)
   */
  isReasonableValue(value, maxLength) {
    if (!value || value.length === 0 || value.length > maxLength) {
      return false;
    }
    
    // Reject if it looks like another field label
    if (this.looksLikeFieldLabel(value)) {
      return false;
    }
    
    // Reject if it looks like a page number or table header
    if (value.match(/^[\d\s]+$/) || value.match(/^\d+$/)) {
      return false;
    }
    
    return true;
  }

  /**
   * Extract ingredients from text
   */
  extractIngredients(text) {
    const ingredients = [];
    const lines = text.split('\n');
    let inIngredientsSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();

      // Start of ingredients section
      if (lowerLine.includes('ingredient') || lowerLine.includes('inci') || 
          lowerLine.includes('composition') || lowerLine.includes('formulation')) {
        if (!lowerLine.includes('information') && !lowerLine.includes('file')) {
          inIngredientsSection = true;
          continue;
        }
      }

      // End of ingredients section
      if (inIngredientsSection && (
        lowerLine.includes('manufacturing') ||
        lowerLine.includes('stability') ||
        lowerLine.includes('physical and chemical') ||
        lowerLine.includes('microbiological')
      )) {
        break;
      }

      // Parse ingredient lines
      if (inIngredientsSection && line.length > 0) {
        // Look for percentage pattern
        const percentMatch = line.match(/(\d+\.?\d*)\s*%/);
        if (percentMatch) {
          // Extract ingredient name (before the percentage)
          const namePart = line.split(percentMatch[0])[0].trim();
          // Remove leading numbers, dashes, pipes
          const cleanName = namePart.replace(/^[\d\s\-\.\|]+/, '').trim();
          
          if (cleanName && cleanName.length > 2 && !cleanName.toLowerCase().includes('total')) {
            ingredients.push({
              inciName: cleanName,
              concentration: parseFloat(percentMatch[1])
            });
          }
        }
      }
    }

    return ingredients;
  }

  /**
   * Generate markdown file for product
   */
  generateMarkdown(productData, pdfFile, productNumber) {
    const fileName = this.generateFileName(productData.name);
    const markdownPath = path.join(this.markdownDir, `${fileName}.md`);

    let markdown = `# ${productData.name}\n\n`;
    markdown += `**Source:** ${pdfFile} (Product ${productNumber})\n\n`;
    markdown += `**Extracted:** ${new Date().toISOString()}\n\n`;
    markdown += `---\n\n`;
    
    markdown += `## Product Information\n\n`;
    markdown += `- **Product Type:** ${productData.type}\n`;
    markdown += `- **Form:** ${productData.form}\n`;
    markdown += `- **Color:** ${productData.color}\n`;
    markdown += `- **Pack Size:** ${productData.packSize}\n`;
    markdown += `- **Manufacturer Code:** ${productData.manufacturerCode}\n`;
    markdown += `- **Normal Use:** ${productData.normalUse}\n\n`;

    if (productData.ingredients.length > 0) {
      markdown += `## Ingredients (${productData.ingredients.length})\n\n`;
      markdown += `| Ingredient | Concentration (%) |\n`;
      markdown += `|------------|-------------------|\n`;
      
      for (const ing of productData.ingredients) {
        markdown += `| ${ing.inciName} | ${ing.concentration} |\n`;
      }
      markdown += `\n`;
    }

    markdown += `## Raw Data Extract\n\n`;
    markdown += `\`\`\`\n`;
    markdown += productData.sourceFile ? `Source: ${productData.sourceFile}\n` : '';
    markdown += `Product: ${productData.name}\n`;
    markdown += `Type: ${productData.type}\n`;
    markdown += `Form: ${productData.form}\n`;
    markdown += `\`\`\`\n`;

    fs.writeFileSync(markdownPath, markdown, 'utf-8');
    return markdownPath;
  }

  /**
   * Generate product vessel
   */
  generateProductVessel(productData) {
    const baseId = this.generateFileName(productData.name).toUpperCase();
    
    return {
      id: `B19PRD${baseId}`,
      label: productData.name,
      type: productData.type,
      form: productData.form,
      category: this.categorizeProduct(productData.type),
      ingredient_count: productData.ingredients.length,
      source: {
        pif_document: productData.sourceFile,
        extraction_date: new Date().toISOString(),
        extraction_quality: this.calculateQuality(productData)
      },
      metadata: {
        manufacturer_code: productData.manufacturerCode,
        color: productData.color,
        pack_size: productData.packSize,
        normal_use: productData.normalUse
      }
    };
  }

  /**
   * Generate formulation vessel
   */
  generateFormulationVessel(productData, productId) {
    const baseId = this.generateFileName(productData.name).toUpperCase();
    
    return {
      id: `B19FRM${baseId}`,
      product_reference: productId,
      name: productData.name,
      ingredients: productData.ingredients.map((ing, idx) => ({
        order: idx + 1,
        inci_name: ing.inciName,
        concentration: ing.concentration,
        function: 'active'
      })),
      total_concentration: productData.ingredients.reduce((sum, ing) => sum + ing.concentration, 0),
      extraction_metadata: {
        source_document: productData.sourceFile,
        extraction_date: new Date().toISOString(),
        quality_score: this.calculateQuality(productData)
      }
    };
  }

  /**
   * Generate PIF vessel
   */
  generatePIFVessel(productData, productId, formulationId) {
    const baseId = this.generateFileName(productData.name).toUpperCase();
    
    return {
      id: `B19PIF${baseId}`,
      product_reference: productId,
      formulation_reference: formulationId,
      document_metadata: {
        filename: productData.sourceFile,
        format: 'pdf',
        extraction_date: new Date().toISOString()
      },
      product_info: {
        name: productData.name,
        type: productData.type,
        form: productData.form,
        color: productData.color,
        pack_size: productData.packSize,
        manufacturer_code: productData.manufacturerCode,
        normal_use: productData.normalUse
      },
      ingredients_count: productData.ingredients.length
    };
  }

  /**
   * Generate safe filename from product name
   */
  generateFileName(productName) {
    return productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 20);
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
    if (lowerType.includes('peel')) return 'peel';
    
    return 'treatment';
  }

  /**
   * Calculate extraction quality score
   */
  calculateQuality(productData) {
    let score = 0;

    if (productData.name && productData.name !== 'Unknown Product') score += 20;
    if (productData.type && productData.type !== 'Unknown') score += 15;
    if (productData.form && productData.form !== 'Unknown') score += 15;
    if (productData.ingredients.length > 0) score += 30;
    if (productData.ingredients.length >= 5) score += 10;
    if (productData.ingredients.length >= 10) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 Extraction Report');
    console.log('='.repeat(70));

    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalProducts = this.allProducts.length;

    console.log(`\n📁 PDFs Processed: ${this.results.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`\n📦 Total Products Extracted: ${totalProducts}`);

    if (this.allProducts.length > 0) {
      console.log('\n📋 Products Extracted:\n');
      this.allProducts.forEach((product, idx) => {
        console.log(`${idx + 1}. ${product.name}`);
        console.log(`   Product ID: ${product.productId}`);
        console.log(`   Formulation ID: ${product.formulationId}`);
        console.log(`   PIF ID: ${product.pifId}`);
        console.log(`   Ingredients: ${product.ingredientCount}`);
        console.log(`   Source: ${product.sourceFile}\n`);
      });
    }

    // Save report to file
    const reportPath = path.join(this.msdspifDir, 'extraction-report.json');
    const report = {
      generated: new Date().toISOString(),
      summary: {
        pdfs_processed: this.results.length,
        successful,
        failed,
        total_products: totalProducts
      },
      products: this.allProducts,
      results: this.results
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved: ${reportPath}`);
    console.log('='.repeat(70));
  }
}

// Main execution
async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const extractor = new MultiProductPIFExtractor(rootDir);
  await extractor.run();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { MultiProductPIFExtractor };

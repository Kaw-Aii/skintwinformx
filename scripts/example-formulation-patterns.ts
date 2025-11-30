/**
 * Example Usage: COSING Formulation Patterns
 * 
 * This file demonstrates how to use the formulation pattern system
 * to build intelligent skincare formulations.
 * 
 * SKIN-TWIN Cosmetic Formulation Intelligence Agent
 */

import fs from 'fs';
import path from 'path';
import {
  FormulationPatternManager,
  PatternCategory,
  formatPattern,
  type FormulationPattern,
} from '../app/lib/vessels/formulation-patterns';

// ============================================================================
// Load Pattern Data
// ============================================================================

async function loadPatternData() {
  const dataPath = path.join(
    process.cwd(),
    'vessels',
    'cosing',
    'formulation_patterns.json'
  );
  const data = JSON.parse(await fs.promises.readFile(dataPath, 'utf-8'));
  return new FormulationPatternManager(data);
}

// ============================================================================
// Example 1: Find Patterns for a Moisturizer
// ============================================================================

async function example1_FindMoisturizerPatterns() {
  console.log('🧴 Example 1: Finding Patterns for a Moisturizer\n');
  console.log('='.repeat(60));

  const manager = await loadPatternData();

  // Get base patterns
  const basePatterns = manager
    .findByCategory(PatternCategory.BASE_FORMING)
    .slice(0, 2);

  console.log('\n📦 Base Forming Patterns:');
  basePatterns.forEach((p, i) => {
    console.log(`\n${i + 1}. ${p.name}`);
    console.log(`   - Usage: ${p.usage_frequency} ingredients`);
    console.log(`   - Applications: ${p.typical_applications.join(', ')}`);
  });

  // Get active patterns for moisturizing
  const activePatterns = manager
    .findByFunctions(['SKIN CONDITIONING', 'HUMECTANT'])
    .slice(0, 3);

  console.log('\n💧 Active Delivery Patterns:');
  activePatterns.forEach((p, i) => {
    console.log(`\n${i + 1}. ${p.name}`);
    console.log(`   - Complexity: ${p.complexity_score}/10`);
    console.log(
      `   - Concentration: ${p.recommended_concentration_range.min}% - ${p.recommended_concentration_range.max}%`
    );
  });

  // Get preservation patterns
  const preservationPatterns = manager
    .findByCategory(PatternCategory.PRESERVATION)
    .slice(0, 2);

  console.log('\n🛡️  Preservation Patterns:');
  preservationPatterns.forEach((p, i) => {
    console.log(`\n${i + 1}. ${p.name}`);
    console.log(`   - Functions: ${p.functions.join(', ')}`);
  });

  console.log('\n' + '='.repeat(60));
}

// ============================================================================
// Example 2: Build a Complete Formulation Template
// ============================================================================

async function example2_BuildFormulationTemplate() {
  console.log('\n\n🧪 Example 2: Building a Complete Formulation Template\n');
  console.log('='.repeat(60));

  const manager = await loadPatternData();

  // Get a complete template for a serum
  const template = manager.suggestFormulationTemplate('serum');

  console.log('\n📋 Suggested Formulation Template for SERUM:\n');

  console.log('🔹 Base Components:');
  template.base.slice(0, 2).forEach((p) => {
    console.log(`   - ${p.name} (${p.usage_frequency} uses)`);
  });

  console.log('\n🔹 Emulsification:');
  template.emulsification.slice(0, 2).forEach((p) => {
    console.log(`   - ${p.name}`);
  });

  console.log('\n🔹 Active Ingredients:');
  template.actives.slice(0, 3).forEach((p) => {
    console.log(`   - ${p.name}`);
    console.log(`     Examples: ${p.ingredient_examples.slice(0, 2).join(', ')}`);
  });

  console.log('\n🔹 Preservation System:');
  template.preservation.forEach((p) => {
    console.log(`   - ${p.name}`);
  });

  console.log('\n🔹 Sensory Enhancement:');
  template.sensory.forEach((p) => {
    console.log(`   - ${p.name}`);
  });

  console.log('\n' + '='.repeat(60));
}

// ============================================================================
// Example 3: Check Pattern Compatibility
// ============================================================================

async function example3_CheckCompatibility() {
  console.log('\n\n🔍 Example 3: Checking Pattern Compatibility\n');
  console.log('='.repeat(60));

  const manager = await loadPatternData();

  // Select some patterns for a formulation
  const selectedPatterns = manager.getMostCommon(5).map((p) => p.id);

  console.log('\n📌 Selected Patterns:');
  selectedPatterns.forEach((id) => {
    const pattern = manager
      .getMostCommon(100)
      .find((p) => p.id === id);
    if (pattern) {
      console.log(`   - ${id}: ${pattern.name}`);
    }
  });

  // Check compatibility
  const compatibility = manager.checkCompatibility(selectedPatterns);

  console.log('\n✅ Compatibility Check:');
  console.log(`   Compatible: ${compatibility.compatible ? 'YES' : 'NO'}`);

  if (compatibility.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    compatibility.warnings.forEach((w) => {
      console.log(`   - ${w}`);
    });
  }

  if (compatibility.suggestions.length > 0) {
    console.log('\n💡 Suggestions:');
    compatibility.suggestions.forEach((s) => {
      console.log(`   - ${s}`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

// ============================================================================
// Example 4: Generate Formulation Report
// ============================================================================

async function example4_FormulationReport() {
  console.log('\n\n📊 Example 4: Generating Formulation Report\n');
  console.log('='.repeat(60));

  const manager = await loadPatternData();

  // Select patterns for a simple moisturizer
  const patternIds = manager
    .getMostCommon(20)
    .filter(
      (p) =>
        p.category === PatternCategory.ACTIVE_DELIVERY ||
        p.category === PatternCategory.PRESERVATION
    )
    .slice(0, 5)
    .map((p) => p.id);

  const report = manager.generateFormulationReport(patternIds);

  console.log('\n📝 Formulation Report:\n');
  console.log(`Total Patterns: ${report.patterns.length}`);
  console.log(`Total Functions: ${report.total_functions}`);
  console.log(
    `Concentration Range: ${report.concentration_range.min}% - ${report.concentration_range.max}%`
  );

  console.log('\n📊 Category Breakdown:');
  report.categories.forEach((count, category) => {
    console.log(`   ${category}: ${count} patterns`);
  });

  console.log('\n🧪 Recommended Ingredients (sample):');
  report.recommended_ingredients.slice(0, 8).forEach((ing) => {
    console.log(`   - ${ing}`);
  });

  console.log('\n✔️  Compatibility Status:');
  console.log(
    `   ${report.compatibility_check.compatible ? '✅ Compatible' : '❌ Issues Found'}`
  );

  console.log('\n' + '='.repeat(60));
}

// ============================================================================
// Example 5: Search and Explore Patterns
// ============================================================================

async function example5_SearchPatterns() {
  console.log('\n\n🔎 Example 5: Searching and Exploring Patterns\n');
  console.log('='.repeat(60));

  const manager = await loadPatternData();

  // Search for UV protection patterns
  console.log('\n☀️  Searching for UV protection patterns:');
  const uvPatterns = manager.search('UV');
  console.log(`   Found ${uvPatterns.length} patterns`);
  uvPatterns.slice(0, 3).forEach((p) => {
    console.log(`   - ${p.name} (${p.usage_frequency} uses)`);
  });

  // Search for anti-aging patterns
  console.log('\n⏰ Searching for antioxidant patterns:');
  const antiAgingPatterns = manager.search('antioxidant');
  console.log(`   Found ${antiAgingPatterns.length} patterns`);
  antiAgingPatterns.slice(0, 3).forEach((p) => {
    console.log(`   - ${p.name} (${p.usage_frequency} uses)`);
  });

  // Find simple patterns
  console.log('\n🎯 Finding simple patterns (low complexity, high usage):');
  const simplePatterns = manager.getSimplePatterns(5);
  simplePatterns.forEach((p) => {
    console.log(
      `   - ${p.name} (complexity: ${p.complexity_score}/10, uses: ${p.usage_frequency})`
    );
  });

  console.log('\n' + '='.repeat(60));
}

// ============================================================================
// Example 6: Find Related Patterns
// ============================================================================

async function example6_RelatedPatterns() {
  console.log('\n\n🔗 Example 6: Finding Related Patterns\n');
  console.log('='.repeat(60));

  const manager = await loadPatternData();

  // Get the most common pattern
  const topPattern = manager.getMostCommon(1)[0];

  console.log(`\n🎯 Base Pattern: ${topPattern.name}`);
  console.log(`   ID: ${topPattern.id}`);
  console.log(`   Functions: ${topPattern.functions.join(', ')}`);

  // Find related patterns
  const related = manager.findRelatedPatterns(topPattern.id, 5);

  console.log(`\n🔗 Related Patterns (sharing similar functions):\n`);
  related.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   - Shared functions: ${p.functions.filter(f => topPattern.functions.includes(f)).join(', ')}`);
    console.log(`   - Category: ${p.category}`);
    console.log(`   - Usage: ${p.usage_frequency} ingredients\n`);
  });

  console.log('='.repeat(60));
}

// ============================================================================
// Example 7: Category Analysis
// ============================================================================

async function example7_CategoryAnalysis() {
  console.log('\n\n📈 Example 7: Pattern Category Analysis\n');
  console.log('='.repeat(60));

  const manager = await loadPatternData();

  const summary = manager.getCategorySummary();

  console.log('\n📊 Pattern Distribution by Category:\n');

  const total = manager.getTotalPatterns();

  summary.forEach((count, category) => {
    const percentage = ((count / total) * 100).toFixed(1);
    console.log(`${category.padEnd(30)} ${count.toString().padStart(5)} patterns (${percentage}%)`);
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`${'TOTAL'.padEnd(30)} ${total.toString().padStart(5)} patterns (100.0%)`);

  console.log('\n' + '='.repeat(60));
}

// ============================================================================
// Run All Examples
// ============================================================================

async function runAllExamples() {
  console.log('\n');
  console.log('🧪 SKIN-TWIN Formulation Pattern Examples');
  console.log('═'.repeat(60));
  console.log('Demonstrating the COSING-based pattern system\n');

  try {
    await example1_FindMoisturizerPatterns();
    await example2_BuildFormulationTemplate();
    await example3_CheckCompatibility();
    await example4_FormulationReport();
    await example5_SearchPatterns();
    await example6_RelatedPatterns();
    await example7_CategoryAnalysis();

    console.log('\n\n✨ All examples completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  example1_FindMoisturizerPatterns,
  example2_BuildFormulationTemplate,
  example3_CheckCompatibility,
  example4_FormulationReport,
  example5_SearchPatterns,
  example6_RelatedPatterns,
  example7_CategoryAnalysis,
};

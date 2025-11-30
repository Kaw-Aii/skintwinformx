# COSING Functional Formulation Patterns

## Overview

The SKIN-TWIN Formulation Pattern System is a comprehensive analysis of all functional combinations present in the European COSING (Cosmetic Ingredients) database. This system enables intelligent ingredient selection, formulation optimization, and pattern-based product development.

## What Are Formulation Patterns?

Formulation patterns are recurring combinations of cosmetic functions that ingredients perform. These patterns are derived from the official COSING database which lists 30,070 cosmetic ingredients with their associated functions.

### Key Statistics

- **Total Ingredients Analyzed**: 30,070
- **Unique Atomic Functions**: 80
- **Unique Function Combinations**: 2,498
- **Generated Formulation Patterns**: 2,498
- **Most Common Function**: SKIN CONDITIONING (13,066 ingredients)
- **Average Functions per Ingredient**: 1.75
- **Most Complex Combination**: 11 functions

## Pattern Categories

All formulation patterns are classified into six main categories:

### 1. BASE_FORMING (588 patterns)
Base forming patterns include ingredients that provide the bulk structure and texture of a formulation.

**Key Functions:**
- Solvents
- Bulking agents
- Viscosity controlling agents

**Typical Applications:**
- Water phase bases
- Gel bases
- Cream bases

### 2. EMULSIFICATION (489 patterns)
Emulsification patterns involve ingredients that help mix oil and water phases.

**Key Functions:**
- Surfactant - Emulsifying
- Emulsion Stabilising
- Surfactant - Cleansing

**Typical Applications:**
- Creams and lotions
- Cleansers
- Conditioners

### 3. ACTIVE_DELIVERY (914 patterns)
The largest category, containing ingredients that deliver therapeutic and conditioning benefits.

**Key Functions:**
- Skin Conditioning
- Hair Conditioning
- Moisturising
- Humectant
- Skin Conditioning - Emollient

**Typical Applications:**
- Serums
- Treatment products
- Moisturizers
- Hair care products

### 4. PRESERVATION (209 patterns)
Preservation patterns include antimicrobial and stabilizing agents.

**Key Functions:**
- Antimicrobial
- Preservative
- Antioxidant

**Typical Applications:**
- All product types (preservation systems)
- Anti-aging products
- Stabilization systems

### 5. SENSORY_ENHANCEMENT (105 patterns)
These patterns improve the sensory experience of the product.

**Key Functions:**
- Perfuming
- Fragrance
- Colorant
- Opacifying

**Typical Applications:**
- All product types
- Color cosmetics
- Fragranced products

### 6. FUNCTIONAL_SPECIALTY (193 patterns)
Specialized functional patterns for specific applications.

**Key Functions:**
- UV Absorber/Filter
- Cleansing
- Exfoliating
- Hair Dyeing

**Typical Applications:**
- Sunscreens
- Cleansers
- Exfoliants
- Hair dyes

## Top 10 Most Common Patterns

These are the most frequently occurring functional patterns in the COSING database:

1. **SKIN CONDITIONING** (6,531 ingredients)
   - Single-function pattern
   - Used in: Moisturizers, serums, creams, lotions

2. **PERFUMING** (2,142 ingredients)
   - Single-function pattern
   - Used in: All fragranced products

3. **SKIN CONDITIONING + SKIN CONDITIONING - EMOLLIENT** (919 ingredients)
   - Dual-function moisturizing pattern
   - Used in: Rich creams, body butters, intensive treatments

4. **SURFACTANT - CLEANSING + SURFACTANT - EMULSIFYING** (810 ingredients)
   - Cleansing and emulsification pattern
   - Used in: Facial cleansers, body wash, shampoos

5. **ANTIOXIDANT** (627 ingredients)
   - Single-function preservation pattern
   - Used in: Anti-aging products, protective formulations

6. **SURFACTANT - EMULSIFYING** (613 ingredients)
   - Single-function emulsification pattern
   - Used in: Creams, lotions, emulsions

7. **HAIR CONDITIONING + SKIN CONDITIONING** (598 ingredients)
   - Dual conditioning pattern
   - Used in: Hair conditioners, leave-in treatments, multi-use products

8. **HUMECTANT + SKIN CONDITIONING** (566 ingredients)
   - Hydration and conditioning pattern
   - Used in: Hydrating serums, moisturizers

9. **SKIN PROTECTING** (540 ingredients)
   - Single-function protective pattern
   - Used in: Barrier creams, protective treatments

10. **SKIN CONDITIONING - EMOLLIENT** (538 ingredients)
    - Single-function emollient pattern
    - Used in: Rich creams, oils, occlusives

## Using the Formulation Pattern System

### Pattern Structure

Each formulation pattern includes:

```typescript
{
  id: string;                    // Unique identifier (e.g., "FP_SC_SCE")
  name: string;                  // Human-readable name
  functions: string[];           // List of COSING functions
  function_count: number;        // Number of functions
  typical_applications: string[];// Product types
  ingredient_examples: string[]; // Sample INCI names
  usage_frequency: number;       // How many ingredients have this pattern
  complexity_score: number;      // 1-10 scale
  category: PatternCategory;     // One of six categories
  recommended_concentration_range: {
    min: number;
    max: number;
  };
  synergistic_patterns: string[];    // Compatible pattern IDs
  incompatible_patterns: string[];   // Incompatible pattern IDs
}
```

### API Usage Examples

#### 1. Load the Pattern Manager

```typescript
import { FormulationPatternManager } from '~/lib/vessels/formulation-patterns';
import patternData from '~/vessels/cosing/formulation_patterns.json';

const patternManager = new FormulationPatternManager(patternData);
```

#### 2. Find Patterns by Category

```typescript
const activePatterns = patternManager.findByCategory(
  PatternCategory.ACTIVE_DELIVERY
);
console.log(`Found ${activePatterns.length} active delivery patterns`);
```

#### 3. Search for Specific Functions

```typescript
const moisturizingPatterns = patternManager.findByFunctions([
  'SKIN CONDITIONING',
  'HUMECTANT'
]);
```

#### 4. Get Simple, Common Patterns

```typescript
// Get patterns with low complexity and high usage
const simplePatterns = patternManager.getSimplePatterns(20);
```

#### 5. Find Patterns for a Product Type

```typescript
const serumPatterns = patternManager.findByApplication('serum');
```

#### 6. Get a Complete Formulation Template

```typescript
const template = patternManager.suggestFormulationTemplate('moisturizer');
// Returns patterns for: base, emulsification, actives, preservation, sensory
```

#### 7. Check Pattern Compatibility

```typescript
const patternIds = ['FP_SC_SCE', 'FP_H_SC', 'FP_AM'];
const compatibility = patternManager.checkCompatibility(patternIds);

console.log('Compatible:', compatibility.compatible);
console.log('Warnings:', compatibility.warnings);
console.log('Suggestions:', compatibility.suggestions);
```

#### 8. Generate Formulation Report

```typescript
const report = patternManager.generateFormulationReport(patternIds);
console.log('Total functions:', report.total_functions);
console.log('Concentration range:', report.concentration_range);
console.log('Recommended ingredients:', report.recommended_ingredients);
```

## Pattern-Based Formulation Workflow

### Step 1: Define Product Goals
Identify the target product type and desired benefits:
- Product type: Moisturizer, serum, cleanser, etc.
- Key benefits: Hydration, anti-aging, protection, etc.
- Sensory targets: Texture, absorption, fragrance

### Step 2: Select Base Patterns
Choose patterns from BASE_FORMING category:
```typescript
const basePatterns = patternManager
  .findByCategory(PatternCategory.BASE_FORMING)
  .filter(p => p.complexity_score <= 3)
  .slice(0, 2);
```

### Step 3: Add Functional Patterns
Select patterns that deliver the desired benefits:
```typescript
const activePatterns = patternManager
  .findByApplication('moisturizer')
  .filter(p => p.category === PatternCategory.ACTIVE_DELIVERY)
  .slice(0, 3);
```

### Step 4: Include Preservation
Always include preservation patterns:
```typescript
const preservationPatterns = patternManager
  .findByCategory(PatternCategory.PRESERVATION)
  .slice(0, 1);
```

### Step 5: Validate Compatibility
Check that patterns work together:
```typescript
const allPatternIds = [
  ...basePatterns.map(p => p.id),
  ...activePatterns.map(p => p.id),
  ...preservationPatterns.map(p => p.id)
];

const validation = patternManager.checkCompatibility(allPatternIds);
if (!validation.compatible) {
  console.warn('Formulation issues detected:', validation.warnings);
}
```

### Step 6: Select Specific Ingredients
Use the ingredient examples from selected patterns to choose specific raw materials:
```typescript
const report = patternManager.generateFormulationReport(allPatternIds);
console.log('Recommended ingredients:', report.recommended_ingredients);
```

## Advanced Pattern Analysis

### Pattern Complexity Scoring

Complexity scores (1-10) indicate formulation difficulty:

- **1-3**: Simple patterns, easy to formulate
- **4-6**: Moderate patterns, standard formulation
- **7-8**: Complex patterns, requires expertise
- **9-10**: Highly complex, specialized knowledge needed

Complexity factors:
- Number of functions
- Presence of specialized functions (UV filters, hair dyes, etc.)
- Interaction potential

### Concentration Range Estimation

Recommended concentration ranges are estimated based on function types:

| Function Type | Typical Range |
|--------------|---------------|
| Preservatives | 0.01% - 2.0% |
| Active ingredients | 0.1% - 5.0% |
| UV filters | 2.0% - 10.0% |
| Emulsifiers | 0.5% - 5.0% |
| Conditioning agents | 0.5% - 10.0% |
| Base/Bulk | 10.0% - 80.0% |

### Pattern Synergies

Related patterns (patterns sharing functions) can be identified:
```typescript
const relatedPatterns = patternManager.findRelatedPatterns('FP_SC_SCE', 5);
```

This helps discover:
- Compatible ingredient combinations
- Alternative formulation approaches
- Innovation opportunities

## Command-Line Tool

Generate fresh pattern data using the included script:

```bash
npx tsx scripts/generate-formulation-patterns.ts
```

This will:
1. Load the COSING database (30,070 ingredients)
2. Extract atomic functions (80 unique)
3. Identify function combinations (2,498 unique)
4. Generate formulation patterns with metadata
5. Save results to `vessels/cosing/formulation_patterns.json`

## Integration with SKIN-TWIN Vessel System

The formulation patterns integrate with the broader SKIN-TWIN vessel architecture:

### Product Vessels
Use patterns to validate and optimize product formulations

### Ingredient Vessels
Link ingredients to their functional patterns for better selection

### Formulation Vessels
Apply patterns during formulation development for best practices

### PIF Vessels
Reference patterns in safety assessments and regulatory documentation

## Best Practices

1. **Start with Simple Patterns**: Begin with low complexity patterns (score 1-3)

2. **Always Include Preservation**: Every formulation needs antimicrobial protection

3. **Balance Categories**: Include patterns from multiple categories for complete formulations

4. **Check Compatibility**: Always validate pattern combinations before formulating

5. **Consider Usage Frequency**: More common patterns have proven safety and efficacy

6. **Match Product Type**: Use patterns typical for your target application

7. **Monitor Concentration**: Ensure total concentrations don't exceed 100%

8. **Review Ingredient Examples**: Use the INCI examples as starting points for sourcing

## Future Enhancements

Planned improvements to the pattern system:

- [ ] Machine learning-based pattern recommendations
- [ ] Real-time synergy/incompatibility detection
- [ ] Cost optimization across patterns
- [ ] Supplier network integration
- [ ] Regulatory compliance checking per pattern
- [ ] Clinical study linkage for efficacy claims
- [ ] Consumer preference mapping
- [ ] Sustainability scoring per pattern

## References

- **COSING Database**: European Commission Cosmetic Ingredients Database
- **EU Regulation 1223/2009**: European Cosmetics Regulation
- **INCI Nomenclature**: International Nomenclature of Cosmetic Ingredients

## Support

For questions or issues with the formulation pattern system:

1. Check the API documentation in `formulation-patterns.ts`
2. Review example usage in the codebase
3. Regenerate patterns if COSING data is updated
4. Consult the SKIN-TWIN research documentation

---

**SKIN-TWIN Formulation Intelligence Agent**  
*Where science meets skin. Where data drives innovation.*

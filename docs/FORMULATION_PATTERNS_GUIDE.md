# Formulation Pattern Generation Scripts

This directory contains tools for generating and working with COSING-based formulation patterns for the SKIN-TWIN platform.

## Available Scripts

### 1. `generate-formulation-patterns.ts`

**Purpose:** Generate comprehensive formulation patterns from the COSING ingredients database.

**Usage:**
```bash
npx tsx scripts/generate-formulation-patterns.ts
```

**What it does:**
- Loads 30,070 ingredients from the COSING database
- Extracts 80 unique atomic functions
- Identifies 2,498 unique function combinations
- Generates formulation patterns with metadata:
  - Typical applications
  - Recommended concentration ranges
  - Complexity scores
  - Category classifications
  - Ingredient examples
- Saves results to `vessels/cosing/formulation_patterns.json`

**Output Statistics:**
```
Total Ingredients: 30,070
Atomic Functions: 80
Function Combinations: 2,498
Formulation Patterns: 2,498
Most Common Function: SKIN CONDITIONING
Average Functions/Ingredient: 1.75
```

**Pattern Categories:**
- BASE_FORMING: 588 patterns (23.5%)
- EMULSIFICATION: 489 patterns (19.6%)
- ACTIVE_DELIVERY: 914 patterns (36.6%)
- PRESERVATION: 209 patterns (8.4%)
- SENSORY_ENHANCEMENT: 105 patterns (4.2%)
- FUNCTIONAL_SPECIALTY: 193 patterns (7.7%)

### 2. `example-formulation-patterns.ts`

**Purpose:** Demonstrate how to use the formulation pattern system in practice.

**Usage:**
```bash
npx tsx scripts/example-formulation-patterns.ts
```

**Examples Included:**

1. **Find Moisturizer Patterns**
   - Search patterns by category
   - Find specific functional combinations
   - Identify preservation systems

2. **Build Formulation Template**
   - Generate complete product templates
   - Get patterns for base, actives, emulsification, preservation, sensory

3. **Check Pattern Compatibility**
   - Validate pattern combinations
   - Detect concentration conflicts
   - Get formulation warnings and suggestions

4. **Generate Formulation Report**
   - Complete analysis of selected patterns
   - Recommended ingredients
   - Category breakdown
   - Compatibility assessment

5. **Search and Explore Patterns**
   - Keyword search across patterns
   - Find UV protection, anti-aging, etc.
   - Discover simple, high-frequency patterns

6. **Find Related Patterns**
   - Discover patterns sharing similar functions
   - Identify ingredient synergies
   - Explore alternative formulation approaches

7. **Category Analysis**
   - Pattern distribution statistics
   - Category-wise breakdown
   - Usage analytics

## Integration with SKIN-TWIN

### Using Patterns in Code

```typescript
import { FormulationPatternManager } from '~/lib/vessels/formulation-patterns';
import patternData from '~/vessels/cosing/formulation_patterns.json';

const manager = new FormulationPatternManager(patternData);

// Find patterns for a specific product type
const serumPatterns = manager.findByApplication('serum');

// Get a complete formulation template
const template = manager.suggestFormulationTemplate('moisturizer');

// Check compatibility
const compatibility = manager.checkCompatibility(['FP_SC', 'FP_H', 'FP_AM']);
```

### Available Methods

See `app/lib/vessels/formulation-patterns.ts` for the complete API:

- `findByCategory(category)` - Find patterns by category
- `findByFunctions(functions)` - Find patterns with specific functions
- `getMostCommon(limit)` - Get most frequently used patterns
- `findByComplexity(min, max)` - Find patterns by complexity score
- `getSimplePatterns(limit)` - Get simple, high-frequency patterns
- `findByApplication(application)` - Find patterns for product types
- `suggestFormulationTemplate(productType)` - Get complete formulation
- `checkCompatibility(patternIds)` - Validate pattern combinations
- `generateFormulationReport(patternIds)` - Generate comprehensive report
- `search(keyword)` - Search patterns by keyword
- `findRelatedPatterns(patternId, limit)` - Find similar patterns

## Data Files

### Input
- `vessels/cosing/cosing_ingredients.json.gz` - Compressed COSING database

### Output
- `vessels/cosing/formulation_patterns.json` - Generated patterns (2.6 MB)

### Documentation
- `vessels/cosing/FORMULATION_PATTERNS.md` - Complete pattern documentation

## Testing

Tests are available in `app/lib/vessels/formulation-patterns.spec.ts`:

```bash
npm test -- app/lib/vessels/formulation-patterns.spec.ts
```

## Regenerating Patterns

If the COSING database is updated, regenerate patterns:

```bash
npx tsx scripts/generate-formulation-patterns.ts
```

This ensures patterns reflect the latest ingredient data.

## Use Cases

### 1. Product Development
Use patterns to quickly identify common ingredient combinations for target products:
```typescript
const moisturizerTemplate = manager.suggestFormulationTemplate('moisturizer');
// Returns organized patterns for base, actives, emulsification, preservation, sensory
```

### 2. Formulation Validation
Check if selected ingredients work together:
```typescript
const compatibility = manager.checkCompatibility(selectedPatternIds);
if (!compatibility.compatible) {
  console.log('Issues:', compatibility.warnings);
  console.log('Suggestions:', compatibility.suggestions);
}
```

### 3. Ingredient Discovery
Find alternatives and related ingredients:
```typescript
const relatedPatterns = manager.findRelatedPatterns('FP_SC_H', 5);
// Discover patterns sharing similar functions
```

### 4. Cost Optimization
Identify high-frequency patterns that are well-proven:
```typescript
const simplePatterns = manager.getSimplePatterns(20);
// Get patterns with low complexity and high usage
```

### 5. Innovation
Explore rare patterns for unique formulations:
```typescript
const complexPatterns = manager.findByComplexity(7, 10);
// Find specialized, complex functional combinations
```

## Pattern Structure

Each pattern includes:

```typescript
{
  id: "FP_SC_H",                          // Unique identifier
  name: "SKIN CONDITIONING + HUMECTANT",  // Human-readable name
  functions: ["SKIN CONDITIONING", "HUMECTANT"],
  function_count: 2,
  typical_applications: ["Serums", "Moisturizers"],
  ingredient_examples: ["Glycerin", "Sodium Hyaluronate"],
  usage_frequency: 566,                   // Number of ingredients
  complexity_score: 3,                    // 1-10 scale
  category: "ACTIVE_DELIVERY",
  recommended_concentration_range: {
    min: 0.5,
    max: 10.0
  },
  synergistic_patterns: [],
  incompatible_patterns: []
}
```

## Advanced Features

### Custom Pattern Generation

Extend the generation script to add custom metadata:

```typescript
// In generate-formulation-patterns.ts
function calculateCustomScore(pattern) {
  // Add custom scoring logic
  return score;
}
```

### Pattern Relationships

Future enhancements will include:
- Synergy detection between patterns
- Incompatibility mapping
- Supplier network integration
- Cost optimization
- Regulatory compliance checking

## Support

For issues or questions:
1. Check the documentation in `vessels/cosing/FORMULATION_PATTERNS.md`
2. Review example usage in `scripts/example-formulation-patterns.ts`
3. Examine the API in `app/lib/vessels/formulation-patterns.ts`
4. Run the test suite to verify functionality

---

**SKIN-TWIN Formulation Intelligence Agent**  
*Transforming cosmetic ingredient data into actionable formulation intelligence*

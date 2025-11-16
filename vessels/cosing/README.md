# COSING Ingredients Database

This directory contains the European Commission's COSING (Cosmetic Ingredient) database, converted from the official Excel format to JSON and CSV for easier integration and analysis.

## Overview

**COSING** (COSmetic INGredient database) is the European Commission database for information on cosmetic substances and ingredients. It contains comprehensive data on ingredients used in cosmetic products marketed in the European Union.

### Dataset Statistics

| Metric | Value |
|--------|-------|
| **Total Ingredients** | 30,070 |
| **Source** | European Commission COSING Database |
| **Last Update** | December 15, 2021 |
| **Conversion Date** | November 16, 2025 |
| **JSON Size** | 12.53 MB |
| **CSV Size** | 5.90 MB |

## Files

### Data Files

1. **cosing_ingredients.json** (12.53 MB)
   - Complete ingredient database in JSON format
   - Structured for programmatic access
   - UTF-8 encoded with full Unicode support

2. **cosing_ingredients.csv** (5.90 MB)
   - Complete ingredient database in CSV format
   - Compatible with Excel, Google Sheets, and data analysis tools
   - UTF-8 encoded

3. **cosing_conversion_summary.json**
   - Conversion metadata and statistics
   - Sample ingredient records
   - Field definitions

## Data Structure

Each ingredient record contains the following fields:

### Core Identification

- **cosing_ref_no** (Integer)
  - Unique COSING reference number
  - Primary identifier in the European Commission database
  - Example: `94753`

- **inci_name** (Text)
  - International Nomenclature of Cosmetic Ingredients (INCI) name
  - Standardized ingredient naming system
  - Example: `"DISODIUM TETRAMETHYLHEXADECENYLCYSTEINE FORMYLPROLINATE"`

### Alternative Names

- **inn_name** (Text, Optional)
  - International Nonproprietary Name (INN)
  - Used for pharmaceutical ingredients
  - Example: `"Hyaluronic Acid"`

- **ph_eur_name** (Text, Optional)
  - European Pharmacopoeia (Ph. Eur.) name
  - Official pharmaceutical designation
  - Example: `"Acidum Hyaluronicum"`

### Chemical Identifiers

- **cas_no** (Text, Optional)
  - Chemical Abstracts Service (CAS) registry number(s)
  - Unique numerical identifier for chemical substances
  - May contain multiple CAS numbers separated by commas
  - Example: `"2040469-40-5, 2422121-34-2"`

- **ec_no** (Text, Optional)
  - European Community (EC) number
  - European inventory number for chemical substances
  - Example: `"200-001-8"`

### Description

- **chem_iupac_name_description** (Text, Optional)
  - Chemical/IUPAC name and detailed description
  - Provides chemical structure and composition information
  - Example: `"Disodium Tetramethylhexadecenylcysteine Formylprolinate is the organic compound that conforms to the formula:("`

### Regulatory Information

- **restriction** (Text, Optional)
  - Regulatory restrictions on ingredient use
  - Indicates if the ingredient has usage limitations
  - May reference specific regulations or annexes

### Functional Classification

- **function** (Text)
  - Primary function of the ingredient in cosmetic formulations
  - Multiple functions may be listed
  - Examples:
    - `"SKIN PROTECTING"`
    - `"SKIN CONDITIONING - EMOLLIENT"`
    - `"PLASTICISER"`
    - `"ANTIOXIDANT"`
    - `"UV ABSORBER"`

### Metadata

- **update_date** (Date)
  - Last update date in the COSING database
  - Format: `DD/MM/YYYY`
  - Example: `"16/06/2020"`

## Common Ingredient Functions

The database includes ingredients with various cosmetic functions:

### Skin Care Functions
- **SKIN CONDITIONING** - Improves skin appearance and feel
- **SKIN CONDITIONING - EMOLLIENT** - Softens and smooths skin
- **SKIN PROTECTING** - Protects skin from external factors
- **MOISTURISING** - Increases skin hydration
- **ANTIOXIDANT** - Prevents oxidation

### Product Formulation Functions
- **EMULSIFYING** - Helps mix oil and water phases
- **SURFACTANT** - Reduces surface tension
- **VISCOSITY CONTROLLING** - Adjusts product thickness
- **STABILISING** - Maintains product stability
- **PRESERVATIVE** - Prevents microbial growth

### Sensory Functions
- **PERFUMING** - Adds fragrance
- **MASKING** - Masks unpleasant odors
- **COLORANT** - Provides color

### Protection Functions
- **UV ABSORBER** - Protects from UV radiation
- **UV FILTER** - Filters UV light
- **ANTISTATIC** - Reduces static electricity

## Usage Examples

### Python

```python
import json

# Load the ingredient database
with open('cosing_ingredients.json', 'r', encoding='utf-8') as f:
    ingredients = json.load(f)

# Search for a specific ingredient
def find_ingredient_by_inci(inci_name):
    for ing in ingredients:
        if inci_name.lower() in ing['inci_name'].lower():
            return ing
    return None

# Find all emollients
emollients = [
    ing for ing in ingredients 
    if ing.get('function') and 'EMOLLIENT' in ing['function']
]

print(f"Found {len(emollients)} emollient ingredients")

# Find ingredient by CAS number
def find_by_cas(cas_number):
    return [
        ing for ing in ingredients 
        if ing.get('cas_no') and cas_number in ing['cas_no']
    ]
```

### Pandas

```python
import pandas as pd

# Load CSV into DataFrame
df = pd.read_csv('cosing_ingredients.csv')

# Basic statistics
print(f"Total ingredients: {len(df)}")
print(f"Unique functions: {df['function'].nunique()}")

# Most common functions
function_counts = df['function'].value_counts()
print(function_counts.head(10))

# Filter restricted ingredients
restricted = df[df['restriction'].notna()]
print(f"Restricted ingredients: {len(restricted)}")

# Search by INCI name
hyaluronic = df[df['inci_name'].str.contains('HYALURONIC', case=False, na=False)]
```

### SQL (PostgreSQL)

```sql
-- Load data into PostgreSQL
COPY cosing_ingredients(
    cosing_ref_no, inci_name, inn_name, ph_eur_name,
    cas_no, ec_no, chem_iupac_name_description,
    restriction, function, update_date
)
FROM '/path/to/cosing_ingredients.csv'
DELIMITER ','
CSV HEADER;

-- Search for ingredients
SELECT * FROM cosing_ingredients
WHERE inci_name ILIKE '%hyaluronic%';

-- Get function statistics
SELECT function, COUNT(*) as count
FROM cosing_ingredients
WHERE function IS NOT NULL
GROUP BY function
ORDER BY count DESC;

-- Find restricted ingredients
SELECT cosing_ref_no, inci_name, restriction
FROM cosing_ingredients
WHERE restriction IS NOT NULL;
```

## Database Integration

### Schema

A complete PostgreSQL schema is available in:
```
/database_schemas/cosing_ingredients_schema.sql
```

The schema includes:
- Main `cosing_ingredients` table
- Performance indexes (including full-text search)
- Analytics views
- Helper functions for searching
- Automatic timestamp triggers

### Import Instructions

#### Neon/Supabase PostgreSQL

1. **Create the schema:**
   ```sql
   \i database_schemas/cosing_ingredients_schema.sql
   ```

2. **Import the data:**
   ```sql
   COPY public.cosing_ingredients(
       cosing_ref_no, inci_name, inn_name, ph_eur_name,
       cas_no, ec_no, chem_iupac_name_description,
       restriction, function, update_date
   )
   FROM '/path/to/vessels/cosing/cosing_ingredients.csv'
   DELIMITER ','
   CSV HEADER;
   ```

3. **Verify import:**
   ```sql
   SELECT COUNT(*) FROM public.cosing_ingredients;
   -- Should return: 30070
   ```

## Data Quality

### Completeness

| Field | Coverage | Notes |
|-------|----------|-------|
| cosing_ref_no | 100% | All records have unique reference numbers |
| inci_name | 100% | All records have INCI names |
| function | ~95% | Most ingredients have function classification |
| cas_no | ~60% | Chemical identifiers available for many ingredients |
| restriction | ~5% | Only restricted ingredients have this field |
| inn_name | ~10% | Primarily pharmaceutical ingredients |
| ph_eur_name | ~5% | European Pharmacopoeia names |

### Data Validation

The conversion process ensures:
- ✅ UTF-8 encoding for international characters
- ✅ Unique COSING reference numbers
- ✅ Consistent field naming (snake_case)
- ✅ Null handling for optional fields
- ✅ Date format preservation

## Regulatory Compliance

This database supports compliance with:

- **EU Cosmetics Regulation (EC) No 1223/2009**
  - Article 19: Labeling requirements
  - Annex II: List of prohibited substances
  - Annex III: List of restricted substances
  - Annex IV: List of colorants
  - Annex V: List of preservatives
  - Annex VI: List of UV filters

- **INCI Naming Convention**
  - Standardized ingredient nomenclature
  - International recognition
  - Mandatory for EU cosmetic labeling

## Use Cases

### Formulation Development

- **Ingredient Selection:** Search for ingredients by function
- **Regulatory Check:** Verify ingredient compliance
- **Alternative Identification:** Find similar ingredients
- **Safety Assessment:** Check for restrictions

### Product Information Files (PIFs)

- **Ingredient Documentation:** Complete ingredient information
- **Safety Data:** Chemical identifiers and descriptions
- **Regulatory Status:** Restriction information
- **Function Classification:** Ingredient purpose in formulation

### Hypergraph Analysis

- **Ingredient Networks:** Map ingredient relationships
- **Function Clustering:** Group ingredients by function
- **Formulation Patterns:** Analyze common ingredient combinations
- **Regulatory Mapping:** Link ingredients to regulations

### Quality Control

- **Ingredient Verification:** Confirm ingredient identity
- **CAS Number Lookup:** Validate chemical identifiers
- **Function Validation:** Verify ingredient purpose
- **Update Tracking:** Monitor ingredient database changes

## Integration with Skintwinformx

This COSING database integrates with the skintwinformx hypergraph system:

### Hypergraph Nodes

Each COSING ingredient can be represented as a hypergraph node:

```json
{
  "id": "COSING_94753",
  "type": "ingredient",
  "properties": {
    "cosing_ref_no": 94753,
    "inci_name": "DISODIUM TETRAMETHYLHEXADECENYLCYSTEINE FORMYLPROLINATE",
    "function": "SKIN PROTECTING",
    "source": "COSING"
  }
}
```

### Hypergraph Edges

Relationships between ingredients and formulations:

- **Ingredient → Formulation:** Used in product
- **Ingredient → Function:** Performs function
- **Ingredient → Restriction:** Subject to restriction
- **Ingredient → Alternative:** Can be replaced by

### Database Synchronization

The COSING data synchronizes with:

1. **Neon Database** (PostgreSQL)
   - Main ingredient repository
   - Full-text search capabilities
   - Analytics views

2. **Supabase** (PostgreSQL + Real-time)
   - Real-time ingredient updates
   - API access
   - Authentication integration

3. **Hypergraph Database**
   - Network analysis
   - Relationship mapping
   - Pattern discovery

## Maintenance

### Updating the Database

To update with new COSING data:

1. Download latest COSING Excel file from European Commission
2. Run conversion script:
   ```bash
   python3 /path/to/convert_cosing_excel_fixed.py
   ```
3. Review conversion summary
4. Update database with new data
5. Commit changes to repository

### Data Refresh Frequency

- **COSING Database:** Updated by European Commission periodically
- **Recommended Check:** Quarterly
- **Last Official Update:** December 15, 2021
- **Last Conversion:** November 16, 2025

## References

### Official Sources

- **COSING Database:** https://ec.europa.eu/growth/tools-databases/cosing/
- **EU Cosmetics Regulation:** https://ec.europa.eu/growth/sectors/cosmetics/legislation_en
- **INCI Nomenclature:** https://www.personalcarecouncil.org/science-safety/inci-nomenclature/

### Related Documentation

- `/database_schemas/cosing_ingredients_schema.sql` - Database schema
- `/vessels/msdspif/markdown/` - Product Information Files
- `/vessels/ingredients/` - Formulation ingredients
- `/vessels/formulations/` - Product formulations

## License

The COSING database is provided by the European Commission and is subject to their terms of use. This conversion is for research and development purposes within the skintwinformx project.

## Support

For questions or issues related to the COSING integration:

1. Check the conversion summary: `cosing_conversion_summary.json`
2. Review the database schema: `/database_schemas/cosing_ingredients_schema.sql`
3. Consult the official COSING database: https://ec.europa.eu/growth/tools-databases/cosing/

---

**Last Updated:** November 16, 2025  
**Total Ingredients:** 30,070  
**Data Source:** European Commission COSING Database (December 15, 2021)

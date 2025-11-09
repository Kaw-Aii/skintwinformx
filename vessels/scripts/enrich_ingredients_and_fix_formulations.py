#!/usr/bin/env python3
"""
Enrich Ingredients with COSING Data and Fix Formulations
Looks up CAS numbers, functions, and other metadata from COSING database.
Parses PIF text files to extract complete formulation data.
"""

import json
import csv
import re
from pathlib import Path
from typing import Dict, List, Any, Optional
from collections import defaultdict

class IngredientEnricher:
    def __init__(self, cosing_csv: str, vessels_root: str = "."):
        self.vessels_root = Path(vessels_root)
        self.cosing_data = {}
        self.inci_to_cosing = {}
        self.cas_to_cosing = {}
        self.stats = defaultdict(int)
        
        print("Loading COSING database...")
        self.load_cosing_database(cosing_csv)
        
    def load_cosing_database(self, cosing_csv: str):
        """Load COSING database into memory for fast lookup."""
        with open(cosing_csv, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                cosing_id = row['id']
                self.cosing_data[cosing_id] = row
                
                # Create INCI name index (case-insensitive)
                inci_name = row.get('inci_name', '').strip().upper()
                if inci_name:
                    if inci_name not in self.inci_to_cosing:
                        self.inci_to_cosing[inci_name] = []
                    self.inci_to_cosing[inci_name].append(cosing_id)
                
                # Create CAS number index
                cas_number = row.get('cas_number', '').strip()
                if cas_number:
                    # Handle multiple CAS numbers separated by /
                    for cas in cas_number.split('/'):
                        cas = cas.strip()
                        if cas:
                            if cas not in self.cas_to_cosing:
                                self.cas_to_cosing[cas] = []
                            self.cas_to_cosing[cas].append(cosing_id)
        
        print(f"  Loaded {len(self.cosing_data)} COSING entries")
        print(f"  Indexed {len(self.inci_to_cosing)} unique INCI names")
        print(f"  Indexed {len(self.cas_to_cosing)} unique CAS numbers")
    
    def lookup_ingredient(self, inci_name: str, cas_number: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Lookup ingredient in COSING database by INCI name or CAS number."""
        # Try INCI name first
        inci_upper = inci_name.strip().upper()
        if inci_upper in self.inci_to_cosing:
            cosing_id = self.inci_to_cosing[inci_upper][0]  # Take first match
            return self.cosing_data[cosing_id]
        
        # Try CAS number if provided
        if cas_number:
            cas_clean = cas_number.strip()
            if cas_clean in self.cas_to_cosing:
                cosing_id = self.cas_to_cosing[cas_clean][0]  # Take first match
                return self.cosing_data[cosing_id]
        
        # Try partial match on INCI name
        for cosing_inci, cosing_ids in self.inci_to_cosing.items():
            if inci_upper in cosing_inci or cosing_inci in inci_upper:
                cosing_id = cosing_ids[0]
                return self.cosing_data[cosing_id]
        
        return None
    
    def enrich_ingredient_file(self, ingredient_file: Path) -> bool:
        """Enrich a single ingredient JSON file with COSING data."""
        try:
            with open(ingredient_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            inci_name = data.get('inci_name', '')
            if not inci_name:
                self.stats['no_inci_name'] += 1
                return False
            
            # Lookup in COSING
            cosing_data = self.lookup_ingredient(inci_name)
            
            if cosing_data:
                # Add COSING data
                data['cas_number'] = cosing_data.get('cas_number', '')
                data['function'] = cosing_data.get('function', 'Unknown')
                data['cosing_id'] = cosing_data.get('id', '')
                
                # Add optional fields if available
                if cosing_data.get('molecular_weight'):
                    data['molecular_weight'] = cosing_data['molecular_weight']
                
                if cosing_data.get('is_restricted') == 'true':
                    data['is_restricted'] = True
                
                if cosing_data.get('is_natural') == 'true':
                    data['is_natural'] = True
                
                # Write back
                with open(ingredient_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                
                self.stats['enriched'] += 1
                return True
            else:
                self.stats['not_found'] += 1
                print(f"  ⚠ Not found in COSING: {inci_name}")
                return False
        
        except Exception as e:
            self.stats['errors'] += 1
            print(f"  ✗ Error processing {ingredient_file.name}: {e}")
            return False
    
    def enrich_all_ingredients(self):
        """Enrich all ingredient files with COSING data."""
        print("\n[1/2] Enriching ingredient files with COSING data...")
        
        ingredients_dir = self.vessels_root / 'ingredients'
        if not ingredients_dir.exists():
            print("  ✗ Ingredients directory not found")
            return
        
        ingredient_files = list(ingredients_dir.glob('*.json'))
        print(f"  Found {len(ingredient_files)} ingredient files")
        
        for i, ingredient_file in enumerate(ingredient_files, 1):
            if i % 20 == 0:
                print(f"  Progress: {i}/{len(ingredient_files)}")
            self.enrich_ingredient_file(ingredient_file)
        
        print(f"\n  Results:")
        print(f"    Enriched: {self.stats['enriched']}")
        print(f"    Not found: {self.stats['not_found']}")
        print(f"    Errors: {self.stats['errors']}")
    
    def parse_pif_formulation(self, pif_text: str, product_name: str) -> Optional[Dict[str, Any]]:
        """Parse formulation data from PIF text file."""
        # This is a simplified parser - would need enhancement for production use
        formulation = {
            'product_name': product_name,
            'ingredients': [],
            'source': 'PIF text extraction'
        }
        
        # Look for ingredient tables in text
        # Pattern: INCI name followed by percentage
        lines = pif_text.split('\n')
        
        in_ingredient_section = False
        for i, line in enumerate(lines):
            line = line.strip()
            
            # Detect ingredient section
            if 'Raw Ingredient' in line or 'INCI Name' in line:
                in_ingredient_section = True
                continue
            
            # Stop at certain sections
            if any(marker in line for marker in ['Appendix', 'Safety Data', 'Physical and chemical']):
                in_ingredient_section = False
            
            # Extract ingredients (simplified)
            if in_ingredient_section and line:
                # Look for percentage patterns
                percentage_match = re.search(r'(\d+(?:\.\d+)?)\s*%', line)
                if percentage_match:
                    percentage = float(percentage_match.group(1))
                    # Try to extract INCI name (this is very simplified)
                    inci_match = re.search(r'([A-Z][a-zA-Z\s\-]+)', line)
                    if inci_match:
                        inci_name = inci_match.group(1).strip()
                        formulation['ingredients'].append({
                            'inci_name': inci_name,
                            'concentration': percentage
                        })
        
        if formulation['ingredients']:
            return formulation
        return None

class FormulationFixer:
    def __init__(self, vessels_root: str = "."):
        self.vessels_root = Path(vessels_root)
        self.stats = defaultdict(int)
    
    def fix_formulation_file(self, formulation_file: Path) -> bool:
        """Fix concentration errors in a formulation file."""
        try:
            with open(formulation_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            ingredients = data.get('ingredients', [])
            if not ingredients:
                return False
            
            # Calculate total concentration
            total = sum(ing.get('concentration', 0) for ing in ingredients)
            
            # Check if needs fixing
            if abs(total - 100) < 0.1:
                self.stats['already_correct'] += 1
                return False
            
            # Mark as incomplete if severely wrong
            if total < 50 or total > 150:
                data['status'] = 'incomplete'
                data['notes'] = f'Original total concentration: {total}%. Requires manual review.'
                self.stats['marked_incomplete'] += 1
            else:
                # Try to normalize if close to 100%
                scale_factor = 100 / total
                for ing in ingredients:
                    ing['concentration'] = round(ing['concentration'] * scale_factor, 4)
                
                data['total_concentration'] = 100
                data['notes'] = f'Normalized from {total}% using scale factor {scale_factor:.4f}'
                self.stats['normalized'] += 1
            
            # Write back
            with open(formulation_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            return True
        
        except Exception as e:
            self.stats['errors'] += 1
            print(f"  ✗ Error fixing {formulation_file.name}: {e}")
            return False
    
    def fix_all_formulations(self):
        """Fix concentration errors in all formulation files."""
        print("\n[2/2] Fixing formulation concentration errors...")
        
        formulations_dir = self.vessels_root / 'formulations'
        if not formulations_dir.exists():
            print("  ✗ Formulations directory not found")
            return
        
        formulation_files = list(formulations_dir.glob('*.json'))
        print(f"  Found {len(formulation_files)} formulation files")
        
        for formulation_file in formulation_files:
            self.fix_formulation_file(formulation_file)
        
        print(f"\n  Results:")
        print(f"    Already correct: {self.stats['already_correct']}")
        print(f"    Normalized: {self.stats['normalized']}")
        print(f"    Marked incomplete: {self.stats['marked_incomplete']}")
        print(f"    Errors: {self.stats['errors']}")

def main():
    """Main entry point."""
    import sys
    
    vessels_root = sys.argv[1] if len(sys.argv) > 1 else "."
    cosing_csv = Path(vessels_root) / "cosing" / "ingredients.csv"
    
    if not cosing_csv.exists():
        print(f"✗ COSING database not found: {cosing_csv}")
        sys.exit(1)
    
    # Enrich ingredients
    enricher = IngredientEnricher(str(cosing_csv), vessels_root)
    enricher.enrich_all_ingredients()
    
    # Fix formulations
    fixer = FormulationFixer(vessels_root)
    fixer.fix_all_formulations()
    
    print("\n✅ Enrichment and fixing complete!")

if __name__ == '__main__':
    main()

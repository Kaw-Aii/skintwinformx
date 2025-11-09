#!/usr/bin/env python3
"""
Vessels Data Validation and Correction Script
Validates and corrects data integrity issues in the vessels folder.
"""

import json
import sys
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Any

class VesselsDataValidator:
    def __init__(self, vessels_root: str = "."):
        self.vessels_root = Path(vessels_root)
        self.errors = defaultdict(list)
        self.warnings = defaultdict(list)
        self.stats = defaultdict(int)
        
    def validate_all(self) -> Dict[str, Any]:
        """Run all validation checks."""
        print("Starting comprehensive vessels data validation...")
        
        self.validate_json_files()
        self.validate_formulations()
        self.validate_ingredients()
        self.validate_products()
        self.validate_edges()
        self.validate_cross_references()
        
        return self.generate_report()
    
    def validate_json_files(self):
        """Validate all JSON files can be parsed."""
        print("\n[1/6] Validating JSON files...")
        
        for json_file in self.vessels_root.rglob('*.json'):
            self.stats['total_json_files'] += 1
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    json.load(f)
                self.stats['valid_json_files'] += 1
            except Exception as e:
                self.errors['json_parse'].append({
                    'file': str(json_file.relative_to(self.vessels_root)),
                    'error': str(e)
                })
                self.stats['invalid_json_files'] += 1
        
        print(f"   Valid: {self.stats['valid_json_files']}/{self.stats['total_json_files']}")
    
    def validate_formulations(self):
        """Validate formulation data integrity."""
        print("\n[2/6] Validating formulations...")
        
        formulations_dir = self.vessels_root / 'formulations'
        if not formulations_dir.exists():
            self.errors['missing_directory'].append('formulations')
            return
        
        for json_file in formulations_dir.glob('*.json'):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                self.stats['total_formulations'] += 1
                
                # Check required fields
                required_fields = ['id', 'name', 'ingredients']
                for field in required_fields:
                    if field not in data:
                        self.errors['formulation_missing_field'].append({
                            'file': json_file.name,
                            'field': field
                        })
                
                # Check concentration
                if 'ingredients' in data:
                    total = sum(ing.get('concentration', 0) for ing in data['ingredients'])
                    
                    if abs(total - 100) > 0.1:
                        self.errors['formulation_concentration'].append({
                            'file': json_file.name,
                            'total': total,
                            'difference': 100 - total
                        })
                        self.stats['formulations_concentration_error'] += 1
                    
                    # Check for unknown functions
                    for ing in data['ingredients']:
                        if ing.get('function') == 'Unknown':
                            self.warnings['unknown_ingredient_function'].append({
                                'formulation': json_file.name,
                                'ingredient': ing.get('inci_name', 'Unknown')
                            })
                            self.stats['unknown_functions'] += 1
            
            except Exception as e:
                self.errors['formulation_parse'].append({
                    'file': json_file.name,
                    'error': str(e)
                })
        
        print(f"   Total: {self.stats['total_formulations']}")
        print(f"   Concentration errors: {self.stats['formulations_concentration_error']}")
        print(f"   Unknown functions: {self.stats['unknown_functions']}")
    
    def validate_ingredients(self):
        """Validate ingredient data completeness."""
        print("\n[3/6] Validating ingredients...")
        
        ingredients_dir = self.vessels_root / 'ingredients'
        if not ingredients_dir.exists():
            self.errors['missing_directory'].append('ingredients')
            return
        
        for json_file in ingredients_dir.glob('*.json'):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                self.stats['total_ingredients'] += 1
                
                # Check for missing critical fields
                if not data.get('inci_name'):
                    self.errors['ingredient_missing_inci'].append(json_file.name)
                
                if not data.get('cas_number'):
                    self.stats['ingredients_missing_cas'] += 1
                
                if not data.get('supplier_id'):
                    self.stats['ingredients_missing_supplier'] += 1
                
                if not data.get('function'):
                    self.stats['ingredients_missing_function'] += 1
            
            except Exception as e:
                self.errors['ingredient_parse'].append({
                    'file': json_file.name,
                    'error': str(e)
                })
        
        print(f"   Total: {self.stats['total_ingredients']}")
        print(f"   Missing CAS: {self.stats['ingredients_missing_cas']}")
        print(f"   Missing Supplier: {self.stats['ingredients_missing_supplier']}")
        print(f"   Missing Function: {self.stats['ingredients_missing_function']}")
    
    def validate_products(self):
        """Validate product data."""
        print("\n[4/6] Validating products...")
        
        products_dir = self.vessels_root / 'products'
        if not products_dir.exists():
            self.errors['missing_directory'].append('products')
            return
        
        for json_file in products_dir.glob('*.json'):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                self.stats['total_products'] += 1
                
                # Check for placeholder values
                if data.get('color') == 'Unknown':
                    self.warnings['product_unknown_color'].append(json_file.name)
                
                if data.get('age_range') == '25-65+':
                    self.warnings['product_generic_age'].append(json_file.name)
            
            except Exception as e:
                self.errors['product_parse'].append({
                    'file': json_file.name,
                    'error': str(e)
                })
        
        print(f"   Total: {self.stats['total_products']}")
    
    def validate_edges(self):
        """Validate hypergraph edges."""
        print("\n[5/6] Validating edges...")
        
        edges_dir = self.vessels_root / 'edges'
        if not edges_dir.exists():
            self.errors['missing_directory'].append('edges')
            return
        
        edge_types = defaultdict(int)
        
        for json_file in edges_dir.glob('*.json'):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                self.stats['total_edges'] += 1
                edge_types[data.get('type', 'Unknown')] += 1
                
                # Check for required fields
                if not data.get('source') and not data.get('source_id'):
                    self.errors['edge_missing_source'].append(json_file.name)
                
                if not data.get('target') and not data.get('target_id'):
                    self.errors['edge_missing_target'].append(json_file.name)
                
                if not data.get('type'):
                    self.errors['edge_missing_type'].append(json_file.name)
            
            except Exception as e:
                self.errors['edge_parse'].append({
                    'file': json_file.name,
                    'error': str(e)
                })
        
        self.stats['edge_types'] = dict(edge_types)
        print(f"   Total: {self.stats['total_edges']}")
        print(f"   Edge types: {len(edge_types)}")
    
    def validate_cross_references(self):
        """Validate cross-references between entities."""
        print("\n[6/6] Validating cross-references...")
        
        # Load all ingredient IDs
        ingredient_ids = set()
        ingredients_dir = self.vessels_root / 'ingredients'
        if ingredients_dir.exists():
            for json_file in ingredients_dir.glob('*.json'):
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if 'id' in data:
                            ingredient_ids.add(data['id'])
                except:
                    pass
        
        # Check formulation ingredient references
        formulations_dir = self.vessels_root / 'formulations'
        if formulations_dir.exists():
            for json_file in formulations_dir.glob('*.json'):
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    for ing in data.get('ingredients', []):
                        ing_id = ing.get('ingredient_id')
                        if ing_id and ing_id not in ingredient_ids:
                            self.warnings['ingredient_reference_not_found'].append({
                                'formulation': json_file.name,
                                'ingredient_id': ing_id
                            })
                            self.stats['missing_ingredient_refs'] += 1
                except:
                    pass
        
        print(f"   Missing ingredient references: {self.stats['missing_ingredient_refs']}")
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate validation report."""
        print("\n" + "="*60)
        print("VALIDATION REPORT")
        print("="*60)
        
        total_errors = sum(len(v) for v in self.errors.values())
        total_warnings = sum(len(v) for v in self.warnings.values())
        
        print(f"\nTotal Errors: {total_errors}")
        print(f"Total Warnings: {total_warnings}")
        
        if total_errors > 0:
            print("\nError Summary:")
            for error_type, error_list in self.errors.items():
                print(f"  {error_type}: {len(error_list)}")
        
        if total_warnings > 0:
            print("\nWarning Summary:")
            for warning_type, warning_list in self.warnings.items():
                print(f"  {warning_type}: {len(warning_list)}")
        
        print("\nData Quality Score:")
        if self.stats['total_json_files'] > 0:
            json_validity = (self.stats['valid_json_files'] / self.stats['total_json_files']) * 100
            print(f"  JSON Validity: {json_validity:.1f}%")
        
        if self.stats['total_formulations'] > 0:
            formulation_quality = ((self.stats['total_formulations'] - self.stats['formulations_concentration_error']) / 
                                   self.stats['total_formulations']) * 100
            print(f"  Formulation Quality: {formulation_quality:.1f}%")
        
        if self.stats['total_ingredients'] > 0:
            ingredient_completeness = ((self.stats['total_ingredients'] - 
                                       self.stats['ingredients_missing_cas'] - 
                                       self.stats['ingredients_missing_supplier'] - 
                                       self.stats['ingredients_missing_function']) / 
                                      (self.stats['total_ingredients'] * 3)) * 100
            print(f"  Ingredient Completeness: {ingredient_completeness:.1f}%")
        
        return {
            'errors': dict(self.errors),
            'warnings': dict(self.warnings),
            'stats': dict(self.stats)
        }

def main():
    """Main entry point."""
    vessels_root = sys.argv[1] if len(sys.argv) > 1 else "."
    
    validator = VesselsDataValidator(vessels_root)
    report = validator.validate_all()
    
    # Save detailed report
    report_file = Path(vessels_root) / 'validation_report.json'
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)
    
    print(f"\nDetailed report saved to: {report_file}")
    
    # Exit with error code if there are errors
    total_errors = sum(len(v) for v in report['errors'].values())
    sys.exit(1 if total_errors > 0 else 0)

if __name__ == '__main__':
    main()

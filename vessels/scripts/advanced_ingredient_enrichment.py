#!/usr/bin/env python3
"""
Advanced Ingredient Enrichment with Trade Name Mapping
Uses fuzzy matching and common trade name patterns to improve COSING lookups.
"""

import json
import csv
import re
from pathlib import Path
from typing import Dict, List, Any, Optional
from collections import defaultdict
from difflib import SequenceMatcher

class AdvancedIngredientEnricher:
    def __init__(self, cosing_csv: str, vessels_root: str = "."):
        self.vessels_root = Path(vessels_root)
        self.cosing_data = {}
        self.inci_to_cosing = {}
        self.cas_to_cosing = {}
        self.trade_name_patterns = self.load_trade_name_patterns()
        self.stats = defaultdict(int)
        
        print("Loading COSING database...")
        self.load_cosing_database(cosing_csv)
        
    def load_trade_name_patterns(self) -> Dict[str, str]:
        """Load common trade name to INCI mappings."""
        return {
            # Common trade names and their INCI equivalents
            'WATER': 'AQUA',
            'DE ION WATER': 'AQUA',
            'DEIONISED WATER': 'AQUA',
            'DEIONIZED WATER': 'AQUA',
            'PURIFIED WATER': 'AQUA',
            'DISTILLED WATER': 'AQUA',
            'GLYCERIN': 'GLYCERIN',
            'GLYCERINE': 'GLYCERIN',
            'VITAMIN E': 'TOCOPHEROL',
            'VITAMIN C': 'ASCORBIC ACID',
            'HYALURONIC ACID': 'SODIUM HYALURONATE',
            'SHEA BUTTER': 'BUTYROSPERMUM PARKII BUTTER',
            'COCOA BUTTER': 'THEOBROMA CACAO SEED BUTTER',
            'JOJOBA OIL': 'SIMMONDSIA CHINENSIS SEED OIL',
            'ARGAN OIL': 'ARGANIA SPINOSA KERNEL OIL',
            'ROSEHIP OIL': 'ROSA CANINA FRUIT OIL',
            'ROSE HIPS OIL': 'ROSA CANINA FRUIT OIL',
            'SWEET ALMOND OIL': 'PRUNUS AMYGDALUS DULCIS OIL',
            'ALMOND OIL': 'PRUNUS AMYGDALUS DULCIS OIL',
            'COCONUT OIL': 'COCOS NUCIFERA OIL',
            'OLIVE OIL': 'OLEA EUROPAEA FRUIT OIL',
            'SUNFLOWER OIL': 'HELIANTHUS ANNUUS SEED OIL',
            'AVOCADO OIL': 'PERSEA GRATISSIMA OIL',
            'GRAPESEED OIL': 'VITIS VINIFERA SEED OIL',
            'MACADAMIA OIL': 'MACADAMIA TERNIFOLIA SEED OIL',
            'BEESWAX': 'CERA ALBA',
            'BEESWAX WHITE': 'CERA ALBA',
            'CARNAUBA WAX': 'COPERNICIA CERIFERA CERA',
            'XANTHAN GUM': 'XANTHAN GUM',
            'CARBOMER': 'CARBOMER',
            'PHENOXYETHANOL': 'PHENOXYETHANOL',
            'PRESERVATIVE': 'PHENOXYETHANOL',
            'FRAGRANCE': 'PARFUM',
            'PERFUME': 'PARFUM',
        }
    
    def load_cosing_database(self, cosing_csv: str):
        """Load COSING database with enhanced indexing."""
        with open(cosing_csv, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                cosing_id = row['id']
                self.cosing_data[cosing_id] = row
                
                # Index by INCI name (case-insensitive, normalized)
                inci_name = row.get('inci_name', '').strip().upper()
                if inci_name:
                    inci_normalized = self.normalize_name(inci_name)
                    if inci_normalized not in self.inci_to_cosing:
                        self.inci_to_cosing[inci_normalized] = []
                    self.inci_to_cosing[inci_normalized].append(cosing_id)
                
                # Index by CAS number
                cas_number = row.get('cas_number', '').strip()
                if cas_number:
                    for cas in cas_number.split('/'):
                        cas = cas.strip()
                        if cas:
                            if cas not in self.cas_to_cosing:
                                self.cas_to_cosing[cas] = []
                            self.cas_to_cosing[cas].append(cosing_id)
        
        print(f"  Loaded {len(self.cosing_data)} COSING entries")
        print(f"  Indexed {len(self.inci_to_cosing)} unique INCI names")
        print(f"  Indexed {len(self.cas_to_cosing)} unique CAS numbers")
    
    def normalize_name(self, name: str) -> str:
        """Normalize ingredient name for matching."""
        # Remove common suffixes and prefixes
        name = name.upper().strip()
        
        # Remove brand indicators
        for suffix in [' LQ', ' MV', ' AJ', ' SG', ' RB', ' MH', ' GR', ' OP', ' PH', ' TM', ' MBAL', ' SE']:
            if name.endswith(suffix):
                name = name[:-len(suffix)].strip()
        
        # Remove brackets and contents
        name = re.sub(r'\[.*?\]', '', name)
        name = re.sub(r'\(.*?\)', '', name)
        
        # Remove special characters
        name = re.sub(r'[^\w\s-]', ' ', name)
        
        # Normalize whitespace
        name = ' '.join(name.split())
        
        return name
    
    def fuzzy_match(self, query: str, candidates: List[str], threshold: float = 0.8) -> Optional[str]:
        """Find best fuzzy match from candidates."""
        query_norm = self.normalize_name(query)
        best_match = None
        best_ratio = 0
        
        for candidate in candidates:
            candidate_norm = self.normalize_name(candidate)
            ratio = SequenceMatcher(None, query_norm, candidate_norm).ratio()
            
            if ratio > best_ratio and ratio >= threshold:
                best_ratio = ratio
                best_match = candidate
        
        return best_match
    
    def lookup_ingredient_advanced(self, ingredient_name: str, cas_number: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Advanced ingredient lookup with multiple strategies."""
        
        # Strategy 1: Direct INCI match
        inci_normalized = self.normalize_name(ingredient_name)
        if inci_normalized in self.inci_to_cosing:
            cosing_id = self.inci_to_cosing[inci_normalized][0]
            self.stats['direct_match'] += 1
            return self.cosing_data[cosing_id]
        
        # Strategy 2: Trade name mapping
        ingredient_upper = ingredient_name.upper().strip()
        for trade_name, inci_name in self.trade_name_patterns.items():
            if trade_name in ingredient_upper:
                inci_normalized = self.normalize_name(inci_name)
                if inci_normalized in self.inci_to_cosing:
                    cosing_id = self.inci_to_cosing[inci_normalized][0]
                    self.stats['trade_name_match'] += 1
                    return self.cosing_data[cosing_id]
        
        # Strategy 3: CAS number lookup
        if cas_number:
            cas_clean = cas_number.strip()
            if cas_clean in self.cas_to_cosing:
                cosing_id = self.cas_to_cosing[cas_clean][0]
                self.stats['cas_match'] += 1
                return self.cosing_data[cosing_id]
        
        # Strategy 4: Fuzzy matching on INCI names
        all_inci_names = list(self.inci_to_cosing.keys())
        best_match = self.fuzzy_match(ingredient_name, all_inci_names, threshold=0.85)
        if best_match:
            cosing_id = self.inci_to_cosing[best_match][0]
            self.stats['fuzzy_match'] += 1
            return self.cosing_data[cosing_id]
        
        # Strategy 5: Partial word matching
        ingredient_words = set(inci_normalized.split())
        best_overlap = 0
        best_cosing_id = None
        
        for inci_name, cosing_ids in self.inci_to_cosing.items():
            inci_words = set(inci_name.split())
            overlap = len(ingredient_words & inci_words)
            
            if overlap > best_overlap and overlap >= 2:
                best_overlap = overlap
                best_cosing_id = cosing_ids[0]
        
        if best_cosing_id:
            self.stats['partial_match'] += 1
            return self.cosing_data[best_cosing_id]
        
        self.stats['not_found'] += 1
        return None
    
    def enrich_ingredient_file(self, ingredient_file: Path) -> bool:
        """Enrich ingredient file with advanced lookup."""
        try:
            with open(ingredient_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            inci_name = data.get('inci_name', '') or data.get('label', '')
            if not inci_name:
                self.stats['no_inci_name'] += 1
                return False
            
            # Skip if already enriched
            if data.get('cas_number') and data.get('function') and data.get('function') != 'Unknown':
                self.stats['already_enriched'] += 1
                return False
            
            # Advanced lookup
            cosing_data = self.lookup_ingredient_advanced(inci_name, data.get('cas_number'))
            
            if cosing_data:
                # Update with COSING data
                if not data.get('cas_number'):
                    data['cas_number'] = cosing_data.get('cas_number', '')
                
                if not data.get('function') or data.get('function') == 'Unknown':
                    data['function'] = cosing_data.get('function', 'Unknown')
                
                data['cosing_id'] = cosing_data.get('id', '')
                data['cosing_inci_name'] = cosing_data.get('inci_name', '')
                
                # Add optional enrichment
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
                print(f"  ⚠ Not found: {inci_name}")
                return False
        
        except Exception as e:
            self.stats['errors'] += 1
            print(f"  ✗ Error: {ingredient_file.name} - {e}")
            return False
    
    def enrich_all_ingredients(self):
        """Enrich all ingredient files."""
        print("\nEnriching ingredients with advanced matching...")
        
        ingredients_dir = self.vessels_root / 'ingredients'
        if not ingredients_dir.exists():
            print("  ✗ Ingredients directory not found")
            return
        
        ingredient_files = list(ingredients_dir.glob('*.json'))
        print(f"  Found {len(ingredient_files)} ingredient files")
        
        for i, ingredient_file in enumerate(ingredient_files, 1):
            if i % 30 == 0:
                print(f"  Progress: {i}/{len(ingredient_files)}")
            self.enrich_ingredient_file(ingredient_file)
        
        print(f"\n  Results:")
        print(f"    Already enriched: {self.stats['already_enriched']}")
        print(f"    Newly enriched: {self.stats['enriched']}")
        print(f"    Direct matches: {self.stats['direct_match']}")
        print(f"    Trade name matches: {self.stats['trade_name_match']}")
        print(f"    CAS matches: {self.stats['cas_match']}")
        print(f"    Fuzzy matches: {self.stats['fuzzy_match']}")
        print(f"    Partial matches: {self.stats['partial_match']}")
        print(f"    Not found: {self.stats['not_found']}")
        print(f"    Errors: {self.stats['errors']}")

def main():
    """Main entry point."""
    import sys
    
    vessels_root = sys.argv[1] if len(sys.argv) > 1 else "."
    cosing_csv = Path(vessels_root) / "cosing" / "ingredients.csv"
    
    if not cosing_csv.exists():
        print(f"✗ COSING database not found: {cosing_csv}")
        sys.exit(1)
    
    enricher = AdvancedIngredientEnricher(str(cosing_csv), vessels_root)
    enricher.enrich_all_ingredients()
    
    print("\n✅ Advanced enrichment complete!")

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Import COSING data to Supabase via REST API
Assumes schema is already deployed via Supabase dashboard
"""

import os
import json
import csv
from datetime import datetime
from supabase import create_client, Client

# Initialize Supabase client
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def parse_date(date_str):
    """Parse date from DD/MM/YYYY format"""
    if not date_str or date_str.strip() == '':
        return None
    try:
        dt = datetime.strptime(date_str.strip(), '%d/%m/%Y')
        return dt.strftime('%Y-%m-%d')  # PostgreSQL format
    except:
        return None

def import_batch(batch_data, batch_num):
    """Import a batch of ingredients via Supabase REST API"""
    try:
        result = supabase.table('cosing_ingredients').insert(batch_data).execute()
        return True, len(batch_data)
    except Exception as e:
        return False, str(e)

def main():
    print("=" * 60)
    print("COSING Data Import to Supabase")
    print("=" * 60)
    print(f"Start time: {datetime.now()}")
    print("")
    
    # Check connection and table existence
    print("Checking Supabase connection and schema...", end=" ")
    try:
        result = supabase.table('cosing_ingredients').select("count", count='exact').limit(1).execute()
        current_count = result.count if hasattr(result, 'count') else 0
        print(f"✅ Connected (current records: {current_count})")
    except Exception as e:
        print(f"❌ Error: {str(e)[:100]}")
        print("")
        print("⚠️  Schema not deployed or table doesn't exist!")
        print("")
        print("Please deploy the schema first:")
        print("  1. Open Supabase dashboard: https://supabase.com/dashboard")
        print("  2. Navigate to SQL Editor")
        print("  3. Copy and execute: database_schemas/cosing_ingredients_schema.sql")
        print("  4. Run this script again")
        return
    
    print("")
    print("Reading CSV file...")
    csv_file = '/home/ubuntu/skintwinformx/vessels/cosing/cosing_ingredients.csv'
    
    batch_size = 100  # Supabase REST API batch size
    batch = []
    batch_num = 1
    total_imported = 0
    total_errors = 0
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row_num, row in enumerate(reader, 1):
            # Prepare ingredient data
            ingredient = {
                'cosing_ref_no': int(row['cosing_ref_no']) if row.get('cosing_ref_no') else None,
                'inci_name': row.get('inci_name', ''),
                'inn_name': row.get('inn_name') if row.get('inn_name') else None,
                'ph_eur_name': row.get('ph_eur_name') if row.get('ph_eur_name') else None,
                'cas_no': row.get('cas_no') if row.get('cas_no') else None,
                'ec_no': row.get('ec_no') if row.get('ec_no') else None,
                'chem_iupac_name_description': row.get('chem_iupac_name_description') if row.get('chem_iupac_name_description') else None,
                'restriction': row.get('restriction') if row.get('restriction') else None,
                'function': row.get('function') if row.get('function') else None,
                'update_date': parse_date(row.get('update_date', ''))
            }
            
            batch.append(ingredient)
            
            if len(batch) >= batch_size:
                print(f"Importing batch {batch_num} ({len(batch)} ingredients)...", end=" ")
                success, result = import_batch(batch, batch_num)
                
                if success:
                    print(f"✅ ({result} imported)")
                    total_imported += result
                else:
                    print(f"❌ Error: {result[:80]}")
                    total_errors += len(batch)
                
                batch = []
                batch_num += 1
                
                # Progress indicator
                if batch_num % 10 == 0:
                    print(f"Progress: {total_imported} ingredients imported")
        
        # Import remaining batch
        if batch:
            print(f"Importing final batch {batch_num} ({len(batch)} ingredients)...", end=" ")
            success, result = import_batch(batch, batch_num)
            
            if success:
                print(f"✅ ({result} imported)")
                total_imported += result
            else:
                print(f"❌ Error: {result[:80]}")
                total_errors += len(batch)
    
    print("")
    print("=" * 60)
    print("Import Complete!")
    print(f"End time: {datetime.now()}")
    print(f"Total imported: {total_imported}")
    print(f"Total errors: {total_errors}")
    print("=" * 60)
    
    # Verify import
    print("")
    print("Verifying import...", end=" ")
    try:
        result = supabase.table('cosing_ingredients').select("count", count='exact').limit(1).execute()
        final_count = result.count if hasattr(result, 'count') else 0
        print(f"✅ Final count: {final_count}")
    except Exception as e:
        print(f"❌ Verification failed: {e}")

if __name__ == '__main__':
    main()

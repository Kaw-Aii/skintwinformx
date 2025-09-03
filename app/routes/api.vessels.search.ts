/**
 * API endpoint for searching vessel database
 */

import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import * as fs from 'fs';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const type = url.searchParams.get('type') || 'ingredient';
  const limit = parseInt(url.searchParams.get('limit') || '10');
  
  try {
    const results: any[] = [];
    
    if (type === 'ingredient' || type === 'all') {
      // Search ingredients
      const ingredientsPath = 'vessels/database/ingredients_master.json';
      const ingredients = JSON.parse(await fs.promises.readFile(ingredientsPath, 'utf8'));
      
      const matches = ingredients
        .filter((ing: any) => {
          const searchLower = query.toLowerCase();
          const nameMatch = ing.inci_name?.toLowerCase().includes(searchLower);
          const casMatch = ing.cas_number?.includes(query);
          return nameMatch || casMatch;
        })
        .slice(0, limit)
        .map((ing: any) => ({
          ...ing,
          inci_name: ing.inci_name?.replace(/[^\x20-\x7E]/g, '').trim() || ing.id,
          type: 'ingredient'
        }));
      
      results.push(...matches);
    }
    
    if (type === 'formulation' || type === 'all') {
      // Search formulations
      const formulationsPath = 'vessels/formulations/imported/index.json';
      if (fs.existsSync(formulationsPath)) {
        const index = JSON.parse(await fs.promises.readFile(formulationsPath, 'utf8'));
        
        const matches = index.formulations
          .filter((form: any) => 
            form.name?.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, limit)
          .map((form: any) => ({
            ...form,
            type: 'formulation'
          }));
        
        results.push(...matches);
      }
    }
    
    return json({
      success: true,
      query,
      results: results.slice(0, limit),
      total: results.length
    });
  } catch (error) {
    console.error('Search error:', error);
    return json({
      success: false,
      error: 'Search failed',
      query,
      results: [],
      total: 0
    }, { status: 500 });
  }
}
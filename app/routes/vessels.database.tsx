/**
 * Vessel Database Viewer
 * Interactive interface for exploring the comprehensive vessel database
 */

import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData, useSearchParams } from '@remix-run/react';
import { useState, useMemo } from 'react';
import * as fs from 'fs';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchQuery = url.searchParams.get('q') || '';
  const category = url.searchParams.get('category') || 'all';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 50;
  
  try {
    // Load database statistics
    const statsPath = 'vessels/database/database_statistics.json';
    const stats = JSON.parse(await fs.promises.readFile(statsPath, 'utf8'));
    
    // Load ingredients (paginated)
    const ingredientsPath = 'vessels/database/ingredients_master.json';
    const allIngredients = JSON.parse(await fs.promises.readFile(ingredientsPath, 'utf8'));
    
    // Filter ingredients
    let filteredIngredients = allIngredients;
    if (searchQuery) {
      filteredIngredients = allIngredients.filter((ing: any) => 
        ing.inci_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ing.cas_number?.includes(searchQuery)
      );
    }
    
    if (category !== 'all') {
      filteredIngredients = filteredIngredients.filter((ing: any) => 
        ing.function === category
      );
    }
    
    // Clean up ingredient names (remove special characters)
    filteredIngredients = filteredIngredients.map((ing: any) => ({
      ...ing,
      inci_name: ing.inci_name?.replace(/[^\x20-\x7E]/g, '').trim() || ing.id
    }));
    
    // Paginate
    const start = (page - 1) * limit;
    const paginatedIngredients = filteredIngredients.slice(start, start + limit);
    const totalPages = Math.ceil(filteredIngredients.length / limit);
    
    // Get unique functions for filter
    const functions = [...new Set(allIngredients.map((ing: any) => ing.function))].filter(Boolean);
    
    return json({
      stats,
      ingredients: paginatedIngredients,
      pagination: {
        page,
        totalPages,
        total: filteredIngredients.length,
        limit
      },
      functions,
      searchQuery,
      category
    });
  } catch (error) {
    console.error('Error loading database:', error);
    return json({
      stats: null,
      ingredients: [],
      pagination: { page: 1, totalPages: 1, total: 0, limit },
      functions: [],
      searchQuery,
      category
    });
  }
}

export default function VesselDatabase() {
  const data = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
  
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    setSearchParams(prev => {
      prev.set('q', query);
      prev.set('page', '1');
      return prev;
    });
  };
  
  const handleCategoryChange = (category: string) => {
    setSearchParams(prev => {
      prev.set('category', category);
      prev.set('page', '1');
      return prev;
    });
  };
  
  const handlePageChange = (page: number) => {
    setSearchParams(prev => {
      prev.set('page', page.toString());
      return prev;
    });
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          SKIN-TWIN Vessel Database
        </h1>
        <p className="text-gray-600">
          Comprehensive ingredient and formulation database with COSING integration
        </p>
      </div>
      
      {/* Statistics */}
      {data.stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Ingredients</div>
            <div className="text-2xl font-bold text-blue-600">
              {data.stats.summary.total_ingredients.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              COSING: {data.stats.ingredients.cosing_sourced.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Formulations</div>
            <div className="text-2xl font-bold text-green-600">
              {data.stats.summary.total_formulations}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Avg. {data.stats.formulations.average_ingredients.toFixed(1)} ingredients
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Coverage</div>
            <div className="text-2xl font-bold text-purple-600">
              {((data.stats.coverage.ingredients_with_cosing_data / data.stats.summary.total_ingredients) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400 mt-1">With COSING data</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Natural</div>
            <div className="text-2xl font-bold text-teal-600">
              {data.stats.ingredients.natural || 0}
            </div>
            <div className="text-xs text-gray-400 mt-1">Natural ingredients</div>
          </div>
        </div>
      )}
      
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
          <input
            type="text"
            name="search"
            placeholder="Search by INCI name or CAS number..."
            defaultValue={data.searchQuery}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Search
          </button>
        </form>
        
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-3 py-1 rounded-full text-sm ${
              data.category === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {data.functions.slice(0, 10).map((func: any) => (
            <button
              key={String(func)}
              onClick={() => handleCategoryChange(String(func))}
              className={`px-3 py-1 rounded-full text-sm ${
                data.category === func 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {String(func)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Results */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <span className="text-sm text-gray-600">
            Found {data.pagination.total} ingredients
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  INCI Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CAS Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Function
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Concentration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.ingredients.map((ingredient: any, index: number) => (
                <tr 
                  key={`${ingredient.id}-${index}`}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedIngredient(ingredient)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {ingredient.inci_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ingredient.cas_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ingredient.function}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ingredient.concentration_min?.toFixed(2) || '0.01'} - {ingredient.concentration_max?.toFixed(2) || '100'}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ingredient.usage_count || 0} formulations
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ingredient.is_restricted 
                        ? 'bg-red-100 text-red-800' 
                        : ingredient.is_natural 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ingredient.is_restricted ? 'Restricted' : ingredient.is_natural ? 'Natural' : 'Standard'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {data.pagination.totalPages > 1 && (
          <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
            <button
              onClick={() => handlePageChange(data.pagination.page - 1)}
              disabled={data.pagination.page === 1}
              className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-700">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(data.pagination.page + 1)}
              disabled={data.pagination.page === data.pagination.totalPages}
              className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
      
      {/* Ingredient Detail Modal */}
      {selectedIngredient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">{selectedIngredient.inci_name}</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm text-gray-500">CAS Number</label>
                  <p className="font-medium">{selectedIngredient.cas_number || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Function</label>
                  <p className="font-medium">{selectedIngredient.function}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Concentration Range</label>
                  <p className="font-medium">
                    {selectedIngredient.concentration_min}% - {selectedIngredient.concentration_max}%
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Source</label>
                  <p className="font-medium">{selectedIngredient.source || 'COSING'}</p>
                </div>
              </div>
              
              {selectedIngredient.formulations && selectedIngredient.formulations.length > 0 && (
                <div className="mb-4">
                  <label className="text-sm text-gray-500">Used in Formulations</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedIngredient.formulations.map((formulation: string) => (
                      <span key={formulation} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                        {formulation}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedIngredient(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
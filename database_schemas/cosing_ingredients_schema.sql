-- COSING Ingredients Database Schema
-- European Commission COSING Database
-- Total Ingredients: 30,070
-- Last Updated: November 16, 2025

-- ============================================================================
-- COSING INGREDIENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cosing_ingredients (
    id SERIAL PRIMARY KEY,
    cosing_ref_no INTEGER NOT NULL UNIQUE,
    inci_name TEXT NOT NULL,
    inn_name TEXT,
    ph_eur_name TEXT,
    cas_no TEXT,
    ec_no TEXT,
    chem_iupac_name_description TEXT,
    restriction TEXT,
    function TEXT,
    update_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cosing_ref_no 
    ON public.cosing_ingredients(cosing_ref_no);

CREATE INDEX IF NOT EXISTS idx_inci_name 
    ON public.cosing_ingredients(inci_name);

CREATE INDEX IF NOT EXISTS idx_function 
    ON public.cosing_ingredients(function);

CREATE INDEX IF NOT EXISTS idx_cas_no 
    ON public.cosing_ingredients(cas_no);

CREATE INDEX IF NOT EXISTS idx_ec_no 
    ON public.cosing_ingredients(ec_no);

-- Full-text search index for INCI names
CREATE INDEX IF NOT EXISTS idx_inci_name_trgm 
    ON public.cosing_ingredients USING gin(inci_name gin_trgm_ops);

-- Full-text search index for chemical descriptions
CREATE INDEX IF NOT EXISTS idx_chem_desc_trgm 
    ON public.cosing_ingredients USING gin(chem_iupac_name_description gin_trgm_ops);

-- ============================================================================
-- COSING INGREDIENT FUNCTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cosing_functions (
    id SERIAL PRIMARY KEY,
    function_name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cosing_functions_name 
    ON public.cosing_functions(function_name);

-- ============================================================================
-- COSING RESTRICTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cosing_restrictions (
    id SERIAL PRIMARY KEY,
    cosing_ref_no INTEGER NOT NULL REFERENCES public.cosing_ingredients(cosing_ref_no),
    restriction_type TEXT,
    restriction_details TEXT,
    max_concentration DECIMAL(10, 4),
    conditions TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cosing_restrictions_ref 
    ON public.cosing_restrictions(cosing_ref_no);

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- View: Ingredient Statistics by Function
CREATE OR REPLACE VIEW public.cosing_function_stats AS
SELECT 
    function,
    COUNT(*) as ingredient_count,
    COUNT(DISTINCT CASE WHEN restriction IS NOT NULL THEN cosing_ref_no END) as restricted_count,
    COUNT(DISTINCT CASE WHEN cas_no IS NOT NULL THEN cosing_ref_no END) as with_cas_count
FROM public.cosing_ingredients
WHERE function IS NOT NULL
GROUP BY function
ORDER BY ingredient_count DESC;

-- View: Recent Updates
CREATE OR REPLACE VIEW public.cosing_recent_updates AS
SELECT 
    cosing_ref_no,
    inci_name,
    function,
    update_date,
    restriction
FROM public.cosing_ingredients
WHERE update_date IS NOT NULL
ORDER BY update_date DESC
LIMIT 100;

-- View: Restricted Ingredients
CREATE OR REPLACE VIEW public.cosing_restricted_ingredients AS
SELECT 
    cosing_ref_no,
    inci_name,
    function,
    restriction,
    update_date
FROM public.cosing_ingredients
WHERE restriction IS NOT NULL
ORDER BY update_date DESC;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_cosing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cosing_ingredients_timestamp
    BEFORE UPDATE ON public.cosing_ingredients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_cosing_timestamp();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Search ingredients by name
CREATE OR REPLACE FUNCTION public.search_cosing_ingredients(
    search_term TEXT,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    cosing_ref_no INTEGER,
    inci_name TEXT,
    function TEXT,
    restriction TEXT,
    similarity REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ci.cosing_ref_no,
        ci.inci_name,
        ci.function,
        ci.restriction,
        similarity(ci.inci_name, search_term) as sim
    FROM public.cosing_ingredients ci
    WHERE ci.inci_name % search_term
    ORDER BY sim DESC, ci.inci_name
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Get ingredient by CAS number
CREATE OR REPLACE FUNCTION public.get_ingredient_by_cas(
    cas_number TEXT
)
RETURNS TABLE (
    cosing_ref_no INTEGER,
    inci_name TEXT,
    function TEXT,
    chem_iupac_name_description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ci.cosing_ref_no,
        ci.inci_name,
        ci.function,
        ci.chem_iupac_name_description
    FROM public.cosing_ingredients ci
    WHERE ci.cas_no LIKE '%' || cas_number || '%';
END;
$$ LANGUAGE plpgsql;

-- Function: Get ingredients by function
CREATE OR REPLACE FUNCTION public.get_ingredients_by_function(
    function_name TEXT
)
RETURNS TABLE (
    cosing_ref_no INTEGER,
    inci_name TEXT,
    cas_no TEXT,
    restriction TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ci.cosing_ref_no,
        ci.inci_name,
        ci.cas_no,
        ci.restriction
    FROM public.cosing_ingredients ci
    WHERE ci.function ILIKE '%' || function_name || '%'
    ORDER BY ci.inci_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.cosing_ingredients IS 
    'European Commission COSING database of cosmetic ingredients (30,070 ingredients)';

COMMENT ON COLUMN public.cosing_ingredients.cosing_ref_no IS 
    'Unique COSING reference number from European Commission database';

COMMENT ON COLUMN public.cosing_ingredients.inci_name IS 
    'International Nomenclature of Cosmetic Ingredients (INCI) name';

COMMENT ON COLUMN public.cosing_ingredients.inn_name IS 
    'International Nonproprietary Name (INN) for pharmaceutical ingredients';

COMMENT ON COLUMN public.cosing_ingredients.ph_eur_name IS 
    'European Pharmacopoeia (Ph. Eur.) name';

COMMENT ON COLUMN public.cosing_ingredients.cas_no IS 
    'Chemical Abstracts Service (CAS) registry number(s)';

COMMENT ON COLUMN public.cosing_ingredients.ec_no IS 
    'European Community (EC) number';

COMMENT ON COLUMN public.cosing_ingredients.chem_iupac_name_description IS 
    'Chemical/IUPAC name and description of the ingredient';

COMMENT ON COLUMN public.cosing_ingredients.restriction IS 
    'Regulatory restrictions on ingredient use';

COMMENT ON COLUMN public.cosing_ingredients.function IS 
    'Primary function of the ingredient in cosmetic formulations';

COMMENT ON COLUMN public.cosing_ingredients.update_date IS 
    'Last update date in COSING database';

-- ============================================================================
-- ENABLE TRIGRAM EXTENSION FOR FUZZY SEARCH
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- SAMPLE QUERIES
-- ============================================================================

/*
-- Search for ingredients containing "hyaluronic"
SELECT * FROM public.search_cosing_ingredients('hyaluronic', 10);

-- Get all emollients
SELECT * FROM public.get_ingredients_by_function('emollient');

-- Find ingredient by CAS number
SELECT * FROM public.get_ingredient_by_cas('9004-61-9');

-- Get function statistics
SELECT * FROM public.cosing_function_stats LIMIT 20;

-- Get restricted ingredients
SELECT * FROM public.cosing_restricted_ingredients LIMIT 50;

-- Get recent updates
SELECT * FROM public.cosing_recent_updates;
*/

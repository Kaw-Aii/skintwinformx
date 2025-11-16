# PIF Markdown Files

This directory contains Product Information Files (PIFs) converted to Markdown format for better readability and version control.

## Overview

**Total Files:** 20 PIF documents  
**Conversion Date:** November 16, 2025  
**Source Format:** PDF → Text → Markdown  
**Compliance:** European Cosmetics Regulation EC No. 1223/2009, Article 11

## Product Categories

### SpaZone Products (9 files)
- SpaZone - (8 Products) - 2021_08
- SpaZone - Instant Facial Lifting Wonder Serum
- SpaZone - Marine Replenishing Peptide Masque
- SpaZone - Neck and Breast Refining Complex
- SpaZone - O2 Purifyer Face + Body Enhancing Serum
- SpaZone - O2 Radiance Luminosity Masque
- SpaZone - Slimming Sculpting Solution Lift Firm Tone Sculpt
- SpaZone - Target Cellulite Silhoutte Contouring Complex
- SpaZone - Urban Stress Protect + Detox Clarifying Masque

### Zone Products (11 files)
- Zone - 'Acne Attack' Pro-Masque
- Zone - 'Acne Attack' Rescue Serum
- Zone - (8 Products) - 1 of 3
- Zone - (8 Products) - 2 of 3
- Zone - (8 Products) - 3 of 3
- Zone - 30 Power Peel NE Gel (Final)
- Zone - 50 Power Peel NE Gel (Final)
- Zone - Age Reversal
- Zone - Anti-Inflamm-Ageing (Final)
- Zone - Daily Radiant Boost (Final)
- Zone - Daily Ultra Defence

## Document Structure

Each PIF Markdown file contains:

1. **Frontmatter**
   - Document type
   - Product name
   - Preparation date
   - Last update date
   - Regulatory compliance statement

2. **Table of Contents**
   - Introduction
   - Product Description
   - Cosmetic Product Safety Report

3. **Part A: Cosmetic Product Safety Information**
   - A.1 Quantitative and qualitative composition
   - A.2 Physical/chemical characteristics and stability
   - A.3 Microbiological quality
   - A.4 Impurities, traces, packaging material information
   - A.5 Normal and reasonably foreseeable use
   - A.6 Exposure to the cosmetic product
   - A.7 Exposure to the substances
   - A.8 Toxicological profile of the substances
   - A.9 Undesirable effects and serious undesirable effects
   - A.10 Information on the cosmetic product

4. **Part B: Cosmetic Product Safety Assessment**
   - B.1 Assessment conclusion
   - B.2 Label warnings and instructions for use
   - B.3 Reasoning
   - B.4 Assessor's credentials and approval

5. **Additional Information**
   - Method of manufacture / GMP certification
   - Proof of effect claimed
   - Animal testing statement

6. **Appendices**
   - Appendix 1: Safety data sheets or ingredient specifications
   - Appendix 2: Microbial challenge test
   - Appendix 3: Certificates of allergen content
   - Appendix 4: Miscellaneous

## Usage

These Markdown files can be:
- Viewed directly on GitHub with proper formatting
- Searched using text-based tools
- Version controlled with git
- Converted to other formats (HTML, PDF, etc.)
- Integrated into documentation systems

## Conversion Process

The conversion from PDF to Markdown involved:

1. **PDF Text Extraction** - Original PDFs extracted to text files
2. **Text Parsing** - Structured parsing of PIF format
3. **Markdown Formatting** - Conversion to Markdown with proper headers and formatting
4. **Quality Verification** - All 20 files converted successfully (100% success rate)

## File Naming Convention

Files follow the pattern:
```
PIF - [Brand] - [Product Name] - [Date].md
```

Where:
- **Brand:** SpaZone or Zone
- **Product Name:** Descriptive product name
- **Date:** Preparation date (YYYY_MM format)

## Regulatory Compliance

All PIFs comply with:
- **Regulation:** EC No. 1223/2009
- **Article:** Article 11
- **Scope:** European Cosmetics Regulation
- **Purpose:** Product Information File requirements

## Source Files

- **Original PDFs:** `../` (parent directory)
- **Extracted Text:** `../extracted_text/`
- **Markdown Files:** `.` (current directory)

## Maintenance

To update or add new PIF files:

1. Place PDF in the parent directory
2. Extract text to `../extracted_text/`
3. Run conversion script: `python3 /home/ubuntu/convert_pif_to_md.py`
4. Review generated Markdown file
5. Commit changes to repository

## Notes

- Some formatting may vary due to PDF extraction limitations
- Tables and complex layouts are converted to text format
- Original PDFs should be retained as source of truth
- Markdown files are for convenience and searchability

---

**Last Updated:** November 16, 2025  
**Conversion Tool:** Custom Python script  
**Total Size:** ~1.6 MB (all Markdown files)

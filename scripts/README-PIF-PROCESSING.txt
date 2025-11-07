# PIF Document Processing Script

## Overview

The `process-pif-documents.cjs` script automatically identifies and processes Product Information Files (PIFs) in the SKIN-TWIN repository, generating structured vessel files.

## Quick Start

```bash
npm run process-pif
```

## What It Does

1. **Scans** the repository for PIF documents (.doc, .docx, .pdf)
2. **Extracts** text and metadata from each document
3. **Generates** Product, Formulation, and PIF vessel files
4. **Reports** processing results and quality metrics

## Processing Results (Latest Run)

- **Total Documents**: 13
- **Success Rate**: 100% (13/13)
- **Vessels Generated**: 33 files
  - 11 Product vessels (B19PRD*.json)
  - 11 Formulation vessels (B19FRM*.json)  
  - 11 PIF vessels (B19PIF*.json)

## Output Locations

- **Products**: `vessels/products/`
- **Formulations**: `vessels/formulations/`
- **PIFs**: `vessels/msdspif/processed/`
- **Report**: `vessels/pif-processing-report.json`

## Supported Formats

- `.doc` - Legacy Word documents (via antiword)
- `.docx` - Modern Word documents (via mammoth)
- `.pdf` - PDF documents (via pdf-parse)

## Vessel ID Format

Generated vessels follow the naming convention:
- Products: `B19PRD{NAME}` (e.g., B19PRDZONEACNEATTACKP)
- Formulations: `B19FRM{NAME}` (e.g., B19FRMZONEACNEATTACKP)
- PIFs: `B19PIF{NAME}` (e.g., B19PIFZONEACNEATTACKP)

## Quality Scoring

Each extraction receives a quality score (0-100) based on:
- Product name extraction: 20 points
- Product type extraction: 15 points
- Product form extraction: 15 points
- Ingredients found: 30-50 points (with bonuses)

## Dependencies

- `mammoth` - Word document processing
- `pdf-parse` - PDF text extraction
- `antiword` - Legacy .doc file processing (system utility)

## Technical Details

### Document Scanning

The script scans:
- Repository root for `.doc` files
- `vessels/msdspif/` directory for PDF and Word files

### Extraction Pipeline

1. Format detection
2. Text extraction (format-specific)
3. Data parsing and structuring
4. Vessel generation with unique IDs
5. Quality validation
6. Report generation

## Troubleshooting

**Low extraction quality (< 50%)**
- Check document formatting
- Verify section headers are present
- Ensure text is machine-readable (not scanned images)

**No ingredients found**
- Verify "Ingredient" or "INCI" section headers
- Check for percentage values (e.g., "5%")
- Ensure standard table formatting

**Processing failures**
- Verify document is not corrupted
- Check file format matches extension
- Ensure document is not password-protected

## Future Enhancements

- Enhanced ingredient extraction using ML
- INCI name validation against CosIng database
- Supplier information extraction
- Regulatory compliance checking
- Incremental updates for modified PIFs
- Batch processing optimization

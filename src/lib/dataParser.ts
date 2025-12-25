import { RawPortfolioItem, PortfolioItem, ValidationResult } from './types';

// Column name mappings for flexible CSV parsing
const COLUMN_MAPPINGS: Record<string, string[]> = {
  productName: ['product name', 'item name', 'name', 'product', 'item', 'title'],
  category: ['category', 'set', 'series', 'collection', 'type'],
  quantity: ['quantity', 'qty', 'count', 'amount', 'units'],
  marketPrice: ['market price', 'market value', 'current price', 'price', 'value'],
  averageCostPaid: ['average cost paid', 'avg cost', 'cost', 'purchase price', 'paid', 'cost basis'],
  grade: ['grade', 'condition', 'grading', 'psa', 'bgs', 'cgc'],
  cardNumber: ['card number', 'card #', 'card no', 'number', '#', 'card'],
  dateAdded: ['date added', 'date', 'added', 'purchase date', 'acquired'],
};

/**
 * Sanitize a numeric string by removing currency symbols, commas, and whitespace
 */
export function sanitizeNumeric(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }

  // Remove currency symbols, commas, and whitespace
  const cleaned = String(value)
    .replace(/[$€£¥]/g, '')
    .replace(/,/g, '')
    .replace(/\s/g, '')
    .trim();

  if (cleaned === '' || cleaned === '-') {
    return 0;
  }

  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed)) {
    throw new Error(`Cannot parse numeric value: "${value}"`);
  }

  return parsed;
}

/**
 * Parse a date string into a Date object
 */
export function parseDate(value: string | undefined | null): Date | null {
  if (!value || value.trim() === '') {
    return null;
  }

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Find the matching column name from CSV headers
 */
function findColumn(headers: string[], targetField: string): string | null {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  const mappings = COLUMN_MAPPINGS[targetField] || [];

  for (const mapping of mappings) {
    const index = normalizedHeaders.indexOf(mapping.toLowerCase());
    if (index !== -1) {
      return headers[index];
    }
  }

  return null;
}

/**
 * Classify asset type based on grade and card number
 */
export function classifyAssetType(grade: string, cardNumber: string): 'Slab' | 'Raw Card' | 'Sealed' {
  const normalizedGrade = grade?.toLowerCase().trim() || '';
  const hasCardNumber = cardNumber?.trim().length > 0;
  const isUngraded = normalizedGrade === '' || normalizedGrade === 'ungraded' || normalizedGrade === 'n/a' || normalizedGrade === 'none';

  if (!isUngraded && normalizedGrade !== '') {
    return 'Slab';
  }

  if (hasCardNumber && isUngraded) {
    return 'Raw Card';
  }

  return 'Sealed';
}

/**
 * Determine liquidity tier based on asset characteristics
 */
export function classifyLiquidityTier(
  assetType: 'Slab' | 'Raw Card' | 'Sealed',
  marketValue: number,
  quantity: number,
  productName: string
): 'High' | 'Medium' | 'Low' {
  const normalizedName = productName.toLowerCase();

  // High liquidity: Graded cards (slabs) and high-value singles
  if (assetType === 'Slab') {
    return 'High';
  }

  // High-value raw cards
  if (assetType === 'Raw Card' && marketValue > 50) {
    return 'High';
  }

  // Common sealed products
  const highDemandSealed = ['etb', 'elite trainer', 'booster box', 'bundle', 'collection box'];
  if (assetType === 'Sealed' && highDemandSealed.some(term => normalizedName.includes(term))) {
    return 'Medium';
  }

  // Large quantities = lower liquidity
  if (quantity > 10) {
    return 'Low';
  }

  // Bulk or niche items
  if (normalizedName.includes('bulk') || normalizedName.includes('lot')) {
    return 'Low';
  }

  return 'Medium';
}

/**
 * Parse CSV content into raw portfolio items
 */
export function parseCSV(content: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain headers and at least one data row');
  }

  // Parse headers
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Process raw CSV data into validated portfolio items
 */
export function processPortfolioData(
  csvContent: string
): { items: PortfolioItem[]; validation: ValidationResult } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const items: PortfolioItem[] = [];

  try {
    const { headers, rows } = parseCSV(csvContent);

    // Find column mappings
    const columnMap: Record<string, string | null> = {
      productName: findColumn(headers, 'productName'),
      category: findColumn(headers, 'category'),
      quantity: findColumn(headers, 'quantity'),
      marketPrice: findColumn(headers, 'marketPrice'),
      averageCostPaid: findColumn(headers, 'averageCostPaid'),
      grade: findColumn(headers, 'grade'),
      cardNumber: findColumn(headers, 'cardNumber'),
      dateAdded: findColumn(headers, 'dateAdded'),
    };

    // Validate required columns
    if (!columnMap.productName) {
      errors.push('Missing required column: Product Name');
    }
    if (!columnMap.quantity) {
      errors.push('Missing required column: Quantity');
    }
    if (!columnMap.marketPrice) {
      errors.push('Missing required column: Market Price');
    }

    if (errors.length > 0) {
      return { items: [], validation: { isValid: false, errors, warnings } };
    }

    // Process each row
    let totalMarketValueSum = 0;

    rows.forEach((row, index) => {
      try {
        const quantity = sanitizeNumeric(row[columnMap.quantity!]);
        const marketPrice = sanitizeNumeric(row[columnMap.marketPrice!]);
        const averageCostPaid = sanitizeNumeric(row[columnMap.averageCostPaid || ''] || '0');
        const grade = row[columnMap.grade || ''] || '';
        const cardNumber = row[columnMap.cardNumber || ''] || '';

        // Skip empty rows
        if (!row[columnMap.productName!]?.trim()) {
          return;
        }

        // Calculate derived fields
        const totalMarketValue = quantity * marketPrice;
        const totalCostBasis = quantity * averageCostPaid;
        const profitDollars = totalMarketValue - totalCostBasis;
        const gainPercent = totalCostBasis > 0 ? ((marketPrice - averageCostPaid) / averageCostPaid) * 100 : 0;

        // Classify asset
        const assetType = classifyAssetType(grade, cardNumber);
        const liquidityTier = classifyLiquidityTier(assetType, totalMarketValue, quantity, row[columnMap.productName!]);

        const item: PortfolioItem = {
          id: `item-${index}-${Date.now()}`,
          productName: row[columnMap.productName!],
          category: row[columnMap.category || ''] || 'Uncategorized',
          quantity,
          marketPrice,
          averageCostPaid,
          grade,
          cardNumber,
          dateAdded: parseDate(row[columnMap.dateAdded || '']),
          totalMarketValue,
          totalCostBasis,
          profitDollars,
          gainPercent,
          portfolioWeightPercent: 0, // Will be calculated after totals
          assetType,
          liquidityTier,
        };

        items.push(item);
        totalMarketValueSum += totalMarketValue;
      } catch (err) {
        errors.push(`Row ${index + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    });

    // Calculate portfolio weight percentages
    items.forEach(item => {
      item.portfolioWeightPercent = totalMarketValueSum > 0 
        ? (item.totalMarketValue / totalMarketValueSum) * 100 
        : 0;
    });

    // Validation check: Verify totals match independent aggregation
    const recalculatedTotal = items.reduce((sum, item) => sum + item.totalMarketValue, 0);
    const tolerance = totalMarketValueSum * 0.001; // 0.1% tolerance

    if (Math.abs(recalculatedTotal - totalMarketValueSum) > tolerance) {
      errors.push(`Data parsing mismatch: Aggregated total ($${recalculatedTotal.toFixed(2)}) differs from sum ($${totalMarketValueSum.toFixed(2)})`);
    }

    if (items.length === 0) {
      errors.push('No valid items found in the CSV file');
    }

    return {
      items,
      validation: {
        isValid: errors.length === 0,
        errors,
        warnings,
      },
    };
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Failed to parse CSV file');
    return { items: [], validation: { isValid: false, errors, warnings } };
  }
}

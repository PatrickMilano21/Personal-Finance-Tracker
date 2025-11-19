import Papa from 'papaparse';
import { Transaction, StatementFile } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  'Restaurant': '#ef4444',
  'Groceries': '#f97316',
  'Gas & Fuel': '#eab308',
  'Shopping': '#22c55e',
  'Entertainment': '#06b6d4',
  'Subscriptions': '#3b82f6',
  'Travel': '#8b5cf6',
  'Health': '#ec4899',
  'Fees': '#6b7280',
  'Other': '#a3a3a3'
};

export function getCategoryColor(category: string): string {
  // Simplify category names for color matching
  const simplified = simplifyCategory(category);
  return CATEGORY_COLORS[simplified] || CATEGORY_COLORS['Other'];
}

export function simplifyCategory(category: string): string {
  const lower = category.toLowerCase();

  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('café') || lower.includes('fast food')) {
    return 'Restaurant';
  }
  if (lower.includes('groceries') || lower.includes('supermarket')) {
    return 'Groceries';
  }
  if (lower.includes('gas') || lower.includes('fuel') || lower.includes('auto')) {
    return 'Gas & Fuel';
  }
  if (lower.includes('merchandise') || lower.includes('supplies') || lower.includes('clothing') || lower.includes('electronics')) {
    return 'Shopping';
  }
  if (lower.includes('entertainment') || lower.includes('movie') || lower.includes('theater')) {
    return 'Entertainment';
  }
  if (lower.includes('computer services') || lower.includes('telecommunications')) {
    return 'Subscriptions';
  }
  if (lower.includes('travel') || lower.includes('airline') || lower.includes('lodging') || lower.includes('rental')) {
    return 'Travel';
  }
  if (lower.includes('drug') || lower.includes('pharmacy') || lower.includes('health')) {
    return 'Health';
  }
  if (lower.includes('fee') || lower.includes('adjustment') || lower.includes('interest')) {
    return 'Fees';
  }

  return 'Other';
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function parseDate(dateStr: string): Date {
  // Try MM/DD/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
  }

  // Fallback
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function parseAmount(amountStr: string): number {
  const cleaned = amountStr.replace(/[$,\s]/g, '');
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : amount;
}

export function parseCSV(csvContent: string, fileId: string): Transaction[] {
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  const transactions: Transaction[] = [];

  for (const row of result.data as Record<string, string>[]) {
    const date = row['Date'];
    const description = row['Description'];
    const amountStr = row['Amount'];
    const category = row['Category'] || 'Other';

    if (!date || !description || !amountStr) continue;

    const amount = parseAmount(amountStr);

    // Skip payments (negative amounts) and zero amounts
    if (amount <= 0) continue;

    // Extract city/state from the data
    const cityState = row['City/State'] || '';
    const [city, state] = cityState.split('\n').map(s => s.trim());

    transactions.push({
      id: generateId(),
      date: parseDate(date),
      description: description.trim(),
      amount,
      category: simplifyCategory(category),
      city,
      state,
      fileId,
    });
  }

  // Sort by date descending
  transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

  return transactions;
}

export function createStatementFile(filename: string, csvContent: string): StatementFile {
  const fileId = generateId();
  const transactions = parseCSV(csvContent, fileId);

  return {
    id: fileId,
    filename,
    uploadDate: new Date(),
    transactions,
  };
}

export function getCategoryTotals(transactions: Transaction[]): { category: string; total: number; count: number; color: string }[] {
  const categoryMap = new Map<string, { total: number; count: number }>();

  for (const transaction of transactions) {
    const existing = categoryMap.get(transaction.category) || { total: 0, count: 0 };
    categoryMap.set(transaction.category, {
      total: existing.total + transaction.amount,
      count: existing.count + 1,
    });
  }

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      color: getCategoryColor(category),
    }))
    .sort((a, b) => b.total - a.total);
}

export function getMonthlySpending(transactions: Transaction[]): { month: string; total: number }[] {
  const monthlyMap = new Map<string, number>();

  for (const transaction of transactions) {
    const monthKey = `${transaction.date.getFullYear()}-${String(transaction.date.getMonth() + 1).padStart(2, '0')}`;
    const existing = monthlyMap.get(monthKey) || 0;
    monthlyMap.set(monthKey, existing + transaction.amount);
  }

  return Array.from(monthlyMap.entries())
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function getTopMerchants(transactions: Transaction[], limit: number = 10): { name: string; total: number; count: number }[] {
  const merchantMap = new Map<string, { total: number; count: number }>();

  for (const transaction of transactions) {
    // Extract merchant name (first part before numbers/special chars)
    const merchantName = transaction.description.split(/\d/)[0].trim();
    const existing = merchantMap.get(merchantName) || { total: 0, count: 0 };
    merchantMap.set(merchantName, {
      total: existing.total + transaction.amount,
      count: existing.count + 1,
    });
  }

  return Array.from(merchantMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function filterTransactionsByDateRange(
  transactions: Transaction[],
  from: Date | undefined,
  to: Date | undefined
): Transaction[] {
  return transactions.filter((t) => {
    if (from && t.date < from) return false;
    if (to && t.date > to) return false;
    return true;
  });
}

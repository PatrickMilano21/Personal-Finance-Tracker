import { StatementFile, Transaction } from '@/types';

const STORAGE_KEY = 'finance_app_files';

export function saveFiles(files: StatementFile[]): void {
  if (typeof window === 'undefined') return;

  const serialized = files.map(file => ({
    ...file,
    uploadDate: file.uploadDate.toISOString(),
    transactions: file.transactions.map(t => ({
      ...t,
      date: t.date.toISOString(),
    })),
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
}

export function loadFiles(): StatementFile[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return parsed.map((file: StatementFile & { uploadDate: string; transactions: (Transaction & { date: string })[] }) => ({
      ...file,
      uploadDate: new Date(file.uploadDate),
      transactions: file.transactions.map(t => ({
        ...t,
        date: new Date(t.date),
      })),
    }));
  } catch {
    return [];
  }
}

export function clearFiles(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getAllTransactions(files: StatementFile[]): Transaction[] {
  return files
    .flatMap(file => file.transactions)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function exportToCSV(transactions: Transaction[]): string {
  const headers = ['Date', 'Description', 'Amount', 'Category', 'City', 'State'];
  const rows = transactions.map(t => [
    t.date.toLocaleDateString(),
    `"${t.description.replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    t.category,
    t.city || '',
    t.state || '',
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

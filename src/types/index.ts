export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  city?: string;
  state?: string;
  fileId: string;
}

export interface StatementFile {
  id: string;
  filename: string;
  uploadDate: Date;
  transactions: Transaction[];
}

export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
  color: string;
}

export interface MonthlySpending {
  month: string;
  total: number;
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

'use client';

import { useState, useEffect } from 'react';
import { StatementFile } from '@/types';
import { saveFiles, loadFiles, getAllTransactions } from '@/lib/storage';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Dashboard from '@/components/Dashboard';
import Files from '@/components/Files';
import Transactions from '@/components/Transactions';
import { Wallet, LayoutDashboard, FolderOpen, List } from 'lucide-react';

export default function Home() {
  const [files, setFiles] = useState<StatementFile[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load files from localStorage on mount
  useEffect(() => {
    const stored = loadFiles();
    setFiles(stored);
    setIsLoaded(true);
  }, []);

  // Save files to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      saveFiles(files);
    }
  }, [files, isLoaded]);

  const allTransactions = getAllTransactions(files);

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Finance Tracker
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Files
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard transactions={allTransactions} />
          </TabsContent>

          <TabsContent value="files">
            <Files files={files} onFilesChange={setFiles} />
          </TabsContent>

          <TabsContent value="transactions">
            <Transactions transactions={allTransactions} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

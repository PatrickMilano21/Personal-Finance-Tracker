'use client';

import { useState } from 'react';
import { StatementFile } from '@/types';
import { createStatementFile } from '@/lib/parser';
import { Upload, Trash2, Eye, FileText, Calendar, Hash, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface FilesProps {
  files: StatementFile[];
  onFilesChange: (files: StatementFile[]) => void;
}

export default function Files({ files, onFilesChange }: FilesProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<StatementFile | null>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      readFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFile(file);
    }
    // Reset input
    e.target.value = '';
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const statementFile = createStatementFile(file.name, content);
      onFilesChange([...files, statementFile]);
    };
    reader.readAsText(file);
  };

  const handleDelete = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file and all its transactions?')) {
      onFilesChange(files.filter(f => f.id !== fileId));
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
      }
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);

  const getFileTotal = (file: StatementFile) =>
    file.transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:border-blue-500'
        }`}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-10 h-10 mx-auto mb-3 text-zinc-400" />
          <p className="text-base font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Drop statement file here or click to browse
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            CSV format (Amex, Chase, etc.)
          </p>
        </label>
      </div>

      {/* File List */}
      {files.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No files uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Uploaded Files ({files.length})
          </h3>
          {files
            .sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime())
            .map((file) => (
              <div
                key={file.id}
                className={`bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border transition-colors ${
                  selectedFile?.id === file.id
                    ? 'border-blue-500'
                    : 'border-zinc-200 dark:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-zinc-400" />
                      <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                        {file.filename}
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(file.uploadDate, 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" />
                        {file.transactions.length} transactions
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        {formatCurrency(getFileTotal(file))}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedFile(selectedFile?.id === file.id ? null : file)}
                      className="p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="View transactions"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded view */}
                {selectedFile?.id === file.id && (
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-zinc-500 dark:text-zinc-400">
                            <th className="pb-2 font-medium">Date</th>
                            <th className="pb-2 font-medium">Description</th>
                            <th className="pb-2 font-medium text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {file.transactions.slice(0, 20).map((t) => (
                            <tr key={t.id} className="border-t border-zinc-100 dark:border-zinc-800">
                              <td className="py-2 text-zinc-600 dark:text-zinc-400">
                                {format(t.date, 'MM/dd')}
                              </td>
                              <td className="py-2 text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">
                                {t.description}
                              </td>
                              <td className="py-2 text-right text-zinc-900 dark:text-zinc-100">
                                {formatCurrency(t.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {file.transactions.length > 20 && (
                        <p className="text-center text-sm text-zinc-500 mt-2">
                          +{file.transactions.length - 20} more transactions
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

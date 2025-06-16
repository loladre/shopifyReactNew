import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { FileSpreadsheet, Upload } from 'lucide-react';

export default function ExcelImport() {
  return (
    <Layout title="Excel Import">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Price2Spy Excel Import</h1>
            <p className="text-slate-600 mt-1">Import price adjustments from Excel files</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <FileSpreadsheet className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Excel Import</h3>
          <p className="text-slate-600 mb-6">This page will handle bulk price adjustments via Excel import.</p>
          <div className="text-sm text-slate-500">
            Features to be implemented:
            <ul className="mt-2 space-y-1">
              <li>• Upload Excel files with price data</li>
              <li>• Validate price information</li>
              <li>• Preview changes before applying</li>
              <li>• Bulk update product prices</li>
            </ul>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { TrendingUp, Upload } from 'lucide-react';

export default function SellThroughImport() {
  return (
    <Layout title="Sell Through Import">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Sell Through Import</h1>
            <p className="text-slate-600 mt-1">Import sales performance data</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <TrendingUp className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Sell Through Import</h3>
          <p className="text-slate-600 mb-6">This page will handle importing sales performance and sell-through data.</p>
          <div className="text-sm text-slate-500">
            Features to be implemented:
            <ul className="mt-2 space-y-1">
              <li>• Upload sales data files</li>
              <li>• Validate sales information</li>
              <li>• Calculate sell-through rates</li>
              <li>• Generate performance reports</li>
            </ul>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
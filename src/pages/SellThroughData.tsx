import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function SellThroughData() {
  return (
    <Layout title="Sell Through Data">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Sell Through Data</h1>
            <p className="text-slate-600 mt-1">View and analyze sales performance data</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Sell Through Data</h3>
          <p className="text-slate-600 mb-6">This page will display and analyze sell-through performance data.</p>
          <div className="text-sm text-slate-500">
            Features to be implemented:
            <ul className="mt-2 space-y-1">
              <li>• View sell-through rates</li>
              <li>• Filter by product and date</li>
              <li>• Compare performance metrics</li>
              <li>• Export data reports</li>
            </ul>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
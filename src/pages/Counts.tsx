import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { BarChart3, Package } from 'lucide-react';

export default function Counts() {
  return (
    <Layout title="Counts">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Product Type Counts</h1>
            <p className="text-slate-600 mt-1">View product counts by type and season</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Product Type Counts</h3>
          <p className="text-slate-600 mb-6">This page will display product counts organized by type and season.</p>
          <div className="text-sm text-slate-500">
            Features to be implemented:
            <ul className="mt-2 space-y-1">
              <li>• View counts by product type</li>
              <li>• Filter by season</li>
              <li>• Export count reports</li>
              <li>• Compare seasonal data</li>
            </ul>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
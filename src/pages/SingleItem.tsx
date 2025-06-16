import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { Edit, DollarSign } from 'lucide-react';

export default function SingleItem() {
  return (
    <Layout title="Single Item">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Single Item Price Adjustment</h1>
            <p className="text-slate-600 mt-1">Adjust prices for individual products</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <Edit className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Single Item Price Adjustment</h3>
          <p className="text-slate-600 mb-6">This page will handle individual product price adjustments.</p>
          <div className="text-sm text-slate-500">
            Features to be implemented:
            <ul className="mt-2 space-y-1">
              <li>• Search for specific products</li>
              <li>• View current pricing</li>
              <li>• Update individual prices</li>
              <li>• Track price history</li>
            </ul>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
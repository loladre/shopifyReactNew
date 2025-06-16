import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { RotateCcw, Package } from 'lucide-react';

export default function NewReturn() {
  return (
    <Layout title="New Return">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">New Return</h1>
            <p className="text-slate-600 mt-1">Create a new product return</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <RotateCcw className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">New Return</h3>
          <p className="text-slate-600 mb-6">This page will handle the creation of new product returns.</p>
          <div className="text-sm text-slate-500">
            Features to be implemented:
            <ul className="mt-2 space-y-1">
              <li>• Select products to return</li>
              <li>• Specify return reasons</li>
              <li>• Calculate return amounts</li>
              <li>• Generate return documentation</li>
            </ul>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
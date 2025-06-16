import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { Image, AlertTriangle } from 'lucide-react';

export default function Pictures() {
  return (
    <Layout title="Pictures">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Pictures</h1>
            <p className="text-slate-600 mt-1">Manage product images and identify missing pictures</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <Image className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Picture Management</h3>
          <p className="text-slate-600 mb-6">This page will help manage product images and identify picture errors.</p>
          <div className="text-sm text-slate-500">
            Features to be implemented:
            <ul className="mt-2 space-y-1">
              <li>• Identify products with missing images</li>
              <li>• Upload product pictures</li>
              <li>• Validate image quality</li>
              <li>• Bulk image operations</li>
            </ul>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { Percent, Package } from 'lucide-react';

export default function BulkDiscount() {
  return (
    <Layout title="Bulk Discount">
      <div className="w-full px-6 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Bulk Discount</h1>
            <p className="text-slate-600 mt-1">Apply discounts to multiple products</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <Percent className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Bulk Discount</h3>
          <p className="text-slate-600 mb-6">This page will handle applying discounts to multiple products at once.</p>
          <div className="text-sm text-slate-500">
            Features to be implemented:
            <ul className="mt-2 space-y-1">
              <li>• Select products for discount</li>
              <li>• Set discount percentages</li>
              <li>• Preview discount effects</li>
              <li>• Apply bulk discounts</li>
            </ul>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
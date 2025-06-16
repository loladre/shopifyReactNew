import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { Sparkles, Package } from 'lucide-react';

export default function NewArrivals() {
  return (
    <Layout title="New Arrivals">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">New Arrivals</h1>
            <p className="text-slate-600 mt-1">Manage and showcase new product arrivals</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <Sparkles className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">New Arrivals</h3>
          <p className="text-slate-600 mb-6">This page will manage and display new product arrivals.</p>
          <div className="text-sm text-slate-500">
            Features to be implemented:
            <ul className="mt-2 space-y-1">
              <li>• List recently arrived products</li>
              <li>• Mark products as new arrivals</li>
              <li>• Set arrival dates</li>
              <li>• Generate arrival reports</li>
            </ul>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { List, RotateCcw } from 'lucide-react';

export default function ReturnList() {
  return (
    <Layout title="Return List">
      <div className="w-full px-6 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Return List</h1>
            <p className="text-slate-600 mt-1">View and manage all product returns</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <List className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Return List</h3>
          <p className="text-slate-600 mb-6">This page will display and manage all product returns.</p>
          <div className="text-sm text-slate-500">
            Features to be implemented:
            <ul className="mt-2 space-y-1">
              <li>• List all returns</li>
              <li>• Filter by status and date</li>
              <li>• View return details</li>
              <li>• Process return approvals</li>
            </ul>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
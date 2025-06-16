import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { AlertTriangle, Clock } from 'lucide-react';

export default function LateOrders() {
  return (
    <Layout title="Late Orders">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Late Orders</h1>
            <p className="text-slate-600 mt-1">Monitor and manage overdue orders</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Late Orders</h3>
          <p className="text-slate-600 mb-6">This page will display orders that are past their expected delivery dates.</p>
          <div className="text-sm text-slate-500">
            Features to be implemented:
            <ul className="mt-2 space-y-1">
              <li>• List overdue orders</li>
              <li>• Sort by days overdue</li>
              <li>• Contact vendors</li>
              <li>• Update delivery dates</li>
            </ul>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
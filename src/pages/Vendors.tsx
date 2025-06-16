import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { Building2, Users } from 'lucide-react';

export default function Vendors() {
  return (
    <Layout title="Vendors">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Vendors</h1>
            <p className="text-slate-600 mt-1">Manage your vendor relationships and information</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Vendors</h3>
          <p className="text-slate-600 mb-6">This page will manage vendor information and relationships.</p>
          <div className="text-sm text-slate-500">
            Features to be implemented:
            <ul className="mt-2 space-y-1">
              <li>• List all vendors</li>
              <li>• Add new vendors</li>
              <li>• Edit vendor details</li>
              <li>• View vendor order history</li>
            </ul>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
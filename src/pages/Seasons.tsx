import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { Calendar, Leaf } from 'lucide-react';

export default function Seasons() {
  return (
    <Layout title="Seasons">
      <div className="w-full px-6 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Seasons</h1>
            <p className="text-slate-600 mt-1">Manage seasonal product collections</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <Leaf className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Seasons</h3>
          <p className="text-slate-600 mb-6">This page will manage seasonal product collections and planning.</p>
          <div className="text-sm text-slate-500">
            Features to be implemented:
            <ul className="mt-2 space-y-1">
              <li>• Create seasonal collections</li>
              <li>• Manage season dates</li>
              <li>• View seasonal performance</li>
              <li>• Plan upcoming seasons</li>
            </ul>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
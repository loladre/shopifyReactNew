import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { Bell, Calendar } from 'lucide-react';

export default function Reminders() {
  return (
    <Layout title="Reminders">
      <div className="w-full px-6 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Reminders</h1>
            <p className="text-slate-600 mt-1">Manage payment and delivery reminders</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <Bell className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Reminders</h3>
          <p className="text-slate-600 mb-6">This page will manage automated reminders for payments and deliveries.</p>
          <div className="text-sm text-slate-500">
            Features to be implemented:
            <ul className="mt-2 space-y-1">
              <li>• Set payment reminders</li>
              <li>• Schedule delivery follow-ups</li>
              <li>• View upcoming reminders</li>
              <li>• Configure reminder settings</li>
            </ul>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
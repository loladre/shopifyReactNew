import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { BarChart3, ShoppingCart, Package, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function Dashboard() {
  return (
    <Layout title="Dashboard">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1">Welcome to your order management system</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Orders</p>
                <p className="text-2xl font-bold text-blue-900">1,234</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Products</p>
                <p className="text-2xl font-bold text-green-900">5,678</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Revenue</p>
                <p className="text-2xl font-bold text-purple-900">$89,012</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Growth</p>
                <p className="text-2xl font-bold text-orange-900">+12.5%</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">New purchase order created</span>
                <span className="text-sm text-slate-500">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Order #1234 published</span>
                <span className="text-sm text-slate-500">4 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Vendor payment processed</span>
                <span className="text-sm text-slate-500">1 day ago</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-colors duration-200">
                <div className="font-medium text-slate-900">Create New Purchase Order</div>
                <div className="text-sm text-slate-600">Start a new order from Excel import</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-colors duration-200">
                <div className="font-medium text-slate-900">View Draft Orders</div>
                <div className="text-sm text-slate-600">Review and manage draft orders</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-colors duration-200">
                <div className="font-medium text-slate-900">Check Late Orders</div>
                <div className="text-sm text-slate-600">Monitor overdue deliveries</div>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
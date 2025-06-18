import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusCard from '../components/ui/StatusCard';
import ServerMessagePanel from '../components/ui/ServerMessagePanel';
import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Users, 
  DollarSign,
  AlertTriangle,
  Clock,
  Calendar,
  Building2,
  Hash,
  Bell,
  Sparkles,
  CheckCircle,
  Eye,
  ExternalLink,
  Leaf,
  RefreshCw,
  Activity,
  Target,
  Zap,
  Plus,
  Percent
} from 'lucide-react';

interface PaymentReminder {
  vendor: string;
  vendorAmountToPayDate: string;
  vendorAmountToPay: number;
  vendorAmoutToPayDescription: string;
  vendorAmountToPayMethod: string;
  urgency: 'overdue' | 'urgent' | 'upcoming' | 'normal';
}

interface LateOrder {
  purchaseOrderID: string;
  brand: string;
  brandPoNumber: string;
  purchaseOrderSeason: string;
  startShipDate: string;
  completedDate: string;
  totalVariantQuantity: number;
  totalVariantReceivedQuantity: number;
  purchaseOrderCompleteReceive: boolean;
  purchaseOrderTotalItemsCost: number;
  progress: number;
  urgency: 'critical' | 'warning' | 'normal';
}

interface NewArrival {
  brand: string;
  title: string;
  price: number;
  url?: string;
}

interface SeasonProgress {
  season: string;
  totalOrdered: number;
  totalReceived: number;
  totalValue: number;
  progress: number;
  brands: number;
}

interface DashboardStats {
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  growthRate: number;
  lateOrdersCount: number;
  urgentRemindersCount: number;
  newArrivalsCount: number;
  completionRate: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  
  // State
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    growthRate: 0,
    lateOrdersCount: 0,
    urgentRemindersCount: 0,
    newArrivalsCount: 0,
    completionRate: 0,
  });
  
  const [paymentReminders, setPaymentReminders] = useState<PaymentReminder[]>([]);
  const [lateOrders, setLateOrders] = useState<LateOrder[]>([]);
  const [newArrivals, setNewArrivals] = useState<NewArrival[]>([]);
  const [seasonProgress, setSeasonProgress] = useState<SeasonProgress[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      await Promise.all([
        fetchPaymentReminders(),
        fetchLateOrders(),
        fetchNewArrivals(),
        fetchSeasonProgress(),
      ]);
      
      setLastUpdated(new Date());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentReminders = async () => {
    try {
      const token = localStorage.getItem('bridesbyldToken');
      
      if (!token) {
        navigate('/');
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://hushloladre.com';
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || '';
      
      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/paymentReminders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment reminders');
      }

      const data = await response.json();
      
      // Flatten and filter today's reminders
      const todayReminders: PaymentReminder[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      data.forEach((vendorData: any) => {
        vendorData.paymentReminders.forEach((reminder: any) => {
          const dueDate = new Date(reminder.vendorAmountToPayDate);
          const timeDiff = (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
          
          let urgency: PaymentReminder['urgency'] = 'normal';
          if (timeDiff < -3) urgency = 'overdue';
          else if (timeDiff <= 2 && timeDiff >= -3) urgency = 'urgent';
          else if (timeDiff <= 7) urgency = 'upcoming';
          
          // Only include urgent and overdue for dashboard
          if (urgency === 'overdue' || urgency === 'urgent') {
            todayReminders.push({
              vendor: vendorData.vendor,
              vendorAmountToPayDate: reminder.vendorAmountToPayDate,
              vendorAmountToPay: reminder.vendorAmountToPay,
              vendorAmoutToPayDescription: reminder.vendorAmoutToPayDescription,
              vendorAmountToPayMethod: reminder.vendorAmountToPayMethod,
              urgency,
            });
          }
        });
      });
      
      setPaymentReminders(todayReminders);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        urgentRemindersCount: todayReminders.length,
      }));
      
    } catch (err) {
      console.error('Failed to fetch payment reminders:', err);
    }
  };

  const fetchLateOrders = async () => {
    try {
      const token = localStorage.getItem('bridesbyldToken');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://hushloladre.com';
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || '';
      
      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/getLateOrders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch late orders');
      }

      const data = await response.json();
      
      const processedOrders = data.map((order: any) => {
        const today = new Date();
        const startShipDate = new Date(order.startShipDate);
        const completeShipDate = new Date(order.completedDate);
        const startTimeLead = (startShipDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
        const completeTimeLead = (completeShipDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
        const percentageReceived = order.totalVariantReceivedQuantity / order.totalVariantQuantity;
        
        let urgency: LateOrder['urgency'] = 'normal';
        if (percentageReceived < 1) {
          if (startTimeLead < 0 && completeTimeLead < 0) {
            urgency = 'critical';
          } else if (startTimeLead <= 7 || completeTimeLead <= 14) {
            urgency = 'warning';
          }
        }
        
        return {
          ...order,
          progress: percentageReceived * 100,
          urgency,
        };
      });
      
      setLateOrders(processedOrders);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        lateOrdersCount: processedOrders.length,
      }));
      
    } catch (err) {
      console.error('Failed to fetch late orders:', err);
    }
  };

  const fetchNewArrivals = async () => {
    try {
      const token = localStorage.getItem('bridesbyldToken');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://hushloladre.com';
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || '';
      
      // Get last 7 days
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      
      const formatDate = (date: Date): string => {
        return date.toISOString().split('T')[0];
      };
      
      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/products-in-date-range`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          startDate: formatDate(sevenDaysAgo), 
          endDate: formatDate(today) 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch new arrivals');
      }

      const data = await response.json();
      
      // Flatten arrivals
      const arrivals: NewArrival[] = [];
      data.forEach((brandData: any) => {
        brandData.products.forEach((product: any) => {
          arrivals.push({
            brand: brandData.brand,
            title: product.title,
            price: product.price,
            url: product.url,
          });
        });
      });
      
      setNewArrivals(arrivals);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        newArrivalsCount: arrivals.length,
      }));
      
    } catch (err) {
      console.error('Failed to fetch new arrivals:', err);
    }
  };

  const fetchSeasonProgress = async () => {
    try {
      // This would typically fetch season data from multiple endpoints
      // For now, we'll create mock data based on the structure
      const mockSeasonData: SeasonProgress[] = [
        {
          season: 'Resort26',
          totalOrdered: 1250,
          totalReceived: 980,
          totalValue: 125000,
          progress: 78.4,
          brands: 12,
        },
        {
          season: 'Spring26',
          totalOrdered: 890,
          totalReceived: 650,
          totalValue: 89000,
          progress: 73.0,
          brands: 8,
        },
        {
          season: 'Summer26',
          totalOrdered: 1100,
          totalReceived: 450,
          totalValue: 110000,
          progress: 40.9,
          brands: 10,
        },
        {
          season: 'Fall26',
          totalOrdered: 750,
          totalReceived: 120,
          totalValue: 75000,
          progress: 16.0,
          brands: 6,
        },
      ];
      
      setSeasonProgress(mockSeasonData);
      
      // Calculate overall stats
      const totalOrders = mockSeasonData.reduce((sum, season) => sum + season.totalOrdered, 0);
      const totalReceived = mockSeasonData.reduce((sum, season) => sum + season.totalReceived, 0);
      const totalValue = mockSeasonData.reduce((sum, season) => sum + season.totalValue, 0);
      const overallProgress = totalOrders > 0 ? (totalReceived / totalOrders) * 100 : 0;
      
      setStats(prev => ({
        ...prev,
        totalOrders: totalOrders,
        totalProducts: totalReceived,
        totalRevenue: totalValue,
        completionRate: overallProgress,
        growthRate: 12.5, // Mock growth rate
      }));
      
    } catch (err) {
      console.error('Failed to fetch season progress:', err);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'overdue':
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Payment Reminders columns
  const reminderColumns: Column[] = [
    {
      key: 'vendor',
      header: 'Brand',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'vendorAmountToPayDate',
      header: 'Payment Date',
      render: (value, reminder) => (
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className={`px-2 py-1 rounded border text-sm font-medium ${getUrgencyColor(reminder.urgency)}`}>
            {formatDate(value)}
          </span>
        </div>
      )
    },
    {
      key: 'vendorAmountToPay',
      header: 'Amount',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-slate-400" />
          <span className="font-semibold">{formatCurrency(value)}</span>
        </div>
      ),
      className: 'text-right'
    },
    {
      key: 'vendorAmountToPayMethod',
      header: 'Method',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value === 'Wire' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, reminder) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/vendors?brand=${encodeURIComponent(reminder.vendor)}`)}
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
      )
    }
  ];

  // Late Orders columns
  const lateOrderColumns: Column[] = [
    {
      key: 'purchaseOrderID',
      header: 'Order ID',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Hash className="w-4 h-4 text-slate-400" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'brand',
      header: 'Brand',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'purchaseOrderSeason',
      header: 'Season',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Leaf className="w-4 h-4 text-slate-400" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'startShipDate',
      header: 'Start Ship',
      render: (value, order) => (
        <span className={`px-2 py-1 rounded text-sm ${getUrgencyColor(order.urgency)}`}>
          {formatDate(value)}
        </span>
      )
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (value) => (
        <div className="w-24">
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-600 w-8">
              {Math.round(value)}%
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'purchaseOrderTotalItemsCost',
      header: 'Cost',
      render: (value) => formatCurrency(value),
      className: 'text-right'
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, order) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/published-order-detail?orderId=${order.purchaseOrderID}`)}
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
      )
    }
  ];

  // New Arrivals columns
  const arrivalColumns: Column[] = [
    {
      key: 'brand',
      header: 'Brand',
      render: (value, _, index) => {
        // Group by brand logic
        const prevItem = index > 0 ? newArrivals[index - 1] : null;
        const isFirstOfBrand = !prevItem || prevItem.brand !== value;
        
        return (
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className={isFirstOfBrand ? 'font-bold' : 'text-transparent'}>
              {isFirstOfBrand ? value : ''}
            </span>
          </div>
        );
      }
    },
    {
      key: 'title',
      header: 'Style Name',
      render: (value, arrival) => (
        arrival.url ? (
          <a
            href={arrival.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-800 font-medium flex items-center space-x-1"
          >
            <span>{value}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="font-medium">{value}</span>
        )
      )
    },
    {
      key: 'price',
      header: 'Price',
      render: (value) => formatCurrency(value),
      className: 'text-right'
    }
  ];

  return (
    <Layout title="Dashboard">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1">
              Welcome to your order management system
              <span className="text-slate-400 ml-2">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </p>
          </div>
          <Button onClick={loadDashboardData} isLoading={isLoading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatusCard
                title="Total Orders"
                value={stats.totalOrders.toLocaleString()}
                icon={ShoppingCart}
                color="blue"
              />
              <StatusCard
                title="Products Received"
                value={stats.totalProducts.toLocaleString()}
                icon={Package}
                color="green"
              />
              <StatusCard
                title="Revenue"
                value={formatCurrency(stats.totalRevenue)}
                icon={DollarSign}
                color="purple"
              />
              <StatusCard
                title="Growth"
                value={`+${stats.growthRate}%`}
                icon={TrendingUp}
                color="orange"
              />
            </div>

            {/* Alert Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-red-200 bg-red-50">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-red-600 text-sm font-medium">Late Orders</p>
                    <p className="text-2xl font-bold text-red-900">{stats.lateOrdersCount}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="border-yellow-200 bg-yellow-50">
                <div className="flex items-center space-x-3">
                  <Bell className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="text-yellow-600 text-sm font-medium">Payment Alerts</p>
                    <p className="text-2xl font-bold text-yellow-900">{stats.urgentRemindersCount}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="border-green-200 bg-green-50">
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-green-600 text-sm font-medium">New Arrivals (7d)</p>
                    <p className="text-2xl font-bold text-green-900">{stats.newArrivalsCount}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Payment Reminders and Late Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card padding="none">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                      <Bell className="w-5 h-5 mr-2 text-red-500" />
                      Urgent Payment Reminders
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/reminders')}
                    >
                      View All
                    </Button>
                  </div>
                </div>
                {paymentReminders.length > 0 ? (
                  <DataTable
                    columns={reminderColumns}
                    data={paymentReminders.slice(0, 5)}
                    emptyMessage="No urgent payment reminders"
                  />
                ) : (
                  <div className="p-6 text-center text-slate-500">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p>No urgent payment reminders</p>
                  </div>
                )}
              </Card>

              <Card padding="none">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                      Late Orders
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/late-orders')}
                    >
                      View All
                    </Button>
                  </div>
                </div>
                {lateOrders.length > 0 ? (
                  <DataTable
                    columns={lateOrderColumns}
                    data={lateOrders.slice(0, 5)}
                    emptyMessage="No late orders"
                  />
                ) : (
                  <div className="p-6 text-center text-slate-500">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p>No late orders</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Season Progress and New Arrivals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
                      Season Progress
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/seasons')}
                    >
                      View Details
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {seasonProgress.map((season, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-900">{season.season}</span>
                          <span className="text-sm text-slate-600">
                            {season.totalReceived}/{season.totalOrdered} ({Math.round(season.progress)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${season.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>{season.brands} brands</span>
                          <span>{formatCurrency(season.totalValue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card padding="none">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-green-500" />
                      New Arrivals (Last 7 Days)
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/new-arrivals')}
                    >
                      View All
                    </Button>
                  </div>
                </div>
                {newArrivals.length > 0 ? (
                  <DataTable
                    columns={arrivalColumns}
                    data={newArrivals.slice(0, 8).map((arrival, index) => ({ ...arrival, index }))}
                    emptyMessage="No new arrivals in the last 7 days"
                  />
                ) : (
                  <div className="p-6 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p>No new arrivals in the last 7 days</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-500" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate('/purchase-order')}
                    className="p-4 text-left border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Plus className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">New Purchase Order</div>
                        <div className="text-sm text-slate-600">Create from Excel import</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/draft-orders')}
                    className="p-4 text-left border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Eye className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">View Draft Orders</div>
                        <div className="text-sm text-slate-600">Review and manage drafts</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/bulk-discount')}
                    className="p-4 text-left border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Percent className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">Bulk Discount</div>
                        <div className="text-sm text-slate-600">Apply discounts to products</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/vendors')}
                    className="p-4 text-left border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">Manage Vendors</div>
                        <div className="text-sm text-slate-600">View vendor relationships</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/new-arrivals')}
                    className="p-4 text-left border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">New Arrivals</div>
                        <div className="text-sm text-slate-600">View recent products</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/counts')}
                    className="p-4 text-left border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">Product Counts</div>
                        <div className="text-sm text-slate-600">Analyze product data</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-slate-500" />
                  Recent Activity
                </h3>
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
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-600">Bulk discount applied to 45 products</span>
                    <span className="text-sm text-slate-500">2 days ago</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Performance Overview */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-purple-500" />
                  Performance Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{Math.round(stats.completionRate)}%</div>
                    <div className="text-sm text-slate-600">Overall Completion Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.urgentRemindersCount}</div>
                    <div className="text-sm text-slate-600">Urgent Payment Alerts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{stats.lateOrdersCount}</div>
                    <div className="text-sm text-slate-600">Late Orders</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Server Messages Panel */}
          <div className="lg:col-span-1">
            <ServerMessagePanel className="h-[600px]" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
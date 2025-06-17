import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusCard from '../components/ui/StatusCard';
import ServerMessagePanel from '../components/ui/ServerMessagePanel';
import { 
  Bell, 
  Calendar, 
  DollarSign, 
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Eye,
  Filter
} from 'lucide-react';

interface PaymentReminder {
  vendor: string;
  vendorAmountToPayDate: string;
  vendorAmountToPay: number;
  vendorAmoutToPayDescription: string;
  vendorAmountToPayMethod: string;
}

interface VendorReminders {
  vendor: string;
  paymentReminders: PaymentReminder[];
}

export default function Reminders() {
  const [allReminders, setAllReminders] = useState<PaymentReminder[]>([]);
  const [filteredReminders, setFilteredReminders] = useState<PaymentReminder[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>('All Vendors');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPaymentReminders();
  }, []);

  useEffect(() => {
    filterReminders();
  }, [selectedVendor, selectedUrgency, allReminders]);

  const fetchPaymentReminders = async () => {
    try {
      setIsLoading(true);
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

      const data: VendorReminders[] = await response.json();
      
      // Flatten the reminders and add vendor info
      const flattenedReminders: PaymentReminder[] = [];
      const vendorList: string[] = [];
      
      data.forEach(vendorData => {
        vendorList.push(vendorData.vendor);
        vendorData.paymentReminders.forEach(reminder => {
          flattenedReminders.push({
            ...reminder,
            vendor: vendorData.vendor
          });
        });
      });
      
      setAllReminders(flattenedReminders);
      setVendors(vendorList.sort());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const filterReminders = () => {
    let filtered = allReminders;

    // Filter by vendor
    if (selectedVendor !== 'All Vendors') {
      filtered = filtered.filter(reminder => reminder.vendor === selectedVendor);
    }

    // Filter by urgency
    if (selectedUrgency !== 'All') {
      filtered = filtered.filter(reminder => {
        const urgency = getDateUrgency(reminder.vendorAmountToPayDate);
        return urgency === selectedUrgency;
      });
    }

    setFilteredReminders(filtered);
  };

  const getDateUrgency = (dateString: string): 'overdue' | 'urgent' | 'upcoming' | 'normal' => {
    const today = new Date();
    const date = new Date(dateString);
    const timeDiff = (date.getTime() - today.getTime()) / (1000 * 3600 * 24);
    
    if (timeDiff < -3) return 'overdue';
    if (timeDiff <= 2 && timeDiff >= -3) return 'urgent';
    if (timeDiff <= 7) return 'upcoming';
    return 'normal';
  };

  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'urgent':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'upcoming':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-slate-600" />;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleRowClick = (reminder: PaymentReminder) => {
    // Navigate to vendor page with the specific brand
    navigate(`/vendors?brand=${encodeURIComponent(reminder.vendor)}`);
  };

  const columns: Column[] = [
    {
      key: 'vendor',
      header: 'Brand',
      sortable: true,
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
      sortable: true,
      render: (value, reminder) => {
        const urgency = getDateUrgency(value);
        const urgencyColor = getUrgencyColor(urgency);
        
        return (
          <div className="flex items-center space-x-2">
            {getUrgencyIcon(urgency)}
            <span className={`px-2 py-1 rounded border text-sm font-medium ${urgencyColor}`}>
              {formatDate(value)}
            </span>
          </div>
        );
      }
    },
    {
      key: 'vendorAmountToPay',
      header: 'Amount',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-slate-400" />
          <span className="font-semibold">{formatCurrency(value)}</span>
        </div>
      ),
      className: 'text-right'
    },
    {
      key: 'vendorAmoutToPayDescription',
      header: 'Description',
      sortable: true,
      render: (value) => (
        <span className="text-slate-700">{value || '-'}</span>
      )
    },
    {
      key: 'vendorAmountToPayMethod',
      header: 'Method',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value === 'Wire' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'urgency',
      header: 'Urgency',
      render: (_, reminder) => {
        const urgency = getDateUrgency(reminder.vendorAmountToPayDate);
        const urgencyColor = getUrgencyColor(urgency);
        
        return (
          <div className="flex items-center space-x-2">
            {getUrgencyIcon(urgency)}
            <span className={`px-2 py-1 rounded border text-xs font-medium capitalize ${urgencyColor}`}>
              {urgency}
            </span>
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, reminder) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(reminder);
          }}
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
      )
    }
  ];

  // Calculate summary statistics
  const totalReminders = filteredReminders.length;
  const totalAmount = filteredReminders.reduce((sum, reminder) => sum + reminder.vendorAmountToPay, 0);
  
  const overdueReminders = filteredReminders.filter(reminder => 
    getDateUrgency(reminder.vendorAmountToPayDate) === 'overdue'
  ).length;
  
  const urgentReminders = filteredReminders.filter(reminder => 
    getDateUrgency(reminder.vendorAmountToPayDate) === 'urgent'
  ).length;
  
  const upcomingReminders = filteredReminders.filter(reminder => 
    getDateUrgency(reminder.vendorAmountToPayDate) === 'upcoming'
  ).length;

  if (error) {
    return (
      <Layout title="Payment Reminders">
        <div className="w-full px-6 py-6">
          <Card className="text-center py-12">
            <Bell className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Reminders</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={fetchPaymentReminders}>Try Again</Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Payment Reminders">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Payment Reminders</h1>
            <p className="text-slate-600 mt-1">Monitor and manage all vendor payment reminders</p>
          </div>
          <Button onClick={fetchPaymentReminders} isLoading={isLoading}>
            Refresh Reminders
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusCard
                title="Total Reminders"
                value={totalReminders}
                icon={Bell}
                color="blue"
              />
              <StatusCard
                title="Overdue"
                value={overdueReminders}
                icon={AlertTriangle}
                color="red"
              />
              <StatusCard
                title="Urgent (≤2 days)"
                value={urgentReminders}
                icon={Clock}
                color="orange"
              />
              <StatusCard
                title="Total Amount"
                value={formatCurrency(totalAmount)}
                icon={DollarSign}
                color="green"
              />
            </div>

            {/* Urgency Legend */}
            <Card>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  Urgency Legend
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="px-2 py-1 rounded border bg-red-100 text-red-800 border-red-200 text-xs font-medium">
                      Overdue (>3 days late)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="px-2 py-1 rounded border bg-yellow-100 text-yellow-800 border-yellow-200 text-xs font-medium">
                      Urgent (≤2 days)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="px-2 py-1 rounded border bg-blue-100 text-blue-800 border-blue-200 text-xs font-medium">
                      Upcoming (≤7 days)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-slate-600" />
                    <span className="px-2 py-1 rounded border bg-slate-100 text-slate-800 border-slate-200 text-xs font-medium">
                      Normal (>7 days)
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Filters */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">Filter Reminders</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="vendorSelect" className="block text-xs font-medium text-slate-600 mb-1">
                      Filter by Vendor:
                    </label>
                    <select
                      id="vendorSelect"
                      value={selectedVendor}
                      onChange={(e) => setSelectedVendor(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="All Vendors">All Vendors</option>
                      {vendors.map(vendor => (
                        <option key={vendor} value={vendor}>{vendor}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="urgencySelect" className="block text-xs font-medium text-slate-600 mb-1">
                      Filter by Urgency:
                    </label>
                    <select
                      id="urgencySelect"
                      value={selectedUrgency}
                      onChange={(e) => setSelectedUrgency(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="All">All Urgencies</option>
                      <option value="overdue">Overdue</option>
                      <option value="urgent">Urgent</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="normal">Normal</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            {filteredReminders.length > 0 && (
              <Card>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-red-600">{overdueReminders}</div>
                    <div className="text-sm text-slate-600">Overdue</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-yellow-600">{urgentReminders}</div>
                    <div className="text-sm text-slate-600">Urgent</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-blue-600">{upcomingReminders}</div>
                    <div className="text-sm text-slate-600">Upcoming</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</div>
                    <div className="text-sm text-slate-600">Total Amount</div>
                  </div>
                </div>
              </Card>
            )}

            {/* Reminders Table */}
            <DataTable
              columns={columns}
              data={filteredReminders}
              onRowClick={handleRowClick}
              emptyMessage={isLoading ? "Loading reminders..." : "No payment reminders found"}
            />
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
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusCard from '../components/ui/StatusCard';
import ServerMessagePanel from '../components/ui/ServerMessagePanel';
import Button from '../components/ui/Button';
import { 
  AlertTriangle, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Calendar,
  Building2,
  Hash,
  StickyNote,
  TrendingUp,
  Clock,
  Leaf
} from 'lucide-react';

interface LateOrder {
  purchaseOrderID: string;
  brand: string;
  brandPoNumber: string;
  purchaseOrderSeason: string;
  createdDate: string;
  startShipDate: string;
  completedDate: string;
  totalProductQuantity: number;
  totalVariantQuantity: number;
  totalVariantReceivedQuantity: number;
  purchaseOrderCompleteReceive: boolean;
  purchaseOrderNotes: string;
  purchaseOrderTotalItemsCost: number;
}

export default function LateOrders() {
  const [orders, setOrders] = useState<LateOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<LateOrder[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('All Brands');
  const [selectedSeason, setSelectedSeason] = useState<string>('All Seasons');
  const [brands, setBrands] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLateOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [selectedBrand, selectedSeason, orders]);

  const fetchLateOrders = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('bridesbyldToken');
      
      if (!token) {
        navigate('/');
        return;
      }

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

      const data: LateOrder[] = await response.json();
      setOrders(data);
      
      // Extract unique brands and seasons
      const uniqueBrands = Array.from(new Set(data.map(order => order.brand))).sort();
      const uniqueSeasons = Array.from(new Set(data.map(order => order.purchaseOrderSeason).filter(Boolean))).sort();
      
      setBrands(uniqueBrands);
      setSeasons(uniqueSeasons);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by brand
    if (selectedBrand !== 'All Brands') {
      filtered = filtered.filter(order => order.brand === selectedBrand);
    }

    // Filter by season
    if (selectedSeason !== 'All Seasons') {
      filtered = filtered.filter(order => order.purchaseOrderSeason === selectedSeason);
    }

    setFilteredOrders(filtered);
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

  const calculateProgress = (order: LateOrder): number => {
    if (order.purchaseOrderCompleteReceive) {
      return 100;
    }
    return order.totalVariantQuantity > 0 
      ? (order.totalVariantReceivedQuantity / order.totalVariantQuantity) * 100 
      : 0;
  };

  const getDateStatus = (dateString: string, isStartShip: boolean = false): 'normal' | 'warning' | 'danger' => {
    const today = new Date();
    const date = new Date(dateString);
    const timeDiff = (date.getTime() - today.getTime()) / (1000 * 3600 * 24);
    
    if (isStartShip) {
      if (timeDiff >= 0 && timeDiff <= 7) return 'warning';
      if (timeDiff < 0) return 'danger';
    } else {
      // Complete ship date
      if (timeDiff >= 0 && timeDiff <= 14) return 'warning';
      if (timeDiff < 0) return 'danger';
    }
    
    return 'normal';
  };

  const renderDateCell = (dateString: string, isStartShip: boolean = false) => {
    const status = getDateStatus(dateString, isStartShip);
    const baseClasses = "px-2 py-1 rounded text-sm";
    
    let statusClasses = "";
    switch (status) {
      case 'warning':
        statusClasses = "bg-yellow-100 text-yellow-800";
        break;
      case 'danger':
        statusClasses = "bg-red-100 text-red-800";
        break;
      default:
        statusClasses = "";
    }
    
    return (
      <span className={status !== 'normal' ? `${baseClasses} ${statusClasses}` : ''}>
        {formatDate(dateString)}
      </span>
    );
  };

  const handleRowClick = (order: LateOrder) => {
    // Navigate to published order detail page with URL parameter
    navigate(`/published-order-detail?orderId=${order.purchaseOrderID}`);
  };

  const columns: Column[] = [
    {
      key: 'purchaseOrderID',
      header: 'Order ID',
      sortable: true,
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
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'brandPoNumber',
      header: 'Brand PO Number',
      sortable: true,
    },
    {
      key: 'purchaseOrderSeason',
      header: 'Season',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Leaf className="w-4 h-4 text-slate-400" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'createdDate',
      header: 'Created',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{formatDate(value)}</span>
        </div>
      )
    },
    {
      key: 'startShipDate',
      header: 'Start Ship',
      sortable: true,
      render: (value, order) => {
        const percentageReceived = order.totalVariantReceivedQuantity / order.totalVariantQuantity;
        // Only show warning/danger colors if not fully received
        if (percentageReceived < 1) {
          return renderDateCell(value, true);
        }
        return formatDate(value);
      }
    },
    {
      key: 'completedDate',
      header: 'Complete',
      sortable: true,
      render: (value, order) => {
        const percentageReceived = order.totalVariantReceivedQuantity / order.totalVariantQuantity;
        const startShipStatus = getDateStatus(order.startShipDate, true);
        
        // Only show warning/danger colors if not fully received and start ship is late
        if (percentageReceived < 1 && startShipStatus === 'danger') {
          return renderDateCell(value, false);
        }
        return formatDate(value);
      }
    },
    {
      key: 'totalProductQuantity',
      header: 'Products',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4 text-slate-400" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'totalVariantQuantity',
      header: 'Variants',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <ShoppingCart className="w-4 h-4 text-slate-400" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'totalVariantReceivedQuantity',
      header: 'Received',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4 text-green-500" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (_, order) => {
        const progress = calculateProgress(order);
        return (
          <div className="w-24">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-600 w-8">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'purchaseOrderNotes',
      header: 'Notes',
      render: (value) => (
        <div className="flex items-center space-x-2 max-w-xs">
          <StickyNote className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="truncate" title={value}>{value || '-'}</span>
        </div>
      )
    },
    {
      key: 'purchaseOrderTotalItemsCost',
      header: 'Items Cost',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-slate-400" />
          <span className="font-semibold">{formatCurrency(value)}</span>
        </div>
      )
    }
  ];

  // Calculate summary statistics
  const totalOrders = filteredOrders.length;
  const totalProducts = filteredOrders.reduce((sum, order) => sum + order.totalProductQuantity, 0);
  const totalVariants = filteredOrders.reduce((sum, order) => sum + order.totalVariantQuantity, 0);
  const totalReceived = filteredOrders.reduce((sum, order) => sum + order.totalVariantReceivedQuantity, 0);
  const totalCost = filteredOrders.reduce((sum, order) => sum + order.purchaseOrderTotalItemsCost, 0);
  const overallProgress = totalVariants > 0 ? (totalReceived / totalVariants) * 100 : 0;

  // Calculate late orders statistics
  const criticallyLateOrders = filteredOrders.filter(order => {
    const percentageReceived = order.totalVariantReceivedQuantity / order.totalVariantQuantity;
    const startShipStatus = getDateStatus(order.startShipDate, true);
    const completeStatus = getDateStatus(order.completedDate, false);
    return percentageReceived < 1 && (startShipStatus === 'danger' || completeStatus === 'danger');
  }).length;

  if (error) {
    return (
      <Layout title="Late Orders">
        <div className="w-full px-6 py-6">
          <Card className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Late Orders</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={fetchLateOrders}>Try Again</Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Late Orders">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Late Purchase Orders</h1>
            <p className="text-slate-600 mt-1">Monitor and manage overdue orders</p>
          </div>
          <Button onClick={fetchLateOrders} isLoading={isLoading}>
            Refresh Orders
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusCard
                title="Late Orders"
                value={totalOrders}
                icon={AlertTriangle}
                color="red"
              />
              <StatusCard
                title="Critically Late"
                value={criticallyLateOrders}
                icon={Clock}
                color="red"
              />
              <StatusCard
                title="Overall Progress"
                value={`${Math.round(overallProgress)}%`}
                icon={TrendingUp}
                color="orange"
              />
              <StatusCard
                title="Total Cost"
                value={formatCurrency(totalCost)}
                icon={DollarSign}
                color="slate"
              />
            </div>

            {/* Legend */}
            <Card>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Date Status Legend</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
                    <span>Start Ship: 0-7 days | Complete: 0-14 days</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                    <span>Overdue (past due date)</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Filters */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">Filter Orders</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="brandSelect" className="block text-xs font-medium text-slate-600 mb-1">
                      Filter by Brand:
                    </label>
                    <select
                      id="brandSelect"
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="All Brands">All Brands</option>
                      {brands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="seasonSelect" className="block text-xs font-medium text-slate-600 mb-1">
                      Filter by Season:
                    </label>
                    <select
                      id="seasonSelect"
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="All Seasons">All Seasons</option>
                      {seasons.map(season => (
                        <option key={season} value={season}>{season}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Orders Table */}
            <DataTable
              columns={columns}
              data={filteredOrders}
              onRowClick={handleRowClick}
              emptyMessage={isLoading ? "Loading late orders..." : "No late orders found"}
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
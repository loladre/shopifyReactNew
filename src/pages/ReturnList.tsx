import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusCard from '../components/ui/StatusCard';
import ServerMessagePanel from '../components/ui/ServerMessagePanel';
import { 
  List, 
  RotateCcw, 
  Building2,
  Calendar,
  DollarSign,
  Package,
  ShoppingCart,
  Hash,
  StickyNote,
  Eye,
  Filter,
  Plus,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface ReturnOrder {
  purchaseOrderID: string;
  brand: string;
  createdDate: string;
  totalVariantQuantity: number;
  purchaseOrderNotes: string;
  purchaseOrderTotalItemsCost: number;
}

export default function ReturnList() {
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<ReturnOrder[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('All Brands');
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchReturnOrders();
  }, []);

  useEffect(() => {
    filterReturnsByBrand();
  }, [selectedBrand, returns]);

  const fetchReturnOrders = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('bridesbyldToken');
      
      if (!token) {
        navigate('/');
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://hushloladre.com';
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || '';
      
      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/returnOrdersSummary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch return orders');
      }

      const data: ReturnOrder[] = await response.json();
      setReturns(data);
      
      // Extract unique brands
      const uniqueBrands = Array.from(new Set(data.map(returnOrder => returnOrder.brand))).sort();
      setBrands(uniqueBrands);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const filterReturnsByBrand = () => {
    if (selectedBrand === 'All Brands') {
      setFilteredReturns(returns);
    } else {
      setFilteredReturns(returns.filter(returnOrder => returnOrder.brand === selectedBrand));
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

  const handleRowClick = (returnOrder: ReturnOrder) => {
    // Navigate to return detail page (to be implemented)
    // For now, we'll use a placeholder URL structure
    navigate(`/return-detail?orderId=${returnOrder.purchaseOrderID}`);
  };

  const handleCreateNewReturn = () => {
    navigate('/new-return');
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
      key: 'totalVariantQuantity',
      header: 'Variants QTY',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <ShoppingCart className="w-4 h-4 text-slate-400" />
          <span>{value}</span>
        </div>
      ),
      className: 'text-center'
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
      ),
      className: 'text-right'
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, returnOrder) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(returnOrder);
          }}
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
      ),
      className: 'text-center'
    }
  ];

  // Calculate summary statistics
  const totalReturns = filteredReturns.length;
  const totalVariants = filteredReturns.reduce((sum, returnOrder) => sum + returnOrder.totalVariantQuantity, 0);
  const totalCost = filteredReturns.reduce((sum, returnOrder) => sum + returnOrder.purchaseOrderTotalItemsCost, 0);
  const averageCost = totalReturns > 0 ? totalCost / totalReturns : 0;

  // Get recent returns (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentReturns = filteredReturns.filter(returnOrder => 
    new Date(returnOrder.createdDate) >= thirtyDaysAgo
  ).length;

  if (error) {
    return (
      <Layout title="Return List">
        <div className="w-full px-6 py-6">
          <Card className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Returns</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={fetchReturnOrders}>Try Again</Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Return List">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Returns List</h1>
            <p className="text-slate-600 mt-1">View and manage all product returns</p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={fetchReturnOrders} isLoading={isLoading} variant="outline">
              Refresh Returns
            </Button>
            <Button onClick={handleCreateNewReturn}>
              <Plus className="w-4 h-4 mr-2" />
              New Return
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusCard
                title="Total Returns"
                value={totalReturns}
                icon={List}
                color="blue"
              />
              <StatusCard
                title="Recent Returns"
                value={recentReturns}
                icon={TrendingUp}
                color="green"
              />
              <StatusCard
                title="Total Variants"
                value={totalVariants.toLocaleString()}
                icon={ShoppingCart}
                color="purple"
              />
              <StatusCard
                title="Total Value"
                value={formatCurrency(totalCost)}
                icon={DollarSign}
                color="orange"
              />
            </div>

            {/* Brand Filter */}
            <Card>
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-slate-400" />
                <label htmlFor="brandSelect" className="text-sm font-semibold text-slate-700">
                  Filter by Brand:
                </label>
                <select
                  id="brandSelect"
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="All Brands">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
            </Card>

            {/* Summary Information */}
            {filteredReturns.length > 0 && (
              <Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <List className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold text-slate-900">Return Summary</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>Showing {filteredReturns.length} returns</p>
                      <p>Filter: {selectedBrand}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Package className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-slate-900">Quantities</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>Total Variants: {totalVariants.toLocaleString()}</p>
                      <p>Avg per Return: {totalReturns > 0 ? (totalVariants / totalReturns).toFixed(1) : '0'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-orange-500" />
                      <span className="font-semibold text-slate-900">Values</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>Total Value: {formatCurrency(totalCost)}</p>
                      <p>Avg Value: {formatCurrency(averageCost)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Returns Table */}
            <DataTable
              columns={columns}
              data={filteredReturns}
              onRowClick={handleRowClick}
              emptyMessage={isLoading ? "Loading returns..." : "No returns found"}
            />

            {/* Brand Breakdown */}
            {brands.length > 0 && selectedBrand === 'All Brands' && (
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Returns by Brand</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {brands.map((brand) => {
                      const brandReturns = returns.filter(returnOrder => returnOrder.brand === brand);
                      const brandTotal = brandReturns.reduce((sum, returnOrder) => sum + returnOrder.purchaseOrderTotalItemsCost, 0);
                      const brandVariants = brandReturns.reduce((sum, returnOrder) => sum + returnOrder.totalVariantQuantity, 0);
                      
                      return (
                        <div 
                          key={brand} 
                          className="p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                          onClick={() => setSelectedBrand(brand)}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold text-slate-900">{brand}</span>
                          </div>
                          <div className="space-y-1 text-sm text-slate-600">
                            <div className="flex justify-between">
                              <span>Returns:</span>
                              <span className="font-medium">{brandReturns.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Variants:</span>
                              <span className="font-medium">{brandVariants}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Value:</span>
                              <span className="font-medium">{formatCurrency(brandTotal)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}

            {/* Empty State */}
            {!isLoading && returns.length === 0 && (
              <Card className="text-center py-12">
                <RotateCcw className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Returns Found</h3>
                <p className="text-slate-600 mb-6">You haven't created any returns yet. Start by creating your first return.</p>
                <Button onClick={handleCreateNewReturn}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Return
                </Button>
              </Card>
            )}

            {/* Loading State */}
            {isLoading && (
              <Card className="text-center py-12">
                <RotateCcw className="w-16 h-16 text-slate-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Returns</h3>
                <p className="text-slate-600">Please wait while we fetch your return orders...</p>
              </Card>
            )}

            {/* Recent Activity */}
            {filteredReturns.length > 0 && (
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
                  <div className="space-y-3">
                    {filteredReturns
                      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
                      .slice(0, 5)
                      .map((returnOrder, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0 cursor-pointer hover:bg-slate-50 rounded px-2"
                          onClick={() => handleRowClick(returnOrder)}
                        >
                          <div className="flex items-center space-x-3">
                            <RotateCcw className="w-4 h-4 text-purple-500" />
                            <div>
                              <span className="font-medium text-slate-900">Return #{returnOrder.purchaseOrderID}</span>
                              <p className="text-sm text-slate-600">{returnOrder.brand} - {returnOrder.totalVariantQuantity} variants</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-slate-900">{formatCurrency(returnOrder.purchaseOrderTotalItemsCost)}</span>
                            <p className="text-xs text-slate-500">{formatDate(returnOrder.createdDate)}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </Card>
            )}
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
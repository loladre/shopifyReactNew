import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import FormField from '../components/ui/FormField';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusCard from '../components/ui/StatusCard';
import ServerMessagePanel from '../components/ui/ServerMessagePanel';
import { 
  RotateCcw, 
  Search, 
  AlertTriangle,
  Package,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Building2,
  ExternalLink,
  Eye,
  Filter,
  CheckCircle,
  X,
  FileText,
  ShoppingCart,
  Hash
} from 'lucide-react';

interface ReturnedProduct {
  title: string;
  imageUrl: string;
  publicUrl: string;
  adminUrl: string;
  sizeCounts: { [size: string]: number };
  reasons: string[];
  orderNumbers: string[];
  refundAmounts: string[];
  customerEmails: string[];
  totalReturns: number;
  totalExchanges: number;
  totalInventory: number;
}

interface SearchFilters {
  since: string;
  minReturns: number;
  inInventoryOnly: boolean;
}

export default function Returns() {
  const navigate = useNavigate();
  
  // State
  const [returnedProducts, setReturnedProducts] = useState<ReturnedProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ReturnedProduct[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    since: '2025-01-01',
    minReturns: 2,
    inInventoryOnly: false
  });
  const [selectedReason, setSelectedReason] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    filterProductsByReason();
  }, [selectedReason, returnedProducts]);

  const fetchReturnReport = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const token = localStorage.getItem('bridesbyldToken');
      
      if (!token) {
        navigate('/');
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://hushloladre.com';
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || '';
      
      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/admin/loop/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          since: searchFilters.since,
          minReturns: searchFilters.minReturns,
          inInventoryOnly: searchFilters.inInventoryOnly
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load return report');
      }

      const data: ReturnedProduct[] = await response.json();
      setReturnedProducts(data);
      setSuccess(`Successfully loaded ${data.length} products with frequent returns`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load return report');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProductsByReason = () => {
    if (selectedReason === 'All') {
      setFilteredProducts(returnedProducts);
    } else {
      setFilteredProducts(returnedProducts.filter(product => 
        product.reasons.some(reason => reason.toLowerCase().includes(selectedReason.toLowerCase()))
      ));
    }
  };

  const formatReasonsWithCounts = (reasons: string[]): string => {
    const counts: { [key: string]: number } = {};
    for (const reason of reasons) {
      counts[reason] = (counts[reason] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([reason, count]) => `${reason} (${count})`)
      .join(', ');
  };

  const extractCleanSizes = (sizeMap: { [size: string]: number }): string => {
    return Object.entries(sizeMap || {})
      .map(([sizeLabel, count]) => {
        const clean = sizeLabel.split('/').pop()?.trim() || sizeLabel;
        return `${clean} (${count})`;
      })
      .join(', ');
  };

  const formatCurrency = (amount: string): string => {
    // Handle cases where amount might be a string like "$0.00"
    const numericAmount = parseFloat(amount.replace(/[$,]/g, '')) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(numericAmount);
  };

  const handleRowClick = (product: ReturnedProduct) => {
    window.open(product.adminUrl, '_blank');
  };

  const columns: Column[] = [
    {
      key: 'image',
      header: 'Image',
      render: (_, product) => (
        <div className="flex justify-center">
          <a href={product.publicUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-16 h-16 object-cover rounded border border-slate-200 hover:scale-110 transition-transform duration-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-16 h-16 bg-slate-100 rounded border border-slate-200 flex items-center justify-center">
              <Package className="w-6 h-6 text-slate-400" />
            </div>
          </a>
        </div>
      ),
      className: 'text-center'
    },
    {
      key: 'title',
      header: 'Product',
      sortable: true,
      render: (value, product) => (
        <a
          href={product.adminUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 hover:text-purple-800 font-medium flex items-center space-x-1"
        >
          <span className="max-w-xs truncate" title={value}>{value}</span>
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      )
    },
    {
      key: 'sizes',
      header: 'Sizes',
      render: (_, product) => (
        <span className="text-sm max-w-xs" title={extractCleanSizes(product.sizeCounts)}>
          {extractCleanSizes(product.sizeCounts)}
        </span>
      )
    },
    {
      key: 'reasons',
      header: 'Return Reasons',
      render: (_, product) => (
        <div className="max-w-xs">
          <span className="text-sm" title={formatReasonsWithCounts(product.reasons)}>
            {formatReasonsWithCounts(product.reasons)}
          </span>
        </div>
      )
    },
    {
      key: 'orderNumbers',
      header: 'Order #',
      render: (_, product) => (
        <div className="max-w-xs">
          <div className="flex items-center space-x-1">
            <Hash className="w-3 h-3 text-slate-400" />
            <span className="text-sm">
              {product.orderNumbers.slice(0, 3).join(', ')}
              {product.orderNumbers.length > 3 && ` +${product.orderNumbers.length - 3} more`}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'refundAmounts',
      header: 'Refunds',
      render: (_, product) => (
        <div className="text-sm">
          {product.refundAmounts.slice(0, 3).map((amount, index) => (
            <div key={index} className="flex items-center space-x-1">
              <DollarSign className="w-3 h-3 text-slate-400" />
              <span>{formatCurrency(amount)}</span>
            </div>
          ))}
          {product.refundAmounts.length > 3 && (
            <div className="text-xs text-slate-500">+{product.refundAmounts.length - 3} more</div>
          )}
        </div>
      ),
      className: 'text-right'
    },
    {
      key: 'customerEmails',
      header: 'Customers',
      render: (_, product) => (
        <div className="max-w-xs">
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3 text-slate-400" />
            <span className="text-sm">
              {product.customerEmails.slice(0, 2).join(', ')}
              {product.customerEmails.length > 2 && ` +${product.customerEmails.length - 2} more`}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'totalReturns',
      header: 'Total Returns',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <RotateCcw className="w-4 h-4 text-red-500" />
          <span className="font-semibold text-red-600">{value}</span>
        </div>
      ),
      className: 'text-center'
    },
    {
      key: 'totalExchanges',
      header: 'Exchanges',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <ShoppingCart className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-blue-600">{value}</span>
        </div>
      ),
      className: 'text-center'
    },
    {
      key: 'totalInventory',
      header: 'Inventory',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4 text-slate-400" />
          <span className={`font-semibold ${value > 0 ? 'text-green-600' : 'text-slate-400'}`}>
            {value ?? 0}
          </span>
        </div>
      ),
      className: 'text-center'
    }
  ];

  // Calculate summary statistics
  const totalProducts = returnedProducts.length;
  const totalReturns = returnedProducts.reduce((sum, product) => sum + product.totalReturns, 0);
  const totalExchanges = returnedProducts.reduce((sum, product) => sum + product.totalExchanges, 0);
  const totalRefundValue = returnedProducts.reduce((sum, product) => {
    return sum + product.refundAmounts.reduce((refundSum, amount) => {
      return refundSum + (parseFloat(amount.replace(/[$,]/g, '')) || 0);
    }, 0);
  }, 0);

  // Get unique return reasons
  const allReasons = returnedProducts.flatMap(product => product.reasons);
  const uniqueReasons = Array.from(new Set(allReasons));

  if (error && returnedProducts.length === 0) {
    return (
      <Layout title="Returns Analysis">
        <div className="w-full px-6 py-6">
          <Card className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Returns Data</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={fetchReturnReport}>Try Again</Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Returns Analysis">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Repeated Return Products</h1>
            <p className="text-slate-600 mt-1">Identify frequently returned products to address quality issues</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Filters */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Return Analysis Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField label="Since Date">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="date"
                        value={searchFilters.since}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, since: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </FormField>

                  <FormField label="Min Returns">
                    <Input
                      type="number"
                      min="1"
                      value={searchFilters.minReturns}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, minReturns: parseInt(e.target.value) || 1 }))}
                    />
                  </FormField>

                  <FormField label="Inventory Filter">
                    <label className="flex items-center space-x-2 mt-3">
                      <input
                        type="checkbox"
                        checked={searchFilters.inInventoryOnly}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, inInventoryOnly: e.target.checked }))}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-slate-700">In Inventory Only</span>
                    </label>
                  </FormField>

                  <FormField label="Action">
                    <Button
                      onClick={fetchReturnReport}
                      isLoading={isLoading}
                      className="w-full"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Load Report
                    </Button>
                  </FormField>
                </div>
              </div>
            </Card>

            {/* Status Messages */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{error}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError('')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}

            {success && (
              <Card className="border-green-200 bg-green-50">
                <div className="flex items-center space-x-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span>{success}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSuccess('')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Summary Cards */}
            {returnedProducts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatusCard
                  title="Products with Returns"
                  value={totalProducts}
                  icon={Package}
                  color="red"
                />
                <StatusCard
                  title="Total Returns"
                  value={totalReturns}
                  icon={RotateCcw}
                  color="orange"
                />
                <StatusCard
                  title="Total Exchanges"
                  value={totalExchanges}
                  icon={ShoppingCart}
                  color="blue"
                />
                <StatusCard
                  title="Refund Value"
                  value={new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(totalRefundValue)}
                  icon={DollarSign}
                  color="purple"
                />
              </div>
            )}

            {/* Return Reason Filter */}
            {uniqueReasons.length > 0 && (
              <Card>
                <div className="flex items-center space-x-4">
                  <Filter className="w-5 h-5 text-slate-400" />
                  <label htmlFor="reasonSelect" className="text-sm font-semibold text-slate-700">
                    Filter by Return Reason:
                  </label>
                  <select
                    id="reasonSelect"
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="All">All Reasons</option>
                    {uniqueReasons.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>
              </Card>
            )}

            {/* Loading State */}
            {isLoading && (
              <Card className="text-center py-12">
                <RotateCcw className="w-16 h-16 text-slate-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Return Report</h3>
                <p className="text-slate-600">Please wait while we analyze return patterns...</p>
              </Card>
            )}

            {/* Returns Table */}
            {filteredProducts.length > 0 && (
              <Card padding="none">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Frequently Returned Products</h3>
                    <div className="text-sm text-slate-600">
                      Showing {filteredProducts.length} of {totalProducts} products
                    </div>
                  </div>
                </div>
                <DataTable
                  columns={columns}
                  data={filteredProducts}
                  onRowClick={handleRowClick}
                  emptyMessage="No products match the current filters"
                />
              </Card>
            )}

            {/* Empty State */}
            {!isLoading && returnedProducts.length === 0 && (
              <Card className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Frequent Returns Found</h3>
                <p className="text-slate-600 mb-6">
                  No products meet the current return frequency criteria. This could indicate good product quality!
                </p>
                <div className="text-sm text-slate-500">
                  Try adjusting your filters:
                  <ul className="mt-2 space-y-1">
                    <li>• Lower the minimum returns threshold</li>
                    <li>• Extend the date range further back</li>
                    <li>• Remove the inventory-only filter</li>
                    <li>• Check if there are any returns in the system</li>
                  </ul>
                </div>
              </Card>
            )}

            {/* Return Reason Analysis */}
            {uniqueReasons.length > 0 && (
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Return Reason Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uniqueReasons.map(reason => {
                      const reasonCount = allReasons.filter(r => r === reason).length;
                      const percentage = ((reasonCount / allReasons.length) * 100).toFixed(1);
                      
                      return (
                        <div 
                          key={reason}
                          className="p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors duration-200"
                          onClick={() => setSelectedReason(reason)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-900 text-sm">{reason}</span>
                            <span className="text-lg font-bold text-slate-900">{reasonCount}</span>
                          </div>
                          <div className="text-xs text-slate-600">
                            {percentage}% of all returns
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}

            {/* Analysis Summary */}
            {returnedProducts.length > 0 && (
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Analysis Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Analysis Period:</span>
                        <span className="font-semibold text-slate-900">
                          Since {new Date(searchFilters.since).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Minimum Returns:</span>
                        <span className="font-semibold text-slate-900">{searchFilters.minReturns}+</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Products Found:</span>
                        <span className="font-semibold text-slate-900">{totalProducts}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Total Return Incidents:</span>
                        <span className="font-semibold text-slate-900">{totalReturns}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Total Exchanges:</span>
                        <span className="font-semibold text-slate-900">{totalExchanges}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Avg Returns per Product:</span>
                        <span className="font-semibold text-slate-900">
                          {totalProducts > 0 ? (totalReturns / totalProducts).toFixed(1) : '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Action Recommendations */}
            {returnedProducts.length > 0 && (
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Recommended Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Quality Issues</h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Review products with highest return rates</li>
                        <li>• Contact vendors about quality concerns</li>
                        <li>• Consider removing problematic items</li>
                        <li>• Update product descriptions for clarity</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Customer Experience</h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Improve size guides and measurements</li>
                        <li>• Add more detailed product photos</li>
                        <li>• Update return/exchange policies</li>
                        <li>• Provide better product care instructions</li>
                      </ul>
                    </div>
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
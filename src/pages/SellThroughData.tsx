import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusCard from '../components/ui/StatusCard';
import ServerMessagePanel from '../components/ui/ServerMessagePanel';
import { 
  BarChart3, 
  Search, 
  TrendingUp,
  DollarSign,
  Package,
  Percent,
  Calendar,
  Building2,
  AlertTriangle,
  FileSpreadsheet,
  Download
} from 'lucide-react';

interface SellThroughRecord {
  date: string;
  brand: string;
  qoh: number;
  costValue: number;
  retailValue: number;
  qtySold: number;
  qtyReceived: number;
  netSales: number;
  grossMarginDollar: number;
  grossMarginPercent: number;
  cogs: number;
  sellThrough: number;
  sellThroughDollar: number;
  costOfReceived: number;
  roi: number;
  roiPercent: number;
}

interface UniqueValues {
  uniqueSeasons: string[];
  uniqueBrands: string[];
  uniqueDates: string[];
}

export default function SellThroughData() {
  const navigate = useNavigate();
  
  // Filter state
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Data state
  const [sellThroughData, setSellThroughData] = useState<SellThroughRecord[]>([]);
  const [totalData, setTotalData] = useState<SellThroughRecord[]>([]);
  const [uniqueValues, setUniqueValues] = useState<UniqueValues>({
    uniqueSeasons: [],
    uniqueBrands: [],
    uniqueDates: []
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchUniqueValues();
  }, []);

  const fetchUniqueValues = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('bridesbyldToken');
      
      if (!token) {
        navigate('/');
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://hushloladre.com';
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || '';
      
      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/sellThroughUniqueValues`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unique values');
      }

      const data: UniqueValues = await response.json();
      setUniqueValues(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      setError('');
      
      const token = localStorage.getItem('bridesbyldToken');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://hushloladre.com';
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || '';
      
      const searchCriteria = {
        season: selectedSeason,
        brand: selectedBrand,
        sellThroughDate: selectedDate,
      };

      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/sellThroughSearchEndpoint`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchCriteria),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SellThroughRecord[] = await response.json();
      
      // Process data to calculate additional fields and separate totals
      const processedData = data.map(item => {
        const costOfReceived = item.cogs + item.costValue;
        const sellThroughDollar = costOfReceived > 0 ? (item.cogs / costOfReceived) * 100 : 0;
        const roi = item.netSales - costOfReceived;
        const roiPercent = costOfReceived > 0 ? (roi / costOfReceived) * 100 : 0;

        return {
          ...item,
          sellThroughDollar,
          costOfReceived,
          roi,
          roiPercent,
        };
      });

      // Separate main data from totals
      const mainData = processedData.filter(item => item.brand !== 'Total');
      const totalsData = processedData.filter(item => item.brand === 'Total');
      
      setSellThroughData(mainData);
      setTotalData(totalsData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Table columns for sell-through data
  const columns: Column[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{formatDate(value)}</span>
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
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'qoh',
      header: 'QOH',
      sortable: true,
      render: (value) => value.toLocaleString(),
      className: 'text-right'
    },
    {
      key: 'costValue',
      header: 'Cost Value',
      sortable: true,
      render: (value) => formatCurrency(value),
      className: 'text-right'
    },
    {
      key: 'retailValue',
      header: 'Retail Value',
      sortable: true,
      render: (value) => formatCurrency(value),
      className: 'text-right'
    },
    {
      key: 'qtySold',
      header: 'QTY Sold',
      sortable: true,
      render: (value) => value.toLocaleString(),
      className: 'text-right'
    },
    {
      key: 'qtyReceived',
      header: 'QTY Received',
      sortable: true,
      render: (value) => value.toLocaleString(),
      className: 'text-right'
    },
    {
      key: 'netSales',
      header: 'Net Sales',
      sortable: true,
      render: (value) => formatCurrency(value),
      className: 'text-right'
    },
    {
      key: 'grossMarginDollar',
      header: 'Gross Margin ($)',
      sortable: true,
      render: (value) => formatCurrency(value),
      className: 'text-right'
    },
    {
      key: 'grossMarginPercent',
      header: 'Gross Margin (%)',
      sortable: true,
      render: (value) => formatPercentage(value * 100),
      className: 'text-right'
    },
    {
      key: 'cogs',
      header: 'COGS',
      sortable: true,
      render: (value) => formatCurrency(value),
      className: 'text-right'
    },
    {
      key: 'sellThrough',
      header: 'Sell-Through',
      sortable: true,
      render: (value) => formatPercentage(value * 100),
      className: 'text-right'
    },
    {
      key: 'sellThroughDollar',
      header: 'Sell-Through $',
      sortable: true,
      render: (value) => formatPercentage(value),
      className: 'text-right'
    },
    {
      key: 'costOfReceived',
      header: 'Cost of Received',
      sortable: true,
      render: (value) => formatCurrency(value),
      className: 'text-right'
    },
    {
      key: 'roi',
      header: 'ROI $',
      sortable: true,
      render: (value) => formatCurrency(value),
      className: 'text-right'
    },
    {
      key: 'roiPercent',
      header: 'ROI %',
      sortable: true,
      render: (value) => formatPercentage(value),
      className: 'text-right'
    }
  ];

  // Calculate summary statistics
  const totalNetSales = sellThroughData.reduce((sum, item) => sum + item.netSales, 0);
  const totalQtySold = sellThroughData.reduce((sum, item) => sum + item.qtySold, 0);
  const totalROI = sellThroughData.reduce((sum, item) => sum + item.roi, 0);
  const averageSellThrough = sellThroughData.length > 0 
    ? sellThroughData.reduce((sum, item) => sum + item.sellThrough, 0) / sellThroughData.length * 100
    : 0;

  if (error && !sellThroughData.length) {
    return (
      <Layout title="Sell Through Data">
        <div className="w-full px-6 py-6">
          <Card className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Sell Through Data</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={fetchUniqueValues}>Try Again</Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Sell Through Data">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Sell Through Data</h1>
            <p className="text-slate-600 mt-1">Generate reports and analyze sell-through performance</p>
          </div>
          <Button onClick={fetchUniqueValues} isLoading={isLoading}>
            Refresh Data
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Season Filter</h3>
                  <FormField label="Season">
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">All Seasons</option>
                      {uniqueValues.uniqueSeasons.map(season => (
                        <option key={season} value={season}>{season}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </Card>

              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Brand & Date Filters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Brand">
                      <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">All Brands</option>
                        {uniqueValues.uniqueBrands.map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Date">
                      <select
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">All Dates</option>
                        {uniqueValues.uniqueDates.map(date => {
                          const formattedDate = formatDate(date);
                          return (
                            <option key={date} value={date}>{formattedDate}</option>
                          );
                        })}
                      </select>
                    </FormField>
                  </div>
                  <Button
                    onClick={handleSearch}
                    isLoading={isSearching}
                    className="w-full"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </Card>
            </div>

            {/* Summary Cards */}
            {sellThroughData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatusCard
                  title="Total Net Sales"
                  value={formatCurrency(totalNetSales)}
                  icon={DollarSign}
                  color="green"
                />
                <StatusCard
                  title="Total Qty Sold"
                  value={totalQtySold.toLocaleString()}
                  icon={Package}
                  color="blue"
                />
                <StatusCard
                  title="Total ROI"
                  value={formatCurrency(totalROI)}
                  icon={TrendingUp}
                  color="purple"
                />
                <StatusCard
                  title="Avg Sell Through"
                  value={formatPercentage(averageSellThrough)}
                  icon={Percent}
                  color="orange"
                />
              </div>
            )}

            {/* Main Data Table */}
            {sellThroughData.length > 0 && (
              <Card padding="none">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Sell Through Data</h3>
                    <div className="text-sm text-slate-600">
                      Showing {sellThroughData.length} records
                    </div>
                  </div>
                </div>
                <DataTable
                  columns={columns}
                  data={sellThroughData}
                  emptyMessage="No sell-through data found for the selected criteria"
                />
              </Card>
            )}

            {/* Totals Table */}
            {totalData.length > 0 && (
              <Card padding="none">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Summary Totals</h3>
                </div>
                <DataTable
                  columns={columns}
                  data={totalData}
                  emptyMessage="No summary data available"
                />
              </Card>
            )}

            {/* Empty State */}
            {!isLoading && sellThroughData.length === 0 && !isSearching && (
              <Card className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Data Found</h3>
                <p className="text-slate-600 mb-6">
                  Use the filters above to search for sell-through data by season, brand, or date.
                </p>
                <div className="text-sm text-slate-500">
                  Available filters:
                  <ul className="mt-2 space-y-1">
                    <li>• Filter by specific seasons</li>
                    <li>• Filter by brand or view all brands</li>
                    <li>• Filter by specific dates or date ranges</li>
                    <li>• View detailed performance metrics</li>
                  </ul>
                </div>
              </Card>
            )}

            {/* Loading State */}
            {isSearching && (
              <Card className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Searching Data</h3>
                <p className="text-slate-600">Please wait while we fetch the sell-through data...</p>
              </Card>
            )}

            {/* Performance Insights */}
            {sellThroughData.length > 0 && (
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Performance Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{formatCurrency(totalNetSales)}</div>
                      <div className="text-sm text-slate-600">Total Net Sales</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{formatPercentage(averageSellThrough)}</div>
                      <div className="text-sm text-slate-600">Average Sell Through</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{sellThroughData.length}</div>
                      <div className="text-sm text-slate-600">Total Records</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Search Summary */}
            {sellThroughData.length > 0 && (
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Search Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Season:</span>
                        <span className="font-semibold text-slate-900">{selectedSeason || 'All Seasons'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Brand:</span>
                        <span className="font-semibold text-slate-900">{selectedBrand || 'All Brands'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Date:</span>
                        <span className="font-semibold text-slate-900">
                          {selectedDate ? formatDate(selectedDate) : 'All Dates'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Records Found:</span>
                        <span className="font-semibold text-slate-900">{sellThroughData.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Total Units Sold:</span>
                        <span className="font-semibold text-slate-900">{totalQtySold.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Total ROI:</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(totalROI)}</span>
                      </div>
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
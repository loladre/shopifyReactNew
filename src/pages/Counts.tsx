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
  Package, 
  ShoppingCart, 
  TrendingUp,
  Calendar,
  Leaf,
  AlertTriangle,
  Hash
} from 'lucide-react';

interface ProductTypeCount {
  productType: string;
  total: number;
  variantQuantitySum: number;
}

export default function Counts() {
  const [vendors, setVendors] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('Resort');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('26');
  const [productTypeCounts, setProductTypeCounts] = useState<ProductTypeCount[]>([]);
  const [generatedSeason, setGeneratedSeason] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('bridesbyldToken');
      
      if (!token) {
        navigate('/');
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://hushloladre.com';
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || '';
      
      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/vendors`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }

      const data: string[] = await response.json();
      setVendors(data.sort());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!selectedBrand) {
      setError('Please select a brand');
      return;
    }

    const combinedSeason = selectedSeason + selectedBrand + selectedYear;
    setGeneratedSeason(combinedSeason);

    try {
      setIsSearching(true);
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://hushloladre.com';
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || '';
      
      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/productTypeReport?season=${combinedSeason}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product type data');
      }

      const responseJson = await response.json();
      if (responseJson && responseJson.data) {
        setProductTypeCounts(responseJson.data);
      } else {
        setProductTypeCounts([]);
        setError('No data found for this season');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setProductTypeCounts([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRowClick = (productType: ProductTypeCount) => {
    // Navigate to vendors page or detailed view (to be implemented)
    // For now, we'll just log the product type
    console.log('Clicked product type:', productType.productType);
  };

  const columns: Column[] = [
    {
      key: 'productType',
      header: 'Product Type',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4 text-slate-400" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'total',
      header: 'Styles',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Hash className="w-4 h-4 text-slate-400" />
          <span className="font-semibold">{value}</span>
        </div>
      ),
      className: 'text-center'
    },
    {
      key: 'variantQuantitySum',
      header: 'Variants',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <ShoppingCart className="w-4 h-4 text-slate-400" />
          <span className="font-semibold">{value}</span>
        </div>
      ),
      className: 'text-center'
    }
  ];

  // Season options
  const seasonOptions = [
    { value: 'Resort', label: 'Resort' },
    { value: 'Spring', label: 'Spring' },
    { value: 'Summer', label: 'Summer' },
    { value: 'Fall', label: 'Fall' },
    { value: 'Personal', label: 'Personal' },
    { value: 'Consignment', label: 'Consignment' }
  ];

  // Year options (23-33 as shown in the original)
  const yearOptions = Array.from({ length: 11 }, (_, i) => {
    const year = 23 + i;
    return { value: year.toString(), label: year.toString() };
  });

  // Calculate summary statistics
  const totalStyles = productTypeCounts.reduce((sum, item) => sum + item.total, 0);
  const totalVariants = productTypeCounts.reduce((sum, item) => sum + item.variantQuantitySum, 0);
  const totalProductTypes = productTypeCounts.length;

  if (error && !productTypeCounts.length) {
    return (
      <Layout title="Product Type Counts">
        <div className="w-full px-6 py-6">
          <Card className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Product Type Data</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={fetchVendors}>Try Again</Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Product Type Counts">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Product Type Counts: <span className="text-purple-600">{generatedSeason || 'Select Season'}</span>
            </h1>
            <p className="text-slate-600 mt-1">View product counts by type and season</p>
          </div>
          <Button onClick={fetchVendors} isLoading={isLoading}>
            Refresh Data
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Filters */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Season Search</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField label="Season">
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {seasonOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Brand">
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Select a Vendor Name</option>
                      {vendors.map(vendor => (
                        <option key={vendor} value={vendor}>{vendor}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Year">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {yearOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Action">
                    <Button
                      onClick={handleSearch}
                      isLoading={isSearching}
                      disabled={!selectedBrand}
                      className="w-full"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </FormField>
                </div>
              </div>
            </Card>

            {/* Summary Cards */}
            {productTypeCounts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatusCard
                  title="Product Types"
                  value={totalProductTypes}
                  icon={Package}
                  color="blue"
                />
                <StatusCard
                  title="Total Styles"
                  value={totalStyles.toLocaleString()}
                  icon={Hash}
                  color="green"
                />
                <StatusCard
                  title="Total Variants"
                  value={totalVariants.toLocaleString()}
                  icon={ShoppingCart}
                  color="purple"
                />
              </div>
            )}

            {/* Product Type Counts Table */}
            {productTypeCounts.length > 0 && (
              <Card padding="none">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Product Type Breakdown</h3>
                </div>
                <DataTable
                  columns={columns}
                  data={productTypeCounts}
                  onRowClick={handleRowClick}
                  emptyMessage="No product type data available"
                />
              </Card>
            )}

            {/* Empty State */}
            {!productTypeCounts.length && !isSearching && (
              <Card className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Select Season Parameters</h3>
                <p className="text-slate-600 mb-6">Choose a season, brand, and year to view product type counts for that specific season.</p>
                <div className="text-sm text-slate-500">
                  Features available:
                  <ul className="mt-2 space-y-1">
                    <li>• View product type distribution by season</li>
                    <li>• Count styles and variants per product type</li>
                    <li>• Analyze product mix within seasons</li>
                    <li>• Compare product type performance</li>
                  </ul>
                </div>
              </Card>
            )}

            {/* Loading State */}
            {isSearching && (
              <Card className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Product Type Data</h3>
                <p className="text-slate-600">Please wait while we fetch the product type information...</p>
              </Card>
            )}

            {/* Detailed Breakdown */}
            {productTypeCounts.length > 0 && (
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Season Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Season:</span>
                        <span className="font-semibold text-slate-900">{generatedSeason}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Product Types:</span>
                        <span className="font-semibold text-slate-900">{totalProductTypes}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Total Styles:</span>
                        <span className="font-semibold text-slate-900">{totalStyles.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Total Variants:</span>
                        <span className="font-semibold text-slate-900">{totalVariants.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Avg Variants per Style:</span>
                        <span className="font-semibold text-slate-900">
                          {totalStyles > 0 ? (totalVariants / totalStyles).toFixed(1) : '0'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Avg Styles per Type:</span>
                        <span className="font-semibold text-slate-900">
                          {totalProductTypes > 0 ? (totalStyles / totalProductTypes).toFixed(1) : '0'}
                        </span>
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
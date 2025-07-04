import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import FormField from "../components/ui/FormField";
import DataTable, { Column } from "../components/ui/DataTable";
import StatusCard from "../components/ui/StatusCard";
import ServerMessagePanel from "../components/ui/ServerMessagePanel";
import { selectMapping } from "../utils/sizeConversions";
import {
  Leaf,
  Search,
  Building2,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Calendar,
  BarChart3,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  CheckCircle,
} from "lucide-react";

interface ProductTypeBreakdown {
  productType: string;
  totalCost: number;
  variantQuantityOrdered: number;
  variantQuantityReceived: number;
  receivedValue: number;
  productCount: number;
}

interface BrandSeasonData {
  brand: string;
  subTotalVariantQuantity: number;
  subTotalProductQuantity: number;
  subTotalVariantReceivedQuantity: number;
  subTotalTotalItemsCost: number;
  subTotaltotalReceivedValue: number;
  subTotaltotalBalanceDue: number;
  subTotalVariantReceivedQuantityProgress: number;
  productTypeBreakdown: ProductTypeBreakdown[];
}

interface SeasonData {
  grandTotalVariantQuantity: number;
  grandTotalProductQuantity: number;
  grandTotalVariantReceivedQuantity: number;
  grandTotalTotalItemsCost: number;
  grandTotalReceivedValue: number;
  grandTotalBalanceDue: number;
  grandTotalVariantReceivedQuantityProgress: number;
  brands: BrandSeasonData[];
}

export default function Seasons() {
  const [vendors, setVendors] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("Resort");
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>("26");
  const [seasonData, setSeasonData] = useState<SeasonData | null>(null);
  const [generatedSeason, setGeneratedSeason] = useState<string>("");
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("bridesbyldToken");

      if (!token) {
        navigate("/");
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/vendors`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch vendors");
      }

      const data: string[] = await response.json();
      setVendors(data.sort());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    const combinedSeason = selectedSeason + selectedYear;
    setGeneratedSeason(combinedSeason);

    try {
      setIsSearching(true);
      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

      // Construct URL based on whether brand is "ALL" or specific brand
      let url;
      if (selectedBrand === "ALL") {
        url = `${apiBaseUrl}${basePath}/getSeasonData/${combinedSeason}`;
      } else {
        url = `${apiBaseUrl}${basePath}/getSeasonData/${combinedSeason}/${selectedBrand}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch season data");
      }

      const responseData = await response.json();
      
      // Protect against empty or invalid data
      if (!responseData || typeof responseData !== 'object') {
        setSeasonData(null);
        setError("No data available for the selected season and brand combination");
        return;
      }

      // Ensure brands array exists and has data
      if (!responseData.brands || !Array.isArray(responseData.brands) || responseData.brands.length === 0) {
        setSeasonData({
          ...responseData,
          brands: []
        });
        setError("No brand data available for the selected season");
        return;
      }

      setSeasonData(responseData);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setSeasonData(null);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleBrandExpansion = (brandName: string) => {
    const newExpanded = new Set(expandedBrands);
    if (newExpanded.has(brandName)) {
      newExpanded.delete(brandName);
    } else {
      newExpanded.add(brandName);
    }
    setExpandedBrands(newExpanded);
  };

  const handleRowClick = (row: any) => {
    if (row.type === 'brand') {
      navigate(`/vendors?brand=${encodeURIComponent(row.brand)}`);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const calculateProgress = (brand: BrandSeasonData): number => {
    return brand.subTotalVariantQuantity > 0
      ? (brand.subTotalVariantReceivedQuantity / brand.subTotalVariantQuantity) * 100
      : 0;
  };

  const getCommercialName = (productType: string): string => {
    return selectMapping[productType] || productType;
  };

  // Create table data including expanded product types
  const createTableData = () => {
    if (!seasonData || !seasonData.brands || seasonData.brands.length === 0) return [];

    const tableData: any[] = [];

    seasonData.brands.forEach((brand) => {
      // Add main brand row
      tableData.push({
        type: 'brand',
        brand: brand.brand,
        subTotalProductQuantity: brand.subTotalProductQuantity,
        subTotalVariantQuantity: brand.subTotalVariantQuantity,
        subTotalTotalItemsCost: brand.subTotalTotalItemsCost,
        subTotalVariantReceivedQuantity: brand.subTotalVariantReceivedQuantity,
        subTotaltotalReceivedValue: brand.subTotaltotalReceivedValue,
        subTotalVariantReceivedQuantityProgress: brand.subTotalVariantReceivedQuantityProgress,
        progress: calculateProgress(brand),
        isExpanded: expandedBrands.has(brand.brand),
        hasBreakdown: brand.productTypeBreakdown && brand.productTypeBreakdown.length > 0,
      });

      // Add product type breakdown rows if expanded
      if (expandedBrands.has(brand.brand) && brand.productTypeBreakdown && brand.productTypeBreakdown.length > 0) {
        brand.productTypeBreakdown.forEach((productType) => {
          tableData.push({
            type: 'productType',
            brand: brand.brand,
            productType: productType.productType,
            commercialName: getCommercialName(productType.productType),
            totalCost: productType.totalCost,
            productCount: productType.productCount,
            variantQuantityOrdered: productType.variantQuantityOrdered,
            variantQuantityReceived: productType.variantQuantityReceived,
            receivedValue: productType.receivedValue,
          });
        });
      }
    });

    return tableData;
  };

  const columns: Column[] = [
    {
      key: "expand",
      header: "",
      render: (_, row) => {
        if (row.type === 'brand' && row.hasBreakdown) {
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleBrandExpansion(row.brand);
              }}
              className="p-1 hover:bg-slate-100 rounded transition-colors duration-200"
            >
              {row.isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-600" />
              )}
            </button>
          );
        }
        return null;
      },
      className: "w-8",
    },
    {
      key: "brand",
      header: "Brand / Product Type",
      sortable: true,
      render: (value, row) => {
        if (row.type === 'brand') {
          return (
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="font-medium">{value}</span>
            </div>
          );
        } else {
          return (
            <div className="flex items-center space-x-2 ml-6">
              <Package className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{row.commercialName}</span>
              <span className="text-xs text-slate-400">({row.productType})</span>
            </div>
          );
        }
      },
    },
    {
      key: "subTotalProductQuantity",
      header: "QTY Product Ordered",
      sortable: true,
      render: (value, row) => {
        if (row.type === 'brand') {
          return (
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-slate-400" />
              <span>{value || 0}</span>
            </div>
          );
        } else {
          return (
            <div className="flex items-center space-x-2 ml-6">
              <span className="text-slate-600">{row.productCount || 0}</span>
            </div>
          );
        }
      },
      className: "text-center",
    },
    {
      key: "subTotalVariantQuantity",
      header: "Qty Variant Ordered",
      sortable: true,
      render: (value, row) => {
        if (row.type === 'brand') {
          return (
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-slate-400" />
              <span>{value || 0}</span>
            </div>
          );
        } else {
          return (
            <div className="flex items-center space-x-2 ml-6">
              <span className="text-slate-600">{row.variantQuantityOrdered || 0}</span>
            </div>
          );
        }
      },
      className: "text-center",
    },
    {
      key: "subTotalTotalItemsCost",
      header: "Ordered Value",
      sortable: true,
      render: (value, row) => {
        if (row.type === 'brand') {
          return (
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span className="font-semibold">{formatCurrency(value || 0)}</span>
            </div>
          );
        } else {
          return (
            <div className="flex items-center space-x-2 ml-6">
              <span className="text-slate-600">{formatCurrency(row.totalCost || 0)}</span>
            </div>
          );
        }
      },
      className: "text-right",
    },
    {
      key: "subTotalVariantReceivedQuantity",
      header: "QTY Variant Received",
      sortable: true,
      render: (value, row) => {
        if (row.type === 'brand') {
          return (
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>{value || 0}</span>
            </div>
          );
        } else {
          return (
            <div className="flex items-center space-x-2 ml-6">
              <span className="text-slate-600">{row.variantQuantityReceived || 0}</span>
            </div>
          );
        }
      },
      className: "text-center",
    },
    {
      key: "subTotaltotalReceivedValue",
      header: "Received Value",
      sortable: true,
      render: (value, row) => {
        if (row.type === 'brand') {
          return (
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="font-semibold">{formatCurrency(value || 0)}</span>
            </div>
          );
        } else {
          return (
            <div className="flex items-center space-x-2 ml-6">
              <span className="text-slate-600">{formatCurrency(row.receivedValue || 0)}</span>
            </div>
          );
        }
      },
      className: "text-right",
    },
    {
      key: "progress",
      header: "Progress",
      render: (value, row) => {
        if (row.type === 'brand') {
          const progress = value || 0;
          return (
            <div className="w-24">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-600 w-8">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          );
        } else {
          // Calculate progress for product type
          const ordered = row.variantQuantityOrdered || 0;
          const received = row.variantQuantityReceived || 0;
          const progress = ordered > 0 ? (received / ordered) * 100 : 0;
          
          return (
            <div className="w-24 ml-6">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
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
    },
  ];

  // Season options
  const seasonOptions = [
    { value: "Resort", label: "Resort" },
    { value: "Spring", label: "Spring" },
    { value: "Summer", label: "Summer" },
    { value: "Fall", label: "Fall" },
    { value: "Personal", label: "Personal" },
    { value: "Consignment", label: "Consignment" },
  ];

  // Year options (23-33 as shown in the original)
  const yearOptions = Array.from({ length: 11 }, (_, i) => {
    const year = 23 + i;
    return { value: year.toString(), label: year.toString() };
  });

  const overallProgress = seasonData && seasonData.grandTotalVariantQuantity > 0
    ? (seasonData.grandTotalVariantReceivedQuantity / seasonData.grandTotalVariantQuantity) * 100
    : 0;

  if (error && !seasonData) {
    return (
      <Layout title="Seasons">
        <div className="w-full px-6 py-6">
          <Card className="text-center py-12">
            <Leaf className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Season Data</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={fetchVendors}>Try Again</Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Seasons">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Seasons: <span className="text-purple-600">{generatedSeason || "Select Season"}</span>
            </h1>
            <p className="text-slate-600 mt-1">Analyze seasonal performance by brand and product</p>
          </div>
          <Button onClick={fetchVendors} isLoading={isLoading}>
            Refresh Data
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-5 space-y-6">
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
                      {seasonOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Brand">
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="ALL">ALL</option>
                      {vendors.map((vendor) => (
                        <option key={vendor} value={vendor}>
                          {vendor}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Year">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {yearOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Action">
                    <Button
                      onClick={handleSearch}
                      isLoading={isSearching}
                      className="w-full"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </FormField>
                </div>
              </div>
            </Card>

            {/* Season Summary */}
            {seasonData && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatusCard
                    title="Total Ordered QTY"
                    value={(seasonData.grandTotalVariantQuantity || 0).toLocaleString()}
                    icon={ShoppingCart}
                    color="blue"
                  />
                  <StatusCard
                    title="Total Received QTY"
                    value={(seasonData.grandTotalVariantReceivedQuantity || 0).toLocaleString()}
                    icon={Package}
                    color="green"
                  />
                  <StatusCard
                    title="Total Ordered Value"
                    value={formatCurrency(seasonData.grandTotalTotalItemsCost || 0)}
                    icon={DollarSign}
                    color="purple"
                  />
                  <StatusCard
                    title="Balance Due"
                    value={formatCurrency(seasonData.grandTotalBalanceDue || 0)}
                    icon={TrendingUp}
                    color="orange"
                  />
                </div>

                {/* Additional Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900">Received Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Total Received Value:</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(seasonData.grandTotalReceivedValue || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Completion Rate:</span>
                          <span className="font-semibold text-slate-900">
                            {Math.round(overallProgress)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900">Progress</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>
                            Received:{" "}
                            {(seasonData.grandTotalVariantReceivedQuantity || 0).toLocaleString()}/
                            {(seasonData.grandTotalVariantQuantity || 0).toLocaleString()}
                          </span>
                          <span>{Math.round(overallProgress)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div
                            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(overallProgress, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Brand Breakdown Table */}
                {seasonData.brands && seasonData.brands.length > 0 ? (
                  <Card padding="none">
                    <div className="p-6 border-b border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-900">Brand Breakdown</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Click on the + icon to expand product type details
                      </p>
                    </div>
                    <DataTable
                      columns={columns}
                      data={createTableData()}
                      onRowClick={handleRowClick}
                      emptyMessage="No brand data available for this season"
                    />
                  </Card>
                ) : (
                  <Card className="text-center py-12">
                    <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No Brand Data Found</h3>
                    <p className="text-slate-600 mb-6">
                      No brand data is available for the selected season and brand combination.
                    </p>
                  </Card>
                )}
              </>
            )}

            {/* Empty State */}
            {!seasonData && !isSearching && !error && (
              <Card className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Select Season Parameters
                </h3>
                <p className="text-slate-600 mb-6">
                  Choose a season, brand, and year to view detailed seasonal performance data.
                </p>
                <div className="text-sm text-slate-500">
                  Features available:
                  <ul className="mt-2 space-y-1">
                    <li>• View seasonal order quantities and values</li>
                    <li>• Track receiving progress by brand</li>
                    <li>• Analyze brand performance within seasons</li>
                    <li>• Monitor outstanding balances</li>
                    <li>• Explore product type breakdowns</li>
                  </ul>
                </div>
              </Card>
            )}

            {/* Loading State */}
            {isSearching && (
              <Card className="text-center py-12">
                <Leaf className="w-16 h-16 text-slate-400 mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Season Data</h3>
                <p className="text-slate-600">
                  Please wait while we fetch the seasonal information...
                </p>
              </Card>
            )}

            {/* No Data Warning */}
            {error && seasonData && (
              <Card className="border-yellow-200 bg-yellow-50">
                <div className="flex items-center space-x-2 text-yellow-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{error}</span>
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
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import FormField from "../components/ui/FormField";
import DataTable, { Column } from "../components/ui/DataTable";
import StatusCard from "../components/ui/StatusCard";
import ServerMessagePanel from "../components/ui/ServerMessagePanel";
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
} from "lucide-react";

interface BrandSeasonData {
  brand: string;
  subTotalProductQuantity: number;
  subTotalVariantQuantity: number;
  subTotalTotalItemsCost: number;
  subTotalVariantReceivedQuantity: number;
  subTotaltotalReceivedValue: number;
  subTotalVariantReceivedQuantityProgress: number;
}

interface SeasonData {
  grandTotalVariantQuantity: number;
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
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("26");
  const [seasonData, setSeasonData] = useState<SeasonData | null>(null);
  const [generatedSeason, setGeneratedSeason] = useState<string>("");
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

      const response = await fetch(`${apiBaseUrl}${basePath}/vendors`, {
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
    if (!selectedBrand) {
      setError("Please select a brand");
      return;
    }

    const combinedSeason = selectedSeason + selectedBrand + selectedYear;
    setGeneratedSeason(combinedSeason);

    try {
      setIsSearching(true);
      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

      const response = await fetch(`${apiBaseUrl}${basePath}/getSeasonData/${combinedSeason}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch season data");
      }

      const responseJson = await response.json();
      if (responseJson && responseJson.length > 0) {
        setSeasonData(responseJson[0]);
      } else {
        setSeasonData(null);
        setError("No data found for this season");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setSeasonData(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRowClick = (brand: BrandSeasonData) => {
    navigate(`/vendors?brand=${encodeURIComponent(brand.brand)}`);
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
      ? (brand.subTotalVariantReceivedQuantityProgress / brand.subTotalVariantQuantity) * 100
      : 0;
  };

  const columns: Column[] = [
    {
      key: "brand",
      header: "Brand",
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "subTotalProductQuantity",
      header: "QTY Product Ordered",
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4 text-slate-400" />
          <span>{value}</span>
        </div>
      ),
      className: "text-center",
    },
    {
      key: "subTotalVariantQuantity",
      header: "Qty Variant Ordered",
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <ShoppingCart className="w-4 h-4 text-slate-400" />
          <span>{value}</span>
        </div>
      ),
      className: "text-center",
    },
    {
      key: "subTotalTotalItemsCost",
      header: "Ordered Value",
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-slate-400" />
          <span className="font-semibold">{formatCurrency(value)}</span>
        </div>
      ),
      className: "text-right",
    },
    {
      key: "subTotalVariantReceivedQuantity",
      header: "QTY Variant Received",
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4 text-green-500" />
          <span>{value}</span>
        </div>
      ),
      className: "text-center",
    },
    {
      key: "subTotaltotalReceivedValue",
      header: "Received Value",
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-green-500" />
          <span className="font-semibold">{formatCurrency(value)}</span>
        </div>
      ),
      className: "text-right",
    },
    {
      key: "progress",
      header: "Progress",
      render: (_, brand) => {
        const progress = calculateProgress(brand);
        return (
          <div className="w-24">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-600 w-8">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        );
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

  const overallProgress = seasonData
    ? seasonData.grandTotalVariantQuantity > 0
      ? (seasonData.grandTotalVariantReceivedQuantityProgress /
          seasonData.grandTotalVariantQuantity) *
        100
      : 0
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
                      <option value="">Select a Vendor Name</option>
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

            {/* Season Summary */}
            {seasonData && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatusCard
                    title="Total Ordered QTY"
                    value={seasonData.grandTotalVariantQuantity.toLocaleString()}
                    icon={ShoppingCart}
                    color="blue"
                  />
                  <StatusCard
                    title="Total Received QTY"
                    value={seasonData.grandTotalVariantReceivedQuantity.toLocaleString()}
                    icon={Package}
                    color="green"
                  />
                  <StatusCard
                    title="Total Ordered Value"
                    value={formatCurrency(seasonData.grandTotalTotalItemsCost)}
                    icon={DollarSign}
                    color="purple"
                  />
                  <StatusCard
                    title="Balance Due"
                    value={formatCurrency(seasonData.grandTotalBalanceDue)}
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
                            {formatCurrency(seasonData.grandTotalReceivedValue)}
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
                            {seasonData.grandTotalVariantReceivedQuantity.toLocaleString()}/
                            {seasonData.grandTotalVariantQuantity.toLocaleString()}
                          </span>
                          <span>{Math.round(overallProgress)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div
                            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${overallProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Brand Breakdown Table */}
                <Card padding="none">
                  <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">Brand Breakdown</h3>
                  </div>
                  <DataTable
                    columns={columns}
                    data={seasonData.brands}
                    onRowClick={handleRowClick}
                    emptyMessage="No brand data available for this season"
                  />
                </Card>
              </>
            )}

            {/* Empty State */}
            {!seasonData && !isSearching && (
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

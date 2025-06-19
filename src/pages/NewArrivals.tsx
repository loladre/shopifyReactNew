import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import FormField from "../components/ui/FormField";
import DataTable, { Column } from "../components/ui/DataTable";
import StatusCard from "../components/ui/StatusCard";
import ServerMessagePanel from "../components/ui/ServerMessagePanel";
import {
  Sparkles,
  Search,
  Calendar,
  Building2,
  DollarSign,
  Package,
  Image as ImageIcon,
  ExternalLink,
  AlertTriangle,
  TrendingUp,
  Eye,
  Filter,
} from "lucide-react";

interface ProductArrival {
  title: string;
  price: number;
  image?: string;
  url?: string;
}

interface BrandArrivals {
  brand: string;
  products: ProductArrival[];
}

export default function NewArrivals() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [arrivals, setArrivals] = useState<BrandArrivals[]>([]);
  const [filteredArrivals, setFilteredArrivals] = useState<BrandArrivals[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("All Brands");
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  // Set default dates to last 7 days on component mount
  useEffect(() => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const formatDate = (date: Date): string => {
      return date.toISOString().split("T")[0];
    };

    const endDateStr = formatDate(today);
    const startDateStr = formatDate(sevenDaysAgo);

    setStartDate(startDateStr);
    setEndDate(endDateStr);

    // Automatically search for the last 7 days
    searchArrivals(startDateStr, endDateStr);
  }, []);

  useEffect(() => {
    filterArrivalsByBrand();
  }, [selectedBrand, arrivals]);

  const searchArrivals = async (startDateParam?: string, endDateParam?: string) => {
    const searchStartDate = startDateParam || startDate;
    const searchEndDate = endDateParam || endDate;

    if (!searchStartDate || !searchEndDate) {
      setError("Please select both start and end dates");
      return;
    }

    try {
      setIsSearching(true);
      setError("");
      const token = localStorage.getItem("bridesbyldToken");

      if (!token) {
        navigate("/");
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/products-in-date-range`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: searchStartDate,
          endDate: searchEndDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch new arrivals");
      }

      const data: BrandArrivals[] = await response.json();
      setArrivals(data);

      // Extract unique brands
      const uniqueBrands = Array.from(new Set(data.map((brandData) => brandData.brand))).sort();
      setBrands(uniqueBrands);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setArrivals([]);
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  };

  const filterArrivalsByBrand = () => {
    if (selectedBrand === "All Brands") {
      setFilteredArrivals(arrivals);
    } else {
      setFilteredArrivals(arrivals.filter((brandData) => brandData.brand === selectedBrand));
    }
  };

  const handleSearch = () => {
    searchArrivals();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateRange = (): string => {
    if (!startDate || !endDate) return "";

    const start = new Date(startDate);
    const end = new Date(endDate);

    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} - ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  };

  // Flatten arrivals for table display
  const tableData = filteredArrivals.flatMap((brandData, brandIndex) =>
    brandData.products.map((product, productIndex) => ({
      brand: brandData.brand,
      title: product.title,
      price: product.price,
      image: product.image,
      url: product.url,
      brandIndex,
      productIndex,
      isFirstProductOfBrand: productIndex === 0,
    }))
  );

  const columns: Column[] = [
    {
      key: "brand",
      header: "Brand",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className={`${row.isFirstProductOfBrand ? "font-bold" : "text-transparent"}`}>
            {row.isFirstProductOfBrand ? value : ""}
          </span>
        </div>
      ),
    },
    {
      key: "title",
      header: "Style Name",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4 text-slate-400" />
          {row.url ? (
            <a
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 font-medium flex items-center space-x-1"
            >
              <span>{value}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="font-medium">{value}</span>
          )}
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
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
      key: "image",
      header: "Image",
      render: (value, row) => (
        <div className="flex items-center justify-center">
          {value ? (
            <img
              src={value}
              alt={row.title}
              className="w-16 h-16 object-cover rounded-lg border border-slate-200 hover:scale-110 transition-transform duration-200"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-16 h-16 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-slate-400" />
            </div>
          )}
        </div>
      ),
      className: "text-center",
    },
  ];

  // Calculate summary statistics
  const totalProducts = tableData.length;
  const totalBrands = filteredArrivals.length;
  const averagePrice =
    totalProducts > 0 ? tableData.reduce((sum, item) => sum + item.price, 0) / totalProducts : 0;
  const totalValue = tableData.reduce((sum, item) => sum + item.price, 0);

  if (error && arrivals.length === 0) {
    return (
      <Layout title="New Arrivals">
        <div className="w-full px-6 py-6">
          <Card className="text-center py-12">
            <Sparkles className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Error Loading New Arrivals
            </h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={() => searchArrivals()}>Try Again</Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="New Arrivals">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              New Arrivals: <span className="text-purple-600">{formatDateRange()}</span>
            </h1>
            <p className="text-slate-600 mt-1">
              View products that arrived within the selected date range
            </p>
          </div>
          <Button onClick={() => searchArrivals()} isLoading={isSearching}>
            Refresh Data
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-5 space-y-6">
            {/* Date Range Search */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Date Range Search
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Date Range From">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </FormField>
                  <FormField label="To">
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </FormField>
                  <FormField label="Action">
                    <Button
                      onClick={handleSearch}
                      isLoading={isSearching}
                      disabled={!startDate || !endDate}
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
            {arrivals.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatusCard
                  title="Total Products"
                  value={totalProducts}
                  icon={Package}
                  color="blue"
                />
                <StatusCard title="Brands" value={totalBrands} icon={Building2} color="green" />
                <StatusCard
                  title="Average Price"
                  value={formatCurrency(averagePrice)}
                  icon={TrendingUp}
                  color="purple"
                />
                <StatusCard
                  title="Total Value"
                  value={formatCurrency(totalValue)}
                  icon={DollarSign}
                  color="orange"
                />
              </div>
            )}

            {/* Brand Filter */}
            {brands.length > 0 && (
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
                    {brands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
            )}

            {/* New Arrivals Table */}
            {tableData.length > 0 && (
              <Card padding="none">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Product Arrivals</h3>
                </div>
                <DataTable
                  columns={columns}
                  data={tableData}
                  emptyMessage="No new arrivals found for the selected date range"
                />
              </Card>
            )}

            {/* Empty State */}
            {!isLoading && arrivals.length === 0 && !isSearching && (
              <Card className="text-center py-12">
                <Sparkles className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No New Arrivals Found</h3>
                <p className="text-slate-600 mb-6">
                  No products were found for the selected date range. Try adjusting your search
                  dates.
                </p>
                <div className="text-sm text-slate-500">
                  <p className="mb-2">Current search: {formatDateRange()}</p>
                  <p>The system automatically loaded the last 7 days on page load.</p>
                </div>
              </Card>
            )}

            {/* Loading State */}
            {isSearching && (
              <Card className="text-center py-12">
                <Sparkles className="w-16 h-16 text-slate-400 mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Searching New Arrivals
                </h3>
                <p className="text-slate-600">
                  Please wait while we fetch products for the selected date range...
                </p>
              </Card>
            )}

            {/* Brand Breakdown */}
            {filteredArrivals.length > 0 && (
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Brand Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredArrivals.map((brandData, index) => {
                      const brandTotal = brandData.products.reduce(
                        (sum, product) => sum + product.price,
                        0
                      );
                      const brandAverage =
                        brandData.products.length > 0 ? brandTotal / brandData.products.length : 0;

                      return (
                        <div key={index} className="p-4 bg-slate-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold text-slate-900">{brandData.brand}</span>
                          </div>
                          <div className="space-y-1 text-sm text-slate-600">
                            <div className="flex justify-between">
                              <span>Products:</span>
                              <span className="font-medium">{brandData.products.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Avg Price:</span>
                              <span className="font-medium">{formatCurrency(brandAverage)}</span>
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

            {/* Date Range Summary */}
            {arrivals.length > 0 && (
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Search Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Date Range:</span>
                        <span className="font-semibold text-slate-900">{formatDateRange()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Total Brands:</span>
                        <span className="font-semibold text-slate-900">{totalBrands}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Total Products:</span>
                        <span className="font-semibold text-slate-900">{totalProducts}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Average Price:</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(averagePrice)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Total Value:</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(totalValue)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Avg per Brand:</span>
                        <span className="font-semibold text-slate-900">
                          {totalBrands > 0 ? (totalProducts / totalBrands).toFixed(1) : "0"}{" "}
                          products
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

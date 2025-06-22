import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import DataTable, { Column } from "../components/ui/DataTable";
import StatusCard from "../components/ui/StatusCard";
import ServerMessagePanel from "../components/ui/ServerMessagePanel";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import {
  CheckCircle,
  Package,
  ShoppingCart,
  DollarSign,
  Calendar,
  Building2,
  Hash,
  StickyNote,
  Search,
  TrendingUp,
  Clock,
  Leaf,
} from "lucide-react";

interface PublishedOrder {
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

interface SearchFilters {
  brand: string;
  productName: string;
  productStyleNumber: string;
  variantSku: string;
}

export default function PublishedOrders() {
  const [orders, setOrders] = useState<PublishedOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PublishedOrder[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("All Brands");
  const [selectedSeason, setSelectedSeason] = useState<string>("All Seasons");
  const [brands, setBrands] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>("");
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    brand: "Any",
    productName: "",
    productStyleNumber: "",
    variantSku: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPublishedOrders();
    fetchVendors();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [selectedBrand, selectedSeason, orders]);

  const fetchPublishedOrders = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("bridesbyldToken");

      if (!token) {
        navigate("/");
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

      const response = await fetch(`${apiBaseUrl}${basePath}/published-purchase-orders-summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch published orders");
      }

      const data: PublishedOrder[] = await response.json();
      setOrders(data);

      // Extract unique brands and seasons
      const uniqueBrands = Array.from(new Set(data.map((order) => order.brand))).sort();
      const uniqueSeasons = Array.from(
        new Set(data.map((order) => order.purchaseOrderSeason).filter(Boolean))
      ).sort();

      setBrands(uniqueBrands);
      setSeasons(uniqueSeasons);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

      const response = await fetch(`${apiBaseUrl}${basePath}/vendors`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data: string[] = await response.json();
        setVendors(data.sort());
      }
    } catch (err) {
      console.error("Failed to fetch vendors:", err);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by brand
    if (selectedBrand !== "All Brands") {
      filtered = filtered.filter((order) => order.brand === selectedBrand);
    }

    // Filter by season
    if (selectedSeason !== "All Seasons") {
      filtered = filtered.filter((order) => order.purchaseOrderSeason === selectedSeason);
    }

    setFilteredOrders(filtered);
  };

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

      // Create URL with search parameters
      const url = new URL(`${apiBaseUrl}${basePath}/searchPublishedOrders`);
      url.searchParams.append("brand", searchFilters.brand || "Any");
      url.searchParams.append("productName", searchFilters.productName || "Any");
      url.searchParams.append("productStyleNumber", searchFilters.productStyleNumber || "Any");
      url.searchParams.append("variantSku", searchFilters.variantSku || "Any");

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data: PublishedOrder[] = await response.json();
      setOrders(data);

      // Update brands and seasons from search results
      const uniqueBrands = Array.from(new Set(data.map((order) => order.brand))).sort();
      const uniqueSeasons = Array.from(
        new Set(data.map((order) => order.purchaseOrderSeason).filter(Boolean))
      ).sort();

      setBrands(uniqueBrands);
      setSeasons(uniqueSeasons);

      // Reset filters when searching
      setSelectedBrand("All Brands");
      setSelectedSeason("All Seasons");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const calculateProgress = (order: PublishedOrder): number => {
    if (order.purchaseOrderCompleteReceive) {
      return 100;
    }
    return order.totalVariantQuantity > 0
      ? (order.totalVariantReceivedQuantity / order.totalVariantQuantity) * 100
      : 0;
  };

  const handleRowClick = (order: PublishedOrder) => {
    // Navigate to detailed published order page with URL parameter
    navigate(`/published-order-detail?orderId=${order.purchaseOrderID}`);
  };

  const columns: Column[] = [
    {
      key: "purchaseOrderID",
      header: "Order ID",
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Hash className="w-4 h-4 text-slate-400" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "brand",
      header: "Brand",
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: "brandPoNumber",
      header: "Brand PO Number",
      sortable: true,
    },
    {
      key: "purchaseOrderSeason",
      header: "Season",
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Leaf className="w-4 h-4 text-slate-400" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: "createdDate",
      header: "Created",
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{formatDate(value)}</span>
        </div>
      ),
    },
    {
      key: "startShipDate",
      header: "Start Ship",
      sortable: true,
      render: (value) => formatDate(value),
    },
    {
      key: "completedDate",
      header: "Complete",
      sortable: true,
      render: (value) => formatDate(value),
    },
    {
      key: "totalProductQuantity",
      header: "Products",
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4 text-slate-400" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: "totalVariantQuantity",
      header: "Variants",
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <ShoppingCart className="w-4 h-4 text-slate-400" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: "totalVariantReceivedQuantity",
      header: "Received",
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: "progress",
      header: "Progress",
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
      },
    },
    {
      key: "purchaseOrderNotes",
      header: "Notes",
      render: (value) => (
        <div className="flex items-center space-x-2 max-w-xs">
          <StickyNote className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="truncate" title={value}>
            {value || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "purchaseOrderTotalItemsCost",
      header: "Items Cost",
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-slate-400" />
          <span className="font-semibold">{formatCurrency(value)}</span>
        </div>
      ),
    },
  ];

  // Calculate summary statistics
  const totalOrders = filteredOrders.length;
  const totalProducts = filteredOrders.reduce((sum, order) => sum + order.totalProductQuantity, 0);
  const totalVariants = filteredOrders.reduce((sum, order) => sum + order.totalVariantQuantity, 0);
  const totalReceived = filteredOrders.reduce(
    (sum, order) => sum + order.totalVariantReceivedQuantity,
    0
  );
  const totalCost = filteredOrders.reduce(
    (sum, order) => sum + order.purchaseOrderTotalItemsCost,
    0
  );
  const overallProgress = totalVariants > 0 ? (totalReceived / totalVariants) * 100 : 0;

  if (error) {
    return (
      <Layout title="Published Orders">
        <div className="w-full px-6 py-6">
          <Card className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Error Loading Published Orders
            </h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={fetchPublishedOrders}>Try Again</Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Published Orders">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Published Orders List</h1>
            <p className="text-slate-600 mt-1">View and manage your published purchase orders</p>
          </div>
          <Button onClick={fetchPublishedOrders} isLoading={isLoading}>
            Refresh Orders
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-5 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusCard
                title="Total Orders"
                value={totalOrders}
                icon={CheckCircle}
                color="blue"
              />
              <StatusCard
                title="Total Products"
                value={totalProducts}
                icon={Package}
                color="green"
              />
              <StatusCard
                title="Overall Progress"
                value={`${Math.round(overallProgress)}%`}
                icon={TrendingUp}
                color="purple"
              />
              <StatusCard
                title="Total Cost"
                value={formatCurrency(totalCost)}
                icon={DollarSign}
                color="orange"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Brand and Season Filters */}
              <Card>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700">Filter Orders</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="brandSelect"
                        className="block text-xs font-medium text-slate-600 mb-1"
                      >
                        Filter by Brand:
                      </label>
                      <select
                        id="brandSelect"
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="All Brands">All Brands</option>
                        {brands.map((brand) => (
                          <option key={brand} value={brand}>
                            {brand}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="seasonSelect"
                        className="block text-xs font-medium text-slate-600 mb-1"
                      >
                        Filter by Season:
                      </label>
                      <select
                        id="seasonSelect"
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="All Seasons">All Seasons</option>
                        {seasons.map((season) => (
                          <option key={season} value={season}>
                            {season}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Search Filters */}
              <Card>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700">Search Orders</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Brand</label>
                      <select
                        value={searchFilters.brand}
                        onChange={(e) =>
                          setSearchFilters((prev) => ({ ...prev, brand: e.target.value }))
                        }
                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="Any">Choose...</option>
                        {vendors.map((vendor) => (
                          <option key={vendor} value={vendor}>
                            {vendor}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                      <Input
                        type="text"
                        value={searchFilters.productName}
                        onChange={(e) =>
                          setSearchFilters((prev) => ({ ...prev, productName: e.target.value }))
                        }
                        placeholder="Any"
                        className="text-sm py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Style</label>
                      <Input
                        type="text"
                        value={searchFilters.productStyleNumber}
                        onChange={(e) =>
                          setSearchFilters((prev) => ({
                            ...prev,
                            productStyleNumber: e.target.value,
                          }))
                        }
                        placeholder="Any"
                        className="text-sm py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">SKU</label>
                      <Input
                        type="text"
                        value={searchFilters.variantSku}
                        onChange={(e) =>
                          setSearchFilters((prev) => ({ ...prev, variantSku: e.target.value }))
                        }
                        placeholder="Any"
                        className="text-sm py-1"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSearch}
                    isLoading={isSearching}
                    size="sm"
                    className="w-full"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </Card>
            </div>

            {/* Orders Table */}
            <DataTable
              columns={columns}
              data={filteredOrders}
              onRowClick={handleRowClick}
              emptyMessage={isLoading ? "Loading orders..." : "No published orders found"}
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

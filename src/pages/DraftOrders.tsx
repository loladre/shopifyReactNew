import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import DataTable, { Column } from "../components/ui/DataTable";
import StatusCard from "../components/ui/StatusCard";
import ServerMessagePanel from "../components/ui/ServerMessagePanel";
import Button from "../components/ui/Button";
import {
  FileText,
  Package,
  ShoppingCart,
  DollarSign,
  Calendar,
  Building2,
  Hash,
  StickyNote,
  Eye,
} from "lucide-react";

interface DraftOrder {
  purchaseOrderID: string;
  brand: string;
  brandPoNumber: string;
  createdDate: string;
  startShipDate: string;
  completedDate: string;
  totalProductQuantity: number;
  totalVariantQuantity: number;
  purchaseOrderNotes: string;
  purchaseOrderTotalItemsCost: number;
}

export default function DraftOrders() {
  const [orders, setOrders] = useState<DraftOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<DraftOrder[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("All Brands");
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchDraftOrders();
  }, []);

  useEffect(() => {
    filterOrdersByBrand();
  }, [selectedBrand, orders]);

  const fetchDraftOrders = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("bridesbyldToken");

      if (!token) {
        navigate("/");
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

      const response = await fetch(
        `${apiBaseUrl}${basePath}/shopify/draft-purchase-orders-summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch draft orders");
      }

      const data: DraftOrder[] = await response.json();
      setOrders(data);

      // Extract unique brands
      const uniqueBrands = Array.from(new Set(data.map((order) => order.brand))).sort();
      setBrands(uniqueBrands);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrdersByBrand = () => {
    if (selectedBrand === "All Brands") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((order) => order.brand === selectedBrand));
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

  const handleRowClick = (order: DraftOrder) => {
    // Navigate to detailed draft order page with URL parameter
    navigate(`/draft-order-detail?orderId=${order.purchaseOrderID}`);
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
      header: "Total Cost",
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
  const totalCost = filteredOrders.reduce(
    (sum, order) => sum + order.purchaseOrderTotalItemsCost,
    0
  );

  if (error) {
    return (
      <Layout title="Draft Orders">
        <div className="w-full px-6 py-6">
          <Card className="text-center py-12">
            <FileText className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Error Loading Draft Orders
            </h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={fetchDraftOrders}>Try Again</Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Draft Orders">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Draft Orders List</h1>
            <p className="text-slate-600 mt-1">Review and manage your draft purchase orders</p>
          </div>
          <Button onClick={fetchDraftOrders} isLoading={isLoading}>
            Refresh Orders
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-5 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusCard title="Total Orders" value={totalOrders} icon={FileText} color="blue" />
              <StatusCard
                title="Total Products"
                value={totalProducts}
                icon={Package}
                color="green"
              />
              <StatusCard
                title="Total Variants"
                value={totalVariants}
                icon={ShoppingCart}
                color="purple"
              />
              <StatusCard
                title="Total Cost"
                value={formatCurrency(totalCost)}
                icon={DollarSign}
                color="orange"
              />
            </div>

            {/* Brand Filter */}
            <Card>
              <div className="flex items-center space-x-4">
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

            {/* Orders Table */}
            <DataTable
              columns={columns}
              data={filteredOrders}
              onRowClick={handleRowClick}
              emptyMessage={isLoading ? "Loading orders..." : "No draft orders found"}
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

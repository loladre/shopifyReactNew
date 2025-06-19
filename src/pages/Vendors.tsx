import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import FormField from "../components/ui/FormField";
import DataTable, { Column } from "../components/ui/DataTable";
import StatusCard from "../components/ui/StatusCard";
import ServerMessagePanel from "../components/ui/ServerMessagePanel";
import {
  Building2,
  Search,
  Plus,
  Save,
  X,
  Calendar,
  DollarSign,
  FileText,
  Package,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Bell,
  Hash,
  TrendingUp,
  Clock,
  Leaf,
} from "lucide-react";

interface VendorOrder {
  purchaseOrderID: string;
  brandPoNumber: string;
  purchaseOrderSeason: string;
  startShipDate: string;
  completedDate: string;
  totalProductQuantity: number;
  totalVariantQuantity: number;
  totalVariantReceivedQuantity: number;
  purchaseOrderCompleteReceive: boolean;
  purchaseOrderTotalItemsCost: number;
  purchaseOrderTotalPayments: number;
  purchaseOrderTotalCredits: number;
  totalOrderInvoices: number;
  purchaseOrderBalanceDue: number;
}

interface PaymentReminder {
  vendorAmountToPayDate: string;
  vendorAmountToPay: number;
  vendorAmoutToPayDescription: string;
  vendorAmountToPayMethod: string;
}

interface NewPaymentReminder {
  vendorAmountToPayDate: string;
  vendorAmountToPay: number;
  vendorAmoutToPayDescription: string;
  vendorAmountToPayMethod: string;
}

interface VendorData {
  purchaseOrders: VendorOrder[];
  paymentReminders: PaymentReminder[];
}

export default function Vendors() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const brandFromUrl = searchParams.get("brand");

  const [vendors, setVendors] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>(brandFromUrl || "Any");
  const [selectedSeason, setSelectedSeason] = useState<string>("All Seasons");
  const [searchFilters, setSearchFilters] = useState({
    styleName: "Any",
    styleNumber: "",
  });

  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<VendorOrder[]>([]);
  const [paymentReminders, setPaymentReminders] = useState<PaymentReminder[]>([]);
  const [newReminders, setNewReminders] = useState<NewPaymentReminder[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isSavingReminders, setIsSavingReminders] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (brandFromUrl) {
      performSearch(brandFromUrl);
    }
  }, [brandFromUrl]);

  useEffect(() => {
    filterOrdersBySeason();
  }, [selectedSeason, orders]);

  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("bridesbyldToken");

      if (!token) {
        navigate("/");
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

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

  const performSearch = async (brandSearch: string) => {
    try {
      setIsSearching(true);
      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

      const url = new URL(`${apiBaseUrl}${basePath}/shopify/searchPublishedOrdersForVendors`);
      url.searchParams.append("brand", brandSearch);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data: VendorData = await response.json();
      setOrders(data.purchaseOrders);
      setPaymentReminders(data.paymentReminders);

      // Extract unique seasons
      const uniqueSeasons = Array.from(
        new Set(data.purchaseOrders.map((order) => order.purchaseOrderSeason).filter(Boolean))
      ).sort();
      setSeasons(uniqueSeasons);

      setSelectedBrand(brandSearch);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const filterOrdersBySeason = () => {
    if (selectedSeason === "All Seasons") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((order) => order.purchaseOrderSeason === selectedSeason));
    }
  };

  const handleSearch = () => {
    if (selectedBrand && selectedBrand !== "Any") {
      performSearch(selectedBrand);
    }
  };

  const addNewReminder = () => {
    const today = new Date().toISOString().split("T")[0];
    setNewReminders([
      ...newReminders,
      {
        vendorAmountToPayDate: today,
        vendorAmountToPay: 0,
        vendorAmoutToPayDescription: "",
        vendorAmountToPayMethod: "Wire",
      },
    ]);
  };

  const removeNewReminder = (index: number) => {
    setNewReminders(newReminders.filter((_, i) => i !== index));
  };

  const updateNewReminder = (index: number, field: keyof NewPaymentReminder, value: any) => {
    const updated = [...newReminders];
    updated[index] = { ...updated[index], [field]: value };
    setNewReminders(updated);
  };

  const saveReminders = async () => {
    if (!selectedBrand || selectedBrand === "Any") return;

    try {
      setIsSavingReminders(true);
      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

      const remindersToSave = {
        vendor: selectedBrand,
        paymentReminders: [...paymentReminders, ...newReminders],
      };

      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/savePaymentReminders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(remindersToSave),
      });

      if (!response.ok) {
        throw new Error("Failed to save reminders");
      }

      // Refresh the data
      await performSearch(selectedBrand);
      setNewReminders([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save reminders");
    } finally {
      setIsSavingReminders(false);
    }
  };

  const markReminderAsPaid = (index: number) => {
    const updatedReminders = paymentReminders.filter((_, i) => i !== index);
    setPaymentReminders(updatedReminders);
    saveReminders();
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

  const calculateProgress = (order: VendorOrder): number => {
    if (order.purchaseOrderCompleteReceive) return 100;
    return order.totalVariantQuantity > 0
      ? (order.totalVariantReceivedQuantity / order.totalVariantQuantity) * 100
      : 0;
  };

  const getDateStatus = (dateString: string): "normal" | "warning" | "danger" => {
    const today = new Date();
    const date = new Date(dateString);
    const timeDiff = (date.getTime() - today.getTime()) / (1000 * 3600 * 24);

    if (timeDiff <= 2 && timeDiff >= -3) return "warning";
    if (timeDiff < -3) return "danger";
    return "normal";
  };

  const getOrderDateStatus = (
    order: VendorOrder,
    isStartShip: boolean = false
  ): "normal" | "warning" | "danger" => {
    const today = new Date();
    const date = new Date(isStartShip ? order.startShipDate : order.completedDate);
    const timeDiff = (date.getTime() - today.getTime()) / (1000 * 3600 * 24);
    const percentageReceived = order.totalVariantReceivedQuantity / order.totalVariantQuantity;

    if (percentageReceived >= 1 || order.purchaseOrderCompleteReceive) return "normal";

    if (isStartShip) {
      if (timeDiff >= 0 && timeDiff <= 14) return "warning";
      if (timeDiff < 0) return "danger";
    } else {
      const startShipDate = new Date(order.startShipDate);
      const startShipTimeDiff = (startShipDate.getTime() - today.getTime()) / (1000 * 3600 * 24);

      if (startShipTimeDiff < 0) {
        if (timeDiff >= 0 && timeDiff <= 14) return "warning";
        if (timeDiff < 0) return "danger";
      }
    }

    return "normal";
  };

  const handleRowClick = (order: VendorOrder) => {
    navigate(`/published-order-detail?orderId=${order.purchaseOrderID}`);
  };

  // Order table columns
  const orderColumns: Column[] = [
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
      key: "startShipDate",
      header: "Start Ship",
      sortable: true,
      render: (value, order) => {
        const status = getOrderDateStatus(order, true);
        const baseClasses = "px-2 py-1 rounded text-sm";

        let statusClasses = "";
        switch (status) {
          case "warning":
            statusClasses = "bg-yellow-100 text-yellow-800";
            break;
          case "danger":
            statusClasses = "bg-red-100 text-red-800";
            break;
          default:
            statusClasses = "";
        }

        return (
          <span className={status !== "normal" ? `${baseClasses} ${statusClasses}` : ""}>
            {formatDate(value)}
          </span>
        );
      },
    },
    {
      key: "completedDate",
      header: "Complete",
      sortable: true,
      render: (value, order) => {
        const status = getOrderDateStatus(order, false);
        const baseClasses = "px-2 py-1 rounded text-sm";

        let statusClasses = "";
        switch (status) {
          case "warning":
            statusClasses = "bg-yellow-100 text-yellow-800";
            break;
          case "danger":
            statusClasses = "bg-red-100 text-red-800";
            break;
          default:
            statusClasses = "";
        }

        return (
          <span className={status !== "normal" ? `${baseClasses} ${statusClasses}` : ""}>
            {formatDate(value)}
          </span>
        );
      },
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
      key: "purchaseOrderTotalItemsCost",
      header: "Cost",
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
      key: "purchaseOrderTotalPayments",
      header: "Payments",
      sortable: true,
      render: (value, order) => {
        const isOverpaid =
          value - order.purchaseOrderTotalCredits > order.purchaseOrderTotalItemsCost ||
          value > order.totalOrderInvoices;
        return (
          <span className={`font-semibold ${isOverpaid ? "text-red-600" : ""}`}>
            {formatCurrency(value)}
          </span>
        );
      },
      className: "text-right",
    },
    {
      key: "purchaseOrderTotalCredits",
      header: "Credits",
      sortable: true,
      render: (value) => formatCurrency(value),
      className: "text-right",
    },
    {
      key: "totalOrderInvoices",
      header: "Invoices",
      sortable: true,
      render: (value, order) => {
        const isUnderInvoiced = value < order.purchaseOrderTotalItemsCost;
        return (
          <span className={`font-semibold ${isUnderInvoiced ? "text-red-600" : ""}`}>
            {formatCurrency(value)}
          </span>
        );
      },
      className: "text-right",
    },
    {
      key: "purchaseOrderBalanceDue",
      header: "Balance",
      sortable: true,
      render: (value) => <span className="font-bold">{formatCurrency(value)}</span>,
      className: "text-right",
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
  const totalBalance = filteredOrders.reduce(
    (sum, order) => sum + order.purchaseOrderBalanceDue,
    0
  );
  const overallProgress = totalVariants > 0 ? (totalReceived / totalVariants) * 100 : 0;

  // Calculate upcoming reminders
  const upcomingReminders = paymentReminders.filter((reminder) => {
    const status = getDateStatus(reminder.vendorAmountToPayDate);
    return status === "warning" || status === "danger";
  }).length;

  if (error) {
    return (
      <Layout title="Vendors">
        <div className="w-full px-6 py-6">
          <Card className="text-center py-12">
            <Building2 className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Vendors</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={fetchVendors}>Try Again</Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Vendors">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Vendors</h1>
            <p className="text-slate-600 mt-1">Manage vendor relationships and payment reminders</p>
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
                <h3 className="text-lg font-semibold text-slate-900">Search Vendor Orders</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField label="Search by Brand">
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="Any">Choose...</option>
                      {vendors.map((vendor) => (
                        <option key={vendor} value={vendor}>
                          {vendor}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Style Name">
                    <Input
                      value={searchFilters.styleName}
                      onChange={(e) =>
                        setSearchFilters((prev) => ({ ...prev, styleName: e.target.value }))
                      }
                      placeholder="Any"
                    />
                  </FormField>
                  <FormField label="Style Number">
                    <Input
                      value={searchFilters.styleNumber}
                      onChange={(e) =>
                        setSearchFilters((prev) => ({ ...prev, styleNumber: e.target.value }))
                      }
                      placeholder="Any"
                    />
                  </FormField>
                  <FormField label="Action">
                    <Button
                      onClick={handleSearch}
                      isLoading={isSearching}
                      disabled={selectedBrand === "Any"}
                      className="w-full"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </FormField>
                </div>
              </div>
            </Card>

            {/* Vendor Summary */}
            {selectedBrand !== "Any" && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatusCard
                    title="Total Orders"
                    value={totalOrders}
                    icon={FileText}
                    color="blue"
                  />
                  <StatusCard
                    title="Open Balance"
                    value={formatCurrency(totalBalance)}
                    icon={DollarSign}
                    color="orange"
                  />
                  <StatusCard
                    title="Overall Progress"
                    value={`${Math.round(overallProgress)}%`}
                    icon={TrendingUp}
                    color="green"
                  />
                  <StatusCard
                    title="Payment Alerts"
                    value={upcomingReminders}
                    icon={Bell}
                    color="red"
                  />
                </div>

                {/* Vendor Info and Payment Reminders */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-6 h-6 text-purple-600" />
                        <h3 className="text-lg font-semibold text-slate-900">
                          Brand: {selectedBrand}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-slate-400" />
                        <span className="font-semibold text-slate-900">Open Balance:</span>
                        <span className="text-lg font-bold text-slate-900">
                          {formatCurrency(totalBalance)}
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Payment Reminders</h3>
                        <div className="flex space-x-2">
                          <Button onClick={addNewReminder} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Reminder
                          </Button>
                          <Button
                            onClick={saveReminders}
                            isLoading={isSavingReminders}
                            disabled={newReminders.length === 0}
                            size="sm"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                        </div>
                      </div>

                      {/* Existing Reminders */}
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {paymentReminders.map((reminder, index) => {
                          const status = getDateStatus(reminder.vendorAmountToPayDate);
                          return (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border ${
                                status === "danger"
                                  ? "bg-red-50 border-red-200"
                                  : status === "warning"
                                  ? "bg-yellow-50 border-yellow-200"
                                  : "bg-slate-50 border-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 text-sm">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span>{formatDate(reminder.vendorAmountToPayDate)}</span>
                                    <span className="font-semibold">
                                      {formatCurrency(reminder.vendorAmountToPay)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-600 mt-1">
                                    {reminder.vendorAmoutToPayDescription}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {reminder.vendorAmountToPayMethod}
                                  </p>
                                </div>
                                <Button
                                  onClick={() => markReminderAsPaid(index)}
                                  size="sm"
                                  variant="outline"
                                >
                                  Paid
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* New Reminders */}
                      {newReminders.map((reminder, index) => (
                        <Card
                          key={index}
                          className="border-2 border-dashed border-blue-200 bg-blue-50"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField label="Date">
                              <Input
                                type="date"
                                value={reminder.vendorAmountToPayDate}
                                onChange={(e) =>
                                  updateNewReminder(index, "vendorAmountToPayDate", e.target.value)
                                }
                              />
                            </FormField>
                            <FormField label="Amount">
                              <Input
                                type="number"
                                step="0.01"
                                value={reminder.vendorAmountToPay}
                                onChange={(e) =>
                                  updateNewReminder(
                                    index,
                                    "vendorAmountToPay",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="0.00"
                              />
                            </FormField>
                            <FormField label="Description">
                              <Input
                                value={reminder.vendorAmoutToPayDescription}
                                onChange={(e) =>
                                  updateNewReminder(
                                    index,
                                    "vendorAmoutToPayDescription",
                                    e.target.value
                                  )
                                }
                                placeholder="Payment description"
                              />
                            </FormField>
                            <FormField label="Method">
                              <div className="flex space-x-2">
                                <select
                                  value={reminder.vendorAmountToPayMethod}
                                  onChange={(e) =>
                                    updateNewReminder(
                                      index,
                                      "vendorAmountToPayMethod",
                                      e.target.value
                                    )
                                  }
                                  className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                >
                                  <option value="Wire">Wire</option>
                                  <option value="Credit Card">Credit Card</option>
                                </select>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => removeNewReminder(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </FormField>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Season Filter */}
                {seasons.length > 0 && (
                  <Card>
                    <div className="flex items-center space-x-4">
                      <label
                        htmlFor="seasonSelect"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Filter by Season:
                      </label>
                      <select
                        id="seasonSelect"
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="All Seasons">All Seasons</option>
                        {seasons.map((season) => (
                          <option key={season} value={season}>
                            {season}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Card>
                )}

                {/* Orders Table */}
                <DataTable
                  columns={orderColumns}
                  data={filteredOrders}
                  onRowClick={handleRowClick}
                  emptyMessage={
                    isSearching ? "Searching orders..." : "No orders found for this vendor"
                  }
                />
              </>
            )}

            {/* Empty State */}
            {selectedBrand === "Any" && (
              <Card className="text-center py-12">
                <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a Vendor</h3>
                <p className="text-slate-600 mb-6">
                  Choose a vendor from the dropdown above to view their orders and manage payment
                  reminders.
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

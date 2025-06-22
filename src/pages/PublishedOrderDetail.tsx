import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import FormField from "../components/ui/FormField";
import ProductTable, { ProductTableColumn, Product } from "../components/ui/ProductTable";
import PaymentTable, { Payment, Credit } from "../components/ui/PaymentTable";
import ServerMessagePanel from "../components/ui/ServerMessagePanel";
import {
  FileText,
  Building2,
  Calendar,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle,
  Edit,
  Save,
  Upload,
  X,
  Plus,
  Settings,
  Leaf,
  Clock,
  TrendingUp,
} from "lucide-react";

interface PublishedOrderDetail {
  purchaseOrderID: string;
  brand: string;
  purchaseOrderSeason: string;
  createdDate: string;
  startShipDate: string;
  completedDate: string;
  brandPoNumber: string;
  terms: string;
  depositPercent: number;
  onDeliverPercent: number;
  net30Percent: number;
  purchaseOrderNotes: string;
  purchaseOrderTotalItemsCost: number;
  purchaseOrderTotalPayments: number;
  purchaseOrderTotalCredits: number;
  purchaseOrderBalanceDue: number;
  totalProductQuantity: number;
  totalVariantQuantity: number;
  totalVariantReceivedQuantity: number;
  purchaseOrderCompleteReceive: boolean;
  products: Product[];
  purchaseOrderPayments: Payment[];
  purchaseOrderCredits: Credit[];
  purchaseOrderFiles: Array<{
    fileName: string;
    filePath: string;
  }>;
}

interface NewPayment {
  paymentDate: string;
  paymentDescription: string;
  paymentMethod: string;
  paymentAmount: number;
  paymentType: string;
  paymentInvoiceNumber: string;
  paymentInvoiceAmount: number;
}

interface NewCredit {
  creditDate: string;
  creditDescription: string;
  creditMethod: string;
  creditAmount: number;
}

export default function PublishedOrderDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<PublishedOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Edit states

  const [isEditingCancelDate, setIsEditingCancelDate] = useState(false);

  const [newCancelDate, setNewCancelDate] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Payment and Credit states
  const [newPayments, setNewPayments] = useState<NewPayment[]>([]);
  const [newCredits, setNewCredits] = useState<NewCredit[]>([]);

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail(orderId);
    } else {
      setError("No order ID provided");
      setIsLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetail = async (purchaseOrderId: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("bridesbyldToken");

      if (!token) {
        navigate("/");
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

      const response = await fetch(
        `${apiBaseUrl}${basePath}/getPublishedOrderById/${purchaseOrderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("Purchase order not found");
        } else {
          throw new Error("Failed to fetch order details");
        }
        return;
      }

      const data: PublishedOrderDetail = await response.json();
      setOrder(data);
      setNewCancelDate(data.completedDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveOrder = async () => {
    if (!order) return;

    try {
      setIsSaving(true);
      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;
      const shopifyAdminProductUrl =
        import.meta.env.VITE_SHOPIFY_PRODUCT_ADMIN ||
        "https://lola-dre.myshopify.com/admin/products/";

      // Prepare the update payload
      const updatePayload = {
        purchaseOrderID: order.purchaseOrderID,
        purchaseOrderNotes: additionalNotes || order.purchaseOrderNotes,
        purchaseOrderCompleteReceive: order.purchaseOrderCompleteReceive,
        purchaseOrderPayments: [...order.purchaseOrderPayments, ...newPayments],
        purchaseOrderCredits: [...order.purchaseOrderCredits, ...newCredits],
        // Include other necessary fields
        terms: order.terms,
        depositPercent: order.depositPercent,
        onDeliverPercent: order.onDeliverPercent,
        net30Percent: order.net30Percent,
        totalVariantQuantity: order.totalVariantQuantity,
        purchaseOrderTotalPayments: calculateTotalPayments(),
        purchaseOrderTotalCredits: calculateTotalCredits(),
        purchaseOrderTotalItemsCost: order.purchaseOrderTotalItemsCost,
        purchaseOrderBalanceDue: calculateBalanceDue(),
        products: order.products,
        purchaseOrderFiles: order.purchaseOrderFiles,
      };

      const response = await fetch(
        `${apiBaseUrl}${basePath}/updatePurchaseOrderByIdNoShopify/${order.purchaseOrderID}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save order");
      }

      // Refresh the order data
      await fetchOrderDetail(order.purchaseOrderID);

      // Reset new payments and credits
      setNewPayments([]);
      setNewCredits([]);
      setAdditionalNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save order");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditOrder = () => {
    if (order) {
      // Navigate to the edit order page (to be implemented later)
      navigate(`/edit-published-order?orderId=${order.purchaseOrderID}`);
    }
  };

  const handleReceiveInventory = () => {
    if (order) {
      // Navigate to the receive inventory page (to be implemented later)
      navigate(`/receive-inventory?orderId=${order.purchaseOrderID}`);
    }
  };

  const addNewPayment = () => {
    const today = new Date().toISOString().split("T")[0];
    setNewPayments([
      ...newPayments,
      {
        paymentDate: today,
        paymentDescription: "",
        paymentMethod: "Wire",
        paymentAmount: 0,
        paymentType: "Invoice",
        paymentInvoiceNumber: "",
        paymentInvoiceAmount: 0,
      },
    ]);
  };

  const addNewCredit = () => {
    const today = new Date().toISOString().split("T")[0];
    setNewCredits([
      ...newCredits,
      {
        creditDate: today,
        creditDescription: "",
        creditMethod: "Note",
        creditAmount: 0,
      },
    ]);
  };

  const removeNewPayment = (index: number) => {
    setNewPayments(newPayments.filter((_, i) => i !== index));
  };

  const removeNewCredit = (index: number) => {
    setNewCredits(newCredits.filter((_, i) => i !== index));
  };

  const updateNewPayment = (index: number, field: keyof NewPayment, value: any) => {
    const updated = [...newPayments];
    updated[index] = { ...updated[index], [field]: value };
    setNewPayments(updated);
  };

  const updateNewCredit = (index: number, field: keyof NewCredit, value: any) => {
    const updated = [...newCredits];
    updated[index] = { ...updated[index], [field]: value };
    setNewCredits(updated);
  };

  const calculateTotalPayments = (): number => {
    if (!order) return 0;
    const existingTotal = order.purchaseOrderTotalPayments;
    const newTotal = newPayments.reduce((sum, payment) => sum + payment.paymentAmount, 0);
    return existingTotal + newTotal;
  };

  const calculateTotalCredits = (): number => {
    if (!order) return 0;
    const existingTotal = order.purchaseOrderTotalCredits;
    const newTotal = newCredits.reduce((sum, credit) => sum + credit.creditAmount, 0);
    return existingTotal + newTotal;
  };

  const calculateBalanceDue = (): number => {
    if (!order) return 0;
    return order.purchaseOrderTotalItemsCost - calculateTotalPayments() - calculateTotalCredits();
  };

  const calculateProgress = (): number => {
    if (!order) return 0;
    if (order.purchaseOrderCompleteReceive) return 100;
    return order.totalVariantQuantity > 0
      ? (order.totalVariantReceivedQuantity / order.totalVariantQuantity) * 100
      : 0;
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

  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 2,
    }).format(value / 100);
  };

  // Product table columns
  const shopifyAdminProductUrl = import.meta.env.VITE_SHOPIFY_PRODUCT_ADMIN;
  const productColumns: ProductTableColumn[] = [
    {
      key: "product.productName",
      header: "Name",
      sortable: true,
      render: (value, _, product) => (
        <a
          href={`${shopifyAdminProductUrl}${product?.productShopifyGid?.split("/").pop()}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 hover:text-purple-800 font-medium"
        >
          {value}
        </a>
      ),
    },
    {
      key: "variantColor",
      header: "Color",
      sortable: true,
    },
    {
      key: "variantSize",
      header: "Size",
      sortable: true,
    },
    {
      key: "variantQuantity",
      header: "QTY",
      sortable: true,
      className: "text-center",
    },
    {
      key: "variantCost",
      header: "Cost",
      sortable: true,
      render: (value) => formatCurrency(value),
      className: "text-right",
    },
    {
      key: "variantRetail",
      header: "Retail",
      sortable: true,
      render: (value) => formatCurrency(value),
      className: "text-right",
    },
    {
      key: "variantSku",
      header: "SKU",
      sortable: true,
    },
    {
      key: "product.productType",
      header: "P-Type",
      sortable: true,
    },
    {
      key: "product.productTags",
      header: "Tags",
      sortable: true,
    },
    {
      key: "variantPreOrder",
      header: "Preorder",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            value === "true" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "margin",
      header: "Margin",
      render: (_, variant) => {
        const margin =
          variant.variantRetail !== 0
            ? (variant.variantRetail - variant.variantCost) / variant.variantRetail
            : 0;
        return formatPercentage(margin * 100);
      },
      className: "text-right",
    },
    {
      key: "status",
      header: "Status",
      render: (_, variant, product) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            product?.productCanceled ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
          }`}
        >
          {product?.productCanceled ? "Canceled" : "Active"}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      render: (_, variant) => formatCurrency(variant.variantCost * variant.variantQuantity),
      className: "text-right font-semibold",
    },
    {
      key: "variantMetafieldCategory",
      header: "CAT",
    },
  ];

  if (isLoading) {
    return (
      <Layout title="Published Order Detail">
        <div className="w-full px-6 py-6">
          <Card className="text-center py-12">
            <Package className="w-16 h-16 text-slate-400 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Order Details</h3>
            <p className="text-slate-600">Please wait while we fetch the order information...</p>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout title="Published Order Detail">
        <div className="w-full px-6 py-6">
          <Card className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Order</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={() => navigate("/published-orders")}>Back to Published Orders</Button>
          </Card>
        </div>
      </Layout>
    );
  }

  const progress = calculateProgress();

  return (
    <Layout title={`Published Order #${order.purchaseOrderID}`}>
      <div className="w-full px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-5 space-y-6">
            {/* Header */}
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      Order #{order.purchaseOrderID}
                    </h1>
                    <p className="text-green-600 font-medium">Status: Published</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={order.purchaseOrderCompleteReceive}
                      onChange={(e) =>
                        setOrder({ ...order, purchaseOrderCompleteReceive: e.target.checked })
                      }
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Receive Complete</span>
                  </label>
                  <Button onClick={() => navigate("/published-orders")} variant="outline">
                    Back to List
                  </Button>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <Card>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleEditOrder} variant="secondary">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Order
                </Button>
                <Button onClick={handleReceiveInventory} variant="secondary">
                  <Package className="w-4 h-4 mr-2" />
                  Receive Inventory
                </Button>
                <Button variant="secondary">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Sizes
                </Button>
              </div>
            </Card>

            {/* Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">Brand:</span>
                    <span className="text-slate-700">{order.brand}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900">Season:</span>
                    <span className="text-slate-700">{order.purchaseOrderSeason}</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <span className="font-semibold text-slate-900">Brand PO#:</span>
                      <span className="text-slate-700">{order.brandPoNumber}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          Received: {order.totalVariantReceivedQuantity}/
                          {order.totalVariantQuantity}
                        </span>
                        <span>Products: {order.totalProductQuantity}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-center text-sm font-medium text-slate-600">
                        {Math.round(progress)}% Complete
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">Created:</span>
                    <span className="text-slate-700">{formatDate(order.createdDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">Start Ship:</span>
                    <span className="text-slate-700">{formatDate(order.startShipDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">Cancel:</span>
                    <span className="text-slate-700">{formatDate(order.completedDate)}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingCancelDate(!isEditingCancelDate)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                  {isEditingCancelDate && (
                    <div className="space-y-2">
                      <Input
                        type="date"
                        value={newCancelDate}
                        onChange={(e) => setNewCancelDate(e.target.value)}
                      />
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => setIsEditingCancelDate(false)}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingCancelDate(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <span className="font-semibold text-slate-900">Terms:</span>
                  <span className="text-slate-700">{order.terms}</span>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-slate-900">Payment Terms:</span>
                  <p className="text-sm text-slate-700">
                    Deposit: {order.depositPercent}% - Delivery: {order.onDeliverPercent}% - Net30:{" "}
                    {order.net30Percent}%
                  </p>
                </div>
              </Card>
            </div>

            {/* Products Table */}
            <Card padding="none">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Order Items</h3>
              </div>
              <ProductTable
                columns={productColumns}
                products={order.products}
                emptyMessage="No products in this order"
                showAlternatingRows={true}
              />
            </Card>

            {/* Credits Section */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Credits</h3>
                  <Button onClick={addNewCredit} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Credit
                  </Button>
                </div>

                {/* Existing Credits */}
                <PaymentTable title="" data={order.purchaseOrderCredits} type="credits" />

                {/* New Credits */}
                {newCredits.map((credit, index) => (
                  <Card key={index} className="border-2 border-dashed border-blue-200 bg-blue-50">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <FormField label="Date">
                        <Input
                          type="date"
                          value={credit.creditDate}
                          onChange={(e) => updateNewCredit(index, "creditDate", e.target.value)}
                        />
                      </FormField>
                      <FormField label="Description">
                        <Input
                          value={credit.creditDescription}
                          onChange={(e) =>
                            updateNewCredit(index, "creditDescription", e.target.value)
                          }
                          placeholder="Credit description"
                        />
                      </FormField>
                      <FormField label="Method">
                        <select
                          value={credit.creditMethod}
                          onChange={(e) => updateNewCredit(index, "creditMethod", e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="Note">Note</option>
                          <option value="Credit Card">Credit Card</option>
                          <option value="Wire">Wire</option>
                        </select>
                      </FormField>
                      <FormField label="Amount">
                        <div className="flex space-x-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={credit.creditAmount}
                            onChange={(e) =>
                              updateNewCredit(
                                index,
                                "creditAmount",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0.00"
                          />
                          <Button variant="danger" size="sm" onClick={() => removeNewCredit(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </FormField>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Payments Section */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Payments</h3>
                  <Button onClick={addNewPayment} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment
                  </Button>
                </div>

                {/* Existing Payments */}
                <PaymentTable title="" data={order.purchaseOrderPayments} type="payments" />

                {/* New Payments */}
                {newPayments.map((payment, index) => (
                  <Card key={index} className="border-2 border-dashed border-green-200 bg-green-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField label="Date">
                        <Input
                          type="date"
                          value={payment.paymentDate}
                          onChange={(e) => updateNewPayment(index, "paymentDate", e.target.value)}
                        />
                      </FormField>
                      <FormField label="Description">
                        <Input
                          value={payment.paymentDescription}
                          onChange={(e) =>
                            updateNewPayment(index, "paymentDescription", e.target.value)
                          }
                          placeholder="Payment description"
                        />
                      </FormField>
                      <FormField label="Method">
                        <select
                          value={payment.paymentMethod}
                          onChange={(e) => updateNewPayment(index, "paymentMethod", e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="Wire">Wire</option>
                          <option value="Credit Card">Credit Card</option>
                          <option value="Consignment">Consignment</option>
                        </select>
                      </FormField>
                      <FormField label="Amount">
                        <Input
                          type="number"
                          step="0.01"
                          value={payment.paymentAmount}
                          onChange={(e) =>
                            updateNewPayment(
                              index,
                              "paymentAmount",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0.00"
                        />
                      </FormField>
                      <FormField label="Type">
                        <select
                          value={payment.paymentType}
                          onChange={(e) => updateNewPayment(index, "paymentType", e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="Invoice">Invoice</option>
                          <option value="Deposit">Deposit</option>
                        </select>
                      </FormField>
                      <FormField label="Invoice Number">
                        <div className="flex space-x-2">
                          <Input
                            value={payment.paymentInvoiceNumber}
                            onChange={(e) =>
                              updateNewPayment(index, "paymentInvoiceNumber", e.target.value)
                            }
                            placeholder="Invoice #"
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => removeNewPayment(index)}
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

            {/* Notes and Files */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Notes</h3>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {order.purchaseOrderNotes || "No notes available"}
                    </p>
                  </div>
                  <FormField label="Additional Notes">
                    <textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      rows={4}
                      placeholder="Add additional notes..."
                    />
                  </FormField>
                </div>
              </Card>

              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Files</h3>

                  {/* Existing Files */}
                  {order.purchaseOrderFiles.length > 0 && (
                    <div className="space-y-2">
                      {order.purchaseOrderFiles.map((file, index) => (
                        <a
                          key={index}
                          href={file.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-purple-600 hover:text-purple-800 text-sm"
                        >
                          {file.fileName}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* File Upload */}
                  <div className="space-y-3">
                    <FormField label="Upload Files">
                      <Input
                        type="file"
                        multiple
                        onChange={(e) => setSelectedFiles(e.target.files)}
                      />
                    </FormField>
                    <Button
                      onClick={() => {
                        /* Handle file upload */
                      }}
                      isLoading={isUploading}
                      disabled={!selectedFiles}
                      size="sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Totals and Save */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-900">Order Totals</h4>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Sub-Total:</span>
                      <span className="font-semibold">
                        {formatCurrency(order.purchaseOrderTotalItemsCost)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Payments:</span>
                      <span className="font-semibold">
                        {formatCurrency(calculateTotalPayments())}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Credits:</span>
                      <span className="font-semibold">
                        {formatCurrency(calculateTotalCredits())}
                      </span>
                    </div>
                    <hr className="border-slate-200" />
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold text-slate-900">Total Balance Due:</span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(calculateBalanceDue())}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-900">Actions</h4>
                  <Button onClick={handleSaveOrder} isLoading={isSaving} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Save Order
                  </Button>
                </div>
              </Card>
            </div>
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

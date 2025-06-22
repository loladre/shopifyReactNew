import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ServerMessagePanel from "../components/ui/ServerMessagePanel";
import {
  FileText,
  Building2,
  Calendar,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle,
  Printer,
  Plus,
  Minus,
  ShoppingCart,
  Leaf,
  Clock,
  TrendingUp,
  ExternalLink,
  X,
} from "lucide-react";

interface ProductVariant {
  variantColor: string;
  variantSize: string;
  variantQuantity: number;
  variantQuantityReceived: number;
  variantCost: number;
  variantRetail: number;
  variantSku: string;
  variantBarcode: string;
  variantPreOrder: string | boolean;
  variantShopifyProductGid: string;
  variantShopifyGid: string;
  variantShopifyInventoryItemGid: string;
  ordersToFulfil?: Array<{
    shopifyOrderNumber: string;
    shopifyCustomerName: string;
  }>;
}

interface Product {
  productName: string;
  productType: string;
  productTags: string;
  productCanceled: boolean;
  productShopifyGid: string;
  productVariants: ProductVariant[];
}

interface OrderDetail {
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
}

interface VariantReceiveData {
  productIndex: number;
  variantIndex: number;
  receivingNow: number;
  defective: number;
  currentReceived: number;
  isComplete: boolean;
  variantShopifyId: string;
  variantShopifyInventoryItemId: string;
  variantName: string;
  variantCost: number;
  variantPreorderStop: boolean;
  variantOrderToFulfill: string;
  updateVariantFlag: boolean;
}

interface ProductReceiveData {
  productShopifyId: string;
  updateProductFlag: boolean;
  productVariants: VariantReceiveData[];
}

export default function ReceiveInventory() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");

  // State
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [receiveData, setReceiveData] = useState<{
    [key: string]: { [key: string]: VariantReceiveData };
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [totalReceivingNow, setTotalReceivingNow] = useState(0);
  const [preorderCount, setPreorderCount] = useState(0);

  // Progress tracking
  const [progress, setProgress] = useState({
    totalQuantity: 0,
    totalReceived: 0,
    percentage: 0,
  });

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail(orderId);
    } else {
      setError("No order ID provided");
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    calculateProgress();
  }, [receiveData]);

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

      const data: OrderDetail = await response.json();
      setOrder(data);
      initializeReceiveData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const initializeReceiveData = (orderData: OrderDetail) => {
    const newReceiveData: { [key: string]: { [key: string]: VariantReceiveData } } = {};

    orderData.products.forEach((product, productIndex) => {
      newReceiveData[product.productShopifyGid] = {};

      product.productVariants.forEach((variant, variantIndex) => {
        const variantPreOrder =
          typeof variant.variantPreOrder === "string"
            ? variant.variantPreOrder === "true"
            : !!variant.variantPreOrder;

        newReceiveData[product.productShopifyGid][variant.variantShopifyGid] = {
          productIndex,
          variantIndex,
          receivingNow: 0,
          defective: 0,
          currentReceived: variant.variantQuantityReceived || 0,
          isComplete: (variant.variantQuantityReceived || 0) >= variant.variantQuantity,
          variantShopifyId: variant.variantShopifyGid,
          variantShopifyInventoryItemId: variant.variantShopifyInventoryItemGid,
          variantName: product.productName,
          variantCost: variant.variantCost,
          variantPreorderStop: false,
          variantOrderToFulfill: variant.ordersToFulfil
            ? variant.ordersToFulfil
                .map((order) => `${order.shopifyOrderNumber} - ${order.shopifyCustomerName}`)
                .join(" / ")
            : "",
          updateVariantFlag: false,
        };
      });
    });

    setReceiveData(newReceiveData);
    calculateProgress();
  };

  const calculateProgress = () => {
    if (!order) return;

    let totalQuantity = 0;
    let totalReceived = 0;
    let totalReceivingNow = 0;
    let preorderItems = 0;

    order.products.forEach((product) => {
      product.productVariants.forEach((variant) => {
        totalQuantity += variant.variantQuantity;

        const variantData = receiveData[product.productShopifyGid]?.[variant.variantShopifyGid];
        if (variantData) {
          totalReceived += variantData.currentReceived + variantData.receivingNow;
          totalReceivingNow += variantData.receivingNow;

          // Count preorder items being received
          const variantPreOrder =
            typeof variant.variantPreOrder === "string"
              ? variant.variantPreOrder === "true"
              : !!variant.variantPreOrder;

          if (variantPreOrder && variantData.receivingNow > 0) {
            preorderItems++;
          }
        }
      });
    });

    const percentage = totalQuantity > 0 ? (totalReceived / totalQuantity) * 100 : 0;

    setProgress({
      totalQuantity,
      totalReceived,
      percentage,
    });

    setTotalReceivingNow(totalReceivingNow);
    setPreorderCount(preorderItems);
  };

  const handleIncrement = (productId: string, variantId: string) => {
    setReceiveData((prev) => {
      const productData = { ...prev[productId] };
      const variant = { ...productData[variantId] };

      variant.receivingNow += 1;
      variant.updateVariantFlag = true;

      if (order) {
        const product = order.products[variant.productIndex];
        const variantObj = product.productVariants[variant.variantIndex];
        const isPreorder =
          typeof variantObj.variantPreOrder === "string"
            ? variantObj.variantPreOrder === "true"
            : !!variantObj.variantPreOrder;

        if (isPreorder && variant.receivingNow > 0) {
          variant.variantPreorderStop = true;
        }
      }

      productData[variantId] = variant;

      return {
        ...prev,
        [productId]: productData,
      };
    });
  };

  const handleDecrement = (productId: string, variantId: string) => {
    setReceiveData((prev) => {
      const productData = { ...prev[productId] };
      const variant = { ...productData[variantId] };

      if (variant.receivingNow > 0) {
        variant.receivingNow -= 1;
        variant.updateVariantFlag = true;

        if (order) {
          const product = order.products[variant.productIndex];
          const variantObj = product.productVariants[variant.variantIndex];
          const isPreorder =
            typeof variantObj.variantPreOrder === "string"
              ? variantObj.variantPreOrder === "true"
              : !!variantObj.variantPreOrder;

          if (isPreorder && variant.receivingNow === 0) {
            variant.variantPreorderStop = false;
          }
        }
      }

      productData[variantId] = variant;

      return {
        ...prev,
        [productId]: productData,
      };
    });
  };

  const handleDefectiveChange = (productId: string, variantId: string, value: number) => {
    setReceiveData((prev) => {
      const updated = { ...prev };
      if (updated[productId] && updated[productId][variantId]) {
        const variant = updated[productId][variantId];
        const currentReceived = variant.currentReceived;
        const receivingNow = variant.receivingNow;

        // Ensure defective count is not greater than what's being received
        if (value <= currentReceived + receivingNow) {
          variant.defective = value;
          variant.updateVariantFlag = true;
        }
      }
      return updated;
    });
  };

  const handlePrintLabels = () => {
    if (order) {
      window.open(
        `/orders/tagPrintingByPurchaseOrderId.html?orderId=${order.purchaseOrderID}`,
        "_blank"
      );
    }
  };
  interface VariantSubmitPayload {
    variantShopifyId: string;
    variantShopifyInventoryItemId: string;
    updateVariantFlag: boolean;
    variantQuantityReceived: number;
    variantReceivedComplete: boolean;
    variantPreorderStop: boolean;
    variantOrderTofFullfill: string;
    variantCost: number;
    variantName: string;
    defective: number;
  }
  interface ProductSubmitPayload {
    productShopifyId: string;
    updateProductFlag: boolean;
    productVariants: VariantSubmitPayload[];
  }

  const handleSubmit = async () => {
    if (!order) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

      // Prepare data for submission
      const productDict: { [key: string]: ProductSubmitPayload } = {};

      // Include all variants in the submission, not just the ones being updated
      order.products.forEach((product) => {
        const productId = product.productShopifyGid;
        productDict[productId] = {
          productShopifyId: productId,
          updateProductFlag: false,
          productVariants: [],
        };

        product.productVariants.forEach((variant) => {
          const variantId = variant.variantShopifyGid;
          const variantData = receiveData[productId]?.[variantId];

          if (variantData) {
            // Set updateVariantFlag to true only for variants that have changes
            const updateFlag = variantData.receivingNow > 0 || variantData.defective > 0;

            productDict[productId].productVariants.push({
              variantShopifyId: variantData.variantShopifyId,
              variantShopifyInventoryItemId: variantData.variantShopifyInventoryItemId,
              updateVariantFlag: updateFlag,
              variantQuantityReceived: variantData.receivingNow,
              variantReceivedComplete:
                variantData.currentReceived + variantData.receivingNow >= variant.variantQuantity,
              variantPreorderStop: variantData.variantPreorderStop,
              variantOrderTofFullfill: variantData.variantOrderToFulfill,
              variantCost: variantData.variantCost,
              variantName: variantData.variantName,
              defective: variantData.defective,
            });

            // If any variant is updated, mark the product as updated
            if (updateFlag) {
              productDict[productId].updateProductFlag = true;
            }
          }
        });
      });

      const submitData = {
        purchaseOrderID: order.purchaseOrderID,
        season: order.purchaseOrderSeason,
        totalVariantReceivedQuantity: progress.totalReceived + totalReceivingNow,
        products: Object.values(productDict),
      };

      const response = await fetch(`${apiBaseUrl}${basePath}/receiveInventoryByPoId`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess("Inventory updates submitted successfully");

        setTimeout(() => {
          fetchOrderDetail(order.purchaseOrderID);
        }, 2000);
      } else {
        throw new Error("Failed to update inventory");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update inventory");
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
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

  if (isLoading) {
    return (
      <Layout title="Receive Inventory">
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
      <Layout title="Receive Inventory">
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

  return (
    <Layout title={`Receive Inventory - Order #${order.purchaseOrderID}`}>
      <div className="w-full px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-5 space-y-6">
            {/* Header */}
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-purple-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      Order #{order.purchaseOrderID} -- Receiving Inventory
                    </h1>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`text-sm font-medium ${
                      order.purchaseOrderCompleteReceive ? "text-green-600" : "text-slate-600"
                    }`}
                  >
                    {order.purchaseOrderCompleteReceive ? "Completed" : "In Progress"}
                  </span>
                  <Button onClick={handlePrintLabels} variant="secondary">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Labels
                  </Button>
                </div>
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
                    <Leaf className="w-5 h-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">Season:</span>
                    <span className="text-slate-700">{order.purchaseOrderSeason}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">Terms:</span>
                    <span className="text-slate-700">{order.terms}</span>
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
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-900">Payment Terms:</span>
                    <p className="text-sm text-slate-700">
                      Deposit: {order.depositPercent}% - Delivery: {order.onDeliverPercent}% -
                      Net30: {order.net30Percent}%
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">Cancel:</span>
                    <span className="text-slate-700">{formatDate(order.completedDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">Brand PO#:</span>
                    <span className="text-slate-700">{order.brandPoNumber}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        Received: {progress.totalReceived}/{progress.totalQuantity}
                      </span>
                      <span>{Math.round(progress.percentage)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Status Messages */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </Card>
            )}

            {success && (
              <Card className="border-green-200 bg-green-50">
                <div className="flex items-center space-x-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span>{success}</span>
                </div>
              </Card>
            )}

            {/* Products Table */}
            <Card padding="none">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Order Items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        Complete
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        Color
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        Size
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        QTY
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        P-Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        Preorder
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        Received
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        Receiving Now
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        Defective
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        Sold on Order #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.products.map((product, productIndex) => {
                      // Group products by name for alternating row colors
                      let lastProductName =
                        productIndex > 0 ? order.products[productIndex - 1].productName : null;
                      let isNewProductGroup = product.productName !== lastProductName;
                      let isEvenGroup = Math.floor(productIndex / 2) % 2 === 0;

                      return product.productVariants.map((variant, variantIndex) => {
                        const variantData =
                          receiveData[product.productShopifyGid]?.[variant.variantShopifyGid];
                        const isComplete = variantData?.isComplete || false;
                        const currentReceived = variantData?.currentReceived || 0;
                        const receivingNow = variantData?.receivingNow || 0;
                        const defective = variantData?.defective || 0;
                        const totalReceived = currentReceived + receivingNow;
                        const lockControlsOnLoad = currentReceived >= variant.variantQuantity;
                        const isOverReceived = totalReceived > variant.variantQuantity;
                        const isFullyReceived = totalReceived >= variant.variantQuantity;
                        const isCanceled = product.productCanceled;
                        const isPreorder =
                          typeof variant.variantPreOrder === "string"
                            ? variant.variantPreOrder === "true"
                            : !!variant.variantPreOrder;

                        return (
                          <tr
                            key={`${productIndex}-${variantIndex}`}
                            className={isEvenGroup ? "bg-white" : "bg-slate-50"}
                          >
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={isComplete || isFullyReceived}
                                disabled={true}
                                className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-900">
                              <a
                                href={`https://lola-dre.myshopify.com/admin/products/${product.productShopifyGid
                                  ?.split("/")
                                  .pop()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:text-purple-800 flex items-center"
                              >
                                <span>{product.productName}</span>
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {variant.variantColor}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {variant.variantSize}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                              {variant.variantQuantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {product.productType}
                            </td>
                            <td
                              className={`px-4 py-3 text-sm ${
                                isPreorder ? "text-red-600 font-medium" : "text-slate-600"
                              }`}
                            >
                              {isPreorder ? "true" : "false"}
                            </td>
                            <td
                              className={`px-4 py-3 text-sm ${
                                isCanceled
                                  ? "text-red-600 font-medium"
                                  : "text-green-600 font-medium"
                              }`}
                            >
                              {isCanceled ? "Canceled" : "Active"}
                            </td>
                            <td
                              className={`px-4 py-3 text-sm font-medium ${
                                isOverReceived
                                  ? "text-red-600"
                                  : isFullyReceived
                                  ? "text-green-600"
                                  : "text-slate-900"
                              }`}
                            >
                              {totalReceived}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  value={receivingNow}
                                  disabled
                                  className={`w-14 px-2 py-1 text-center border border-slate-300 rounded ${
                                    isOverReceived
                                      ? "text-red-600"
                                      : isFullyReceived
                                      ? "text-green-600"
                                      : ""
                                  }`}
                                />
                                <button
                                  onClick={() =>
                                    handleIncrement(
                                      product.productShopifyGid,
                                      variant.variantShopifyGid
                                    )
                                  }
                                  disabled={isCanceled || lockControlsOnLoad}
                                  className="w-8 h-8 flex items-center justify-center rounded text-white font-bold bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() =>
                                    handleDecrement(
                                      product.productShopifyGid,
                                      variant.variantShopifyGid
                                    )
                                  }
                                  disabled={isCanceled || lockControlsOnLoad || receivingNow === 0}
                                  className="w-8 h-8 flex items-center justify-center rounded text-white font-bold bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                min="0"
                                max={totalReceived}
                                value={defective}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  if (value >= 0 && value <= totalReceived) {
                                    handleDefectiveChange(
                                      product.productShopifyGid,
                                      variant.variantShopifyGid,
                                      value
                                    );
                                  }
                                }}
                                disabled={isCanceled || totalReceived === 0 || lockControlsOnLoad}
                                className="w-16 text-center"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                              {variant.ordersToFulfil
                                ?.map(
                                  (order) =>
                                    `${order.shopifyOrderNumber} - ${order.shopifyCustomerName}`
                                )
                                .join(" / ") || ""}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                              {formatCurrency(variant.variantCost)}
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Action Button */}
            <Card className="text-center py-6">
              <p className="text-sm text-slate-700 mb-2">
                <strong>Current Receiving Total:</strong> {totalReceivingNow} units
              </p>
              <Button
                onClick={() => setShowConfirmModal(true)}
                disabled={totalReceivingNow === 0 || isSubmitting}
                size="lg"
                className="px-8"
              >
                Update Inventory
              </Button>

              {success && <div className="mt-4 text-green-600">{success}</div>}
            </Card>

            {/* Confirmation Modal */}
            {showConfirmModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="max-w-md w-full mx-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900">Are you Sure...</h3>
                      <button
                        onClick={() => setShowConfirmModal(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-slate-600">
                      You are adding {totalReceivingNow} to Inventory, and disabling Continue to
                      Sell for {preorderCount} items.
                    </p>
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => setShowConfirmModal(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSubmit} isLoading={isSubmitting} className="flex-1">
                        Add Inventory
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
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

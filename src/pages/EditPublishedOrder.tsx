import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import FormField from "../components/ui/FormField";
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
  CheckSquare,
  Square,
  Trash2,
} from "lucide-react";

interface ProductVariant {
  variantColor: string;
  variantSize: string;
  variantQuantity: number;
  variantCost: number;
  variantRetail: number;
  variantSku: string;
  variantPreOrder: boolean;
  variantMetafieldCategory: string;
  variantShopifyProductGid: string;
  variantShopifyGid: string;
  variantShopifyInventoryItemGid: string;
  updateVariantFlag: boolean;
}

interface Product {
  productName: string;
  productType: string;
  productTags: string;
  productCanceled: boolean;
  productShopifyGid: string;
  updateProductFlag: boolean;
  productVariants: ProductVariant[];
}

interface Payment {
  paymentDate: string;
  paymentDescription: string;
  paymentMethod: string;
  paymentAmount: number;
  paymentType: string;
  paymentInvoiceNumber: string;
  paymentFiles?: string;
  paymentFilesName?: string;
  paymentInvoiceAmount: number;
}

interface Credit {
  creditDate: string;
  creditDescription: string;
  creditMethod: string;
  creditAmount: number;
}

interface OrderFile {
  fileName: string;
  filePath: string;
}

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
  purchaseOrderFiles: OrderFile[];
}

export default function EditPublishedOrder() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [order, setOrder] = useState<PublishedOrderDetail | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);

  // Edit states
  const [isEditingSeason, setIsEditingSeason] = useState(false);
  const [isEditingCancelDate, setIsEditingCancelDate] = useState(false);
  const [newSeason, setNewSeason] = useState("");
  const [newBrandSeason, setNewBrandSeason] = useState("");
  const [newYearSeason, setNewYearSeason] = useState("26");
  const [newCancelDate, setNewCancelDate] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [receiveComplete, setReceiveComplete] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  // Totals
  const [totals, setTotals] = useState({
    subTotal: 0,
    paymentTotal: 0,
    creditTotal: 0,
    grandTotal: 0,
  });

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail(orderId);
      fetchVendors();
    } else {
      setError("No order ID provided");
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    calculateTotals();
  }, [products, payments, credits]);

  const fetchOrderDetail = async (purchaseOrderId: string) => {
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
        `${apiBaseUrl}${basePath}/shopify/getPublishedOrderById/${purchaseOrderId}`,
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
      setProducts(data.products);
      setPayments(data.purchaseOrderPayments);
      setCredits(data.purchaseOrderCredits);
      setFiles(data.purchaseOrderFiles);
      setReceiveComplete(data.purchaseOrderCompleteReceive);
      setAdditionalNotes(data.purchaseOrderNotes);
      setNewCancelDate(data.completedDate);

      // Parse season for editing
      const seasonParts = parseSeason(data.purchaseOrderSeason);
      setNewSeason(seasonParts.season);
      setNewBrandSeason(seasonParts.brand);
      setNewYearSeason(seasonParts.year);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem("bridesbyldToken");
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
      console.error("Failed to fetch vendors:", err);
    }
  };

  const parseSeason = (seasonString: string): { season: string; brand: string; year: string } => {
    // Default values
    let season = "Fall";
    let brand = "";
    let year = "26";

    // Common seasons to check for
    const seasons = ["Resort", "Spring", "Summer", "Fall", "Personal", "Consignment"];

    // Try to extract season
    for (const s of seasons) {
      if (seasonString.startsWith(s)) {
        season = s;
        const remainder = seasonString.substring(s.length).trim();

        // Check if there's a year at the end (2 digits)
        const yearMatch = remainder.match(/(\d{2})$/);
        if (yearMatch) {
          year = yearMatch[1];
          // The brand would be everything between the season and year
          brand = remainder.substring(0, remainder.length - year.length).trim();
        } else {
          // If no year, assume the rest is the brand
          brand = remainder;
        }
        break;
      }
    }

    return { season, brand, year };
  };

  const constructSeason = (): string => {
    if (newBrandSeason) {
      return `${newSeason} ${newBrandSeason} ${newYearSeason}`;
    }
    return `${newSeason}${newYearSeason}`;
  };

  const handleSaveSeason = async () => {
    if (!order) return;

    const oldSeason = order.purchaseOrderSeason;
    const updatedSeason = constructSeason();

    try {
      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

      const response = await fetch(
        `${apiBaseUrl}${basePath}/shopify/updateSeason/${order.purchaseOrderID}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            updatedNewSeason: updatedSeason,
            oldSeason: oldSeason,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update season");
      }

      setOrder({
        ...order,
        purchaseOrderSeason: updatedSeason,
      });

      setIsEditingSeason(false);
      setSuccess("Season updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update season");
    }
  };

  const handleSaveCancelDate = async () => {
    if (!order) return;

    try {
      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

      const response = await fetch(
        `${apiBaseUrl}${basePath}/shopify/updateCancelDate/${order.purchaseOrderID}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cancelDate: newCancelDate,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update cancel date");
      }

      setOrder({
        ...order,
        completedDate: newCancelDate,
      });

      setIsEditingCancelDate(false);
      setSuccess("Cancel date updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update cancel date");
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    try {
      setIsUploading(true);
      const formData = new FormData();

      Array.from(selectedFiles).forEach((file) => {
        formData.append("files", file);
      });

      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

      const response = await fetch(`${apiBaseUrl}${basePath}/uploadfiles/invoicesAndOrders`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload files");
      }

      const data = await response.json();
      const newFiles: OrderFile[] = data.filePaths.map((path: string) => ({
        fileName: path.split("/").pop() || "",
        filePath: path,
      }));

      setFiles([...files, ...newFiles]);
      setSelectedFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSuccess("Files uploaded successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts(new Set());
    } else {
      const allProductIds = new Set<string>();
      products.forEach((product) => {
        product.productVariants.forEach((variant) => {
          allProductIds.add(variant.variantShopifyGid);
        });
      });
      setSelectedProducts(allProductIds);
    }
    setSelectAll(!selectAll);
  };

  const handleToggleSelectProduct = (variantId: string) => {
    const newSelectedProducts = new Set(selectedProducts);
    if (newSelectedProducts.has(variantId)) {
      newSelectedProducts.delete(variantId);
    } else {
      newSelectedProducts.add(variantId);
    }
    setSelectedProducts(newSelectedProducts);

    // Update selectAll state based on whether all products are selected
    let allSelected = true;
    products.forEach((product) => {
      product.productVariants.forEach((variant) => {
        if (!newSelectedProducts.has(variant.variantShopifyGid)) {
          allSelected = false;
        }
      });
    });
    setSelectAll(allSelected);
  };

  // Enhanced product change handler with synchronized pricing
  const handleProductChange = (
    productIndex: number,
    variantIndex: number,
    field: keyof ProductVariant | "productType" | "productTags" | "productCanceled",
    value: any
  ) => {
    const updatedProducts = [...products];

    if (field === "productType" || field === "productTags" || field === "productCanceled") {
      // These are product-level fields
      updatedProducts[productIndex] = {
        ...updatedProducts[productIndex],
        [field]: value,
        updateProductFlag: true,
      };
    } else {
      // These are variant-level fields
      const currentProduct = updatedProducts[productIndex];
      const currentVariant = currentProduct.productVariants[variantIndex];
      
      // Update the current variant
      updatedProducts[productIndex].productVariants[variantIndex] = {
        ...currentVariant,
        [field]: value,
        updateVariantFlag: true,
      };

      // If changing retail price or cost, update all variants with the same product name
      if (field === "variantRetail" || field === "variantCost") {
        const currentProductName = currentProduct.productName;
        
        updatedProducts.forEach((product, pIndex) => {
          if (product.productName === currentProductName) {
            product.productVariants.forEach((variant, vIndex) => {
              updatedProducts[pIndex].productVariants[vIndex] = {
                ...variant,
                [field]: value,
                updateVariantFlag: true,
              };
            });
            updatedProducts[pIndex].updateProductFlag = true;
          }
        });
      }
    }

    setProducts(updatedProducts);
  };

  const addPayment = () => {
    const newPayment: Payment = {
      paymentDate: new Date().toISOString().split("T")[0],
      paymentDescription: "",
      paymentMethod: "Wire",
      paymentAmount: 0,
      paymentType: "Invoice",
      paymentInvoiceNumber: "",
      paymentInvoiceAmount: 0,
    };
    setPayments([...payments, newPayment]);
  };

  const addCredit = () => {
    const newCredit: Credit = {
      creditDate: new Date().toISOString().split("T")[0],
      creditDescription: "",
      creditMethod: "Note",
      creditAmount: 0,
    };
    setCredits([...credits, newCredit]);
  };

  const removePayment = (index: number) => {
    const updatedPayments = [...payments];
    updatedPayments.splice(index, 1);
    setPayments(updatedPayments);
  };

  const removeCredit = (index: number) => {
    const updatedCredits = [...credits];
    updatedCredits.splice(index, 1);
    setCredits(updatedCredits);
  };

  const updatePayment = (index: number, field: keyof Payment, value: any) => {
    const updatedPayments = [...payments];
    updatedPayments[index] = {
      ...updatedPayments[index],
      [field]: value,
    };
    setPayments(updatedPayments);
  };

  const updateCredit = (index: number, field: keyof Credit, value: any) => {
    const updatedCredits = [...credits];
    updatedCredits[index] = {
      ...updatedCredits[index],
      [field]: value,
    };
    setCredits(updatedCredits);
  };

  const calculateTotals = () => {
    // Calculate subtotal from products
    let subTotal = 0;
    products.forEach((product) => {
      product.productVariants.forEach((variant) => {
        subTotal += variant.variantCost * variant.variantQuantity;
      });
    });

    // Calculate payment total
    const paymentTotal = payments.reduce((sum, payment) => sum + payment.paymentAmount, 0);

    // Calculate credit total
    const creditTotal = credits.reduce((sum, credit) => sum + credit.creditAmount, 0);

    // Calculate grand total
    const grandTotal = subTotal - paymentTotal - creditTotal;

    setTotals({
      subTotal,
      paymentTotal,
      creditTotal,
      grandTotal,
    });
  };

  const handleSaveOrder = async () => {
    if (!order) return;

    try {
      setIsSaving(true);
      setError("");

      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

      // Prepare the update payload
      const updatePayload = {
        purchaseOrderID: order.purchaseOrderID,
        purchaseOrderNotes: additionalNotes,
        purchaseOrderCompleteReceive: receiveComplete,
        purchaseOrderPayments: payments,
        purchaseOrderCredits: credits,
        purchaseOrderFiles: files,
        terms: order.terms,
        depositPercent: order.depositPercent,
        onDeliverPercent: order.onDeliverPercent,
        net30Percent: order.net30Percent,
        totalVariantQuantity: order.totalVariantQuantity,
        purchaseOrderTotalPayments: totals.paymentTotal,
        purchaseOrderTotalCredits: totals.creditTotal,
        purchaseOrderTotalItemsCost: totals.subTotal,
        purchaseOrderBalanceDue: totals.grandTotal,
        products: products,
      };

      const response = await fetch(
        `${apiBaseUrl}${basePath}/shopify/updatePurchaseOrderByIdNoShopify/${order.purchaseOrderID}`,
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

      setSuccess("Order updated successfully");

      // Navigate back to order detail page after successful save
      setTimeout(() => {
        navigate(`/published-order-detail?orderId=${order.purchaseOrderID}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save order");
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 2,
    }).format(value / 100);
  };

  // Calculate progress percentage
  const calculateProgress = (): number => {
    if (!order) return 0;
    if (order.purchaseOrderCompleteReceive) return 100;
    return order.totalVariantQuantity > 0
      ? (order.totalVariantReceivedQuantity / order.totalVariantQuantity) * 100
      : 0;
  };

  if (isLoading) {
    return (
      <Layout title="Edit Published Order">
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

  if (error && !order) {
    return (
      <Layout title="Edit Published Order">
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

  if (!order) {
    return null;
  }

  const progress = calculateProgress();

  return (
    <Layout title={`Edit Order #${order.purchaseOrderID}`}>
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
                      Order #{order.purchaseOrderID} --{" "}
                      <span className="text-green-600">Published</span>
                    </h1>
                    <p className="text-slate-600">Edit order details and products</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={receiveComplete}
                      onChange={(e) => setReceiveComplete(e.target.checked)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Receive Complete</span>
                  </label>
                  <Button
                    onClick={() =>
                      navigate(`/published-order-detail?orderId=${order.purchaseOrderID}`)
                    }
                    variant="outline"
                  >
                    Back to Order
                  </Button>
                </div>
              </div>
            </Card>

            {/* Status Messages */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{error}</span>
                  <Button variant="ghost" size="sm" onClick={() => setError("")}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}

            {success && (
              <Card className="border-green-200 bg-green-50">
                <div className="flex items-center space-x-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span>{success}</span>
                  <Button variant="ghost" size="sm" onClick={() => setSuccess("")}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}

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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingSeason(!isEditingSeason)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                  {isEditingSeason && (
                    <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={newSeason}
                          onChange={(e) => setNewSeason(e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded text-sm"
                        >
                          <option value="Resort">Resort</option>
                          <option value="Spring">Spring</option>
                          <option value="Summer">Summer</option>
                          <option value="Fall">Fall</option>
                          <option value="Personal">Personal</option>
                          <option value="Consignment">Consignment</option>
                        </select>
                        <select
                          value={newBrandSeason}
                          onChange={(e) => setNewBrandSeason(e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded text-sm"
                        >
                          <option value="">Select Brand...</option>
                          {vendors.map((vendor) => (
                            <option key={vendor} value={vendor}>
                              {vendor}
                            </option>
                          ))}
                        </select>
                        <select
                          value={newYearSeason}
                          onChange={(e) => setNewYearSeason(e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded text-sm"
                        >
                          {Array.from({ length: 11 }, (_, i) => (23 + i).toString()).map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex space-x-2 mt-2">
                        <Button size="sm" onClick={handleSaveSeason}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingSeason(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
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
                        <Button size="sm" onClick={handleSaveCancelDate}>
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
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">Brand PO#:</span>
                    <span className="text-slate-700">{order.brandPoNumber}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        Received: {order.totalVariantReceivedQuantity}/{order.totalVariantQuantity}
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
              </Card>
            </div>

            {/* Products Table */}
            <Card padding="none">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Order Items</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleToggleSelectAll}
                      className="flex items-center justify-center w-5 h-5 border border-slate-300 rounded hover:bg-slate-100"
                    >
                      {selectAll ? (
                        <CheckSquare className="w-4 h-4 text-purple-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <span className="text-sm text-slate-600">Select All</span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        <span className="sr-only">Select</span>
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
                        Cost
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        Retail
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        P-Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        Tags
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        Preorder
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        Margin
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                        CAT
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {products.map((product, productIndex) => {
                      // Group products by name for alternating row colors
                      let lastProductName =
                        productIndex > 0 ? products[productIndex - 1].productName : null;
                      let isNewProductGroup = product.productName !== lastProductName;
                      let isEvenGroup =
                        Math.floor(productIndex / product.productVariants.length) % 2 === 0;

                      return product.productVariants.map((variant, variantIndex) => (
                        <tr
                          key={`${productIndex}-${variantIndex}`}
                          className={isEvenGroup ? "bg-white" : "bg-slate-50"}
                        >
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleSelectProduct(variant.variantShopifyGid)}
                              className="flex items-center justify-center w-5 h-5 border border-slate-300 rounded hover:bg-slate-100"
                            >
                              {selectedProducts.has(variant.variantShopifyGid) ? (
                                <CheckSquare className="w-4 h-4 text-purple-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900">
                            <a
                              href={`https://lola-dre.myshopify.com/admin/products/${product.productShopifyGid
                                ?.split("/")
                                .pop()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-800"
                            >
                              {product.productName}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {variant.variantColor}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            <Input
                              type="text"
                              value={variant.variantSize}
                              onChange={(e) =>
                                handleProductChange(
                                  productIndex,
                                  variantIndex,
                                  "variantSize",
                                  e.target.value
                                )
                              }
                              className="w-20 text-sm py-1 px-2"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                            <Input
                              type="number"
                              min="0"
                              value={variant.variantQuantity}
                              onChange={(e) =>
                                handleProductChange(
                                  productIndex,
                                  variantIndex,
                                  "variantQuantity",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-20 text-sm py-1 px-2"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900">
                            <Input
                              type="number"
                              step="0.01"
                              value={variant.variantCost}
                              onChange={(e) =>
                                handleProductChange(
                                  productIndex,
                                  variantIndex,
                                  "variantCost",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-24 text-sm py-1 px-2"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900">
                            <Input
                              type="number"
                              step="0.01"
                              value={variant.variantRetail}
                              onChange={(e) =>
                                handleProductChange(
                                  productIndex,
                                  variantIndex,
                                  "variantRetail",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-24 text-sm py-1 px-2"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                            {variant.variantSku}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            <Input
                              type="text"
                              value={product.productType}
                              onChange={(e) =>
                                handleProductChange(
                                  productIndex,
                                  variantIndex,
                                  "productType",
                                  e.target.value
                                )
                              }
                              className="w-32 text-sm py-1 px-2"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            <Input
                              type="text"
                              value={product.productTags}
                              onChange={(e) =>
                                handleProductChange(
                                  productIndex,
                                  variantIndex,
                                  "productTags",
                                  e.target.value
                                )
                              }
                              className="w-32 text-sm py-1 px-2"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={variant.variantPreOrder.toString()}
                              onChange={(e) =>
                                handleProductChange(
                                  productIndex,
                                  variantIndex,
                                  "variantPreOrder",
                                  e.target.value === "true"
                                )
                              }
                              className="px-2 py-1 border border-slate-300 rounded text-sm"
                            >
                              <option value="false">No</option>
                              <option value="true">Yes</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900">
                            {formatPercentage(
                              variant.variantRetail > 0
                                ? ((variant.variantRetail - variant.variantCost) /
                                    variant.variantRetail) *
                                    100
                                : 0
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={product.productCanceled.toString()}
                              onChange={(e) =>
                                handleProductChange(
                                  productIndex,
                                  variantIndex,
                                  "productCanceled",
                                  e.target.value === "true"
                                )
                              }
                              className={`px-2 py-1 border rounded text-sm ${
                                product.productCanceled
                                  ? "border-red-300 text-red-700 bg-red-50"
                                  : "border-green-300 text-green-700 bg-green-50"
                              }`}
                            >
                              <option value="false">Active</option>
                              <option value="true">Canceled</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                            {formatCurrency(variant.variantCost * variant.variantQuantity)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            <Input
                              type="text"
                              value={variant.variantMetafieldCategory}
                              onChange={(e) =>
                                handleProductChange(
                                  productIndex,
                                  variantIndex,
                                  "variantMetafieldCategory",
                                  e.target.value
                                )
                              }
                              className="w-24 text-sm py-1 px-2"
                            />
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Credits Section */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Credits</h3>
                <Button onClick={addCredit} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Credit
                </Button>
              </div>

              {credits.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No credits added</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-900">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-900">
                          Description
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-900">
                          Method
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-900">
                          Amount
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {credits.map((credit, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <Input
                              type="date"
                              value={credit.creditDate}
                              onChange={(e) => updateCredit(index, "creditDate", e.target.value)}
                              className="w-32"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="text"
                              value={credit.creditDescription}
                              onChange={(e) =>
                                updateCredit(index, "creditDescription", e.target.value)
                              }
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={credit.creditMethod}
                              onChange={(e) => updateCredit(index, "creditMethod", e.target.value)}
                              className="px-2 py-1 border border-slate-300 rounded text-sm w-full"
                            >
                              <option value="Note">Note</option>
                              <option value="Credit Card">Credit Card</option>
                              <option value="Wire">Wire</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={credit.creditAmount}
                              onChange={(e) =>
                                updateCredit(index, "creditAmount", parseFloat(e.target.value) || 0)
                              }
                              className="w-32"
                              icon={<DollarSign className="w-4 h-4 text-slate-400" />}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Button variant="danger" size="sm" onClick={() => removeCredit(index)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Payments Section */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Payments</h3>
                <Button onClick={addPayment} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment
                </Button>
              </div>

              {payments.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No payments added</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-900">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-900">
                          Description
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-900">
                          Method
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-900">
                          Amount
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-900">
                          Type
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-900">
                          Invoice #
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-900">
                          Invoice Amount
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {payments.map((payment, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <Input
                              type="date"
                              value={payment.paymentDate}
                              onChange={(e) => updatePayment(index, "paymentDate", e.target.value)}
                              className="w-32"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="text"
                              value={payment.paymentDescription}
                              onChange={(e) =>
                                updatePayment(index, "paymentDescription", e.target.value)
                              }
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={payment.paymentMethod}
                              onChange={(e) =>
                                updatePayment(index, "paymentMethod", e.target.value)
                              }
                              className="px-2 py-1 border border-slate-300 rounded text-sm w-full"
                            >
                              <option value="Wire">Wire</option>
                              <option value="Credit Card">Credit Card</option>
                              <option value="Consignment">Consignment</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={payment.paymentAmount}
                              onChange={(e) =>
                                updatePayment(
                                  index,
                                  "paymentAmount",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-32"
                              icon={<DollarSign className="w-4 h-4 text-slate-400" />}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={payment.paymentType}
                              onChange={(e) => updatePayment(index, "paymentType", e.target.value)}
                              className="px-2 py-1 border border-slate-300 rounded text-sm w-full"
                            >
                              <option value="Invoice">Invoice</option>
                              <option value="Deposit">Deposit</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="text"
                              value={payment.paymentInvoiceNumber}
                              onChange={(e) =>
                                updatePayment(index, "paymentInvoiceNumber", e.target.value)
                              }
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={payment.paymentInvoiceAmount}
                              onChange={(e) =>
                                updatePayment(
                                  index,
                                  "paymentInvoiceAmount",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-32"
                              icon={<DollarSign className="w-4 h-4 text-slate-400" />}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Button variant="danger" size="sm" onClick={() => removePayment(index)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((file, index) => (
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
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={(e) => setSelectedFiles(e.target.files)}
                      />
                    </FormField>
                    <Button
                      onClick={handleFileUpload}
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
                      <span className="font-semibold">{formatCurrency(totals.subTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Payments:</span>
                      <span className="font-semibold">{formatCurrency(totals.paymentTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Credits:</span>
                      <span className="font-semibold">{formatCurrency(totals.creditTotal)}</span>
                    </div>
                    <hr className="border-slate-200" />
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold text-slate-900">Total Balance Due:</span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(totals.grandTotal)}
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
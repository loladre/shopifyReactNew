import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import FormField from "../components/ui/FormField";
import ServerMessagePanel from "../components/ui/ServerMessagePanel";
import {
  RotateCcw,
  Search,
  Package,
  ShoppingCart,
  DollarSign,
  Calendar,
  Building2,
  FileText,
  Plus,
  Minus,
  X,
  Save,
  AlertTriangle,
  CheckCircle,
  Leaf,
  Hash,
  Edit,
} from "lucide-react";

// Interfaces
interface ProductVariant {
  variantColor: string;
  variantSize: string;
  variantQuantity: number;
  variantCost: number;
  variantRetail: number;
  variantSku: string;
  variantBarcode: string;
  variantPreOrder: string | boolean;
  variantMetafieldShoeSize?: string;
  variantMetafieldClothingSize?: string;
  variantMetafieldJeansSize?: string;
  variantMetafieldCategory?: string;
  variantShopifyGid: string;
  variantShopifyInventoryItemGid: string;
  variantQuantityReceived: number;
}

interface Product {
  productName: string;
  productType: string;
  productTags: string;
  productShopifyGid: string;
  productShopifyHandle: string;
  productStyleNumber: string;
  productShopifyCreatedAt: string;
  productVariants: ProductVariant[];
}

interface PurchaseOrder {
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
  products: Product[];
}

interface ReorderItem {
  productName: string;
  variantColor: string;
  variantSize: string;
  qtyToReorder: number;
  variantCost: number;
  variantRetail: number;
  variantSku: string;
  variantBarcode: string;
  productType: string;
  productTags: string;
  variantPreOrder: string | boolean;
  variantMetafieldShoeSize?: string;
  variantMetafieldClothingSize?: string;
  variantMetafieldJeansSize?: string;
  variantMetafieldCategory?: string;
  lineTotal: number;
  season: string;
  margin: number;
  variantShopifyGid: string;
  variantShopifyInventoryItemGid: string;
  variantShopifyProductGid: string;
  isNewSize: boolean;
}

interface VariantSummary {
  variantColor: string;
  variantSize: string;
  variantSku: string;
  selected: boolean;
}

export default function Reorder() {
  const navigate = useNavigate();
  const productIdInputRef = useRef<HTMLInputElement>(null);

  // State
  const [productIdInput, setProductIdInput] = useState<string>("");
  const [originalPurchaseOrder, setOriginalPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [productTitle, setProductTitle] = useState<string>("");
  const [productVariantsSummary, setProductVariantsSummary] = useState<VariantSummary[]>([]);
  const [reorderMode, setReorderMode] = useState<"existing" | "new" | "none">("none");
  const [selectedVariantSkus, setSelectedVariantSkus] = useState<string[]>([]);
  const [reorderId] = useState<string>(`${Date.now()}_RO`);

  // Order details
  const [brand, setBrand] = useState<string>("");
  const [season, setSeason] = useState<string>("");
  const [terms, setTerms] = useState<string>("");
  const [deposit, setDeposit] = useState<number>(0);
  const [delivery, setDelivery] = useState<number>(0);
  const [net30, setNet30] = useState<number>(0);
  const [createdDate, setCreatedDate] = useState<string>("");
  const [startShipDate, setStartShipDate] = useState<string>("");
  const [completeDate, setCompleteDate] = useState<string>("");
  const [brandPo, setBrandPo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Reorder items
  const [reorderItems, setReorderItems] = useState<ReorderItem[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Set today's date as default
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setCreatedDate(today);
  }, []);

  // Extract product ID from Shopify admin URL or use as-is
  const extractProductId = (input: string): string => {
    const match = input.match(/\/products\/(\d+)/);
    return match ? match[1] : input.trim();
  };

  const fetchProductDetails = async () => {
    if (!productIdInput.trim()) {
      setError("Please enter a product ID");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const productId = extractProductId(productIdInput);
      const token = localStorage.getItem("bridesbyldToken");

      if (!token) {
        navigate("/");
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

      const response = await fetch(
        `${apiBaseUrl}${basePath}/shopify/getPurchaseOrderByProductGid/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Product not found or no purchase order history");
      }

      const purchaseOrder: PurchaseOrder = await response.json();
      setOriginalPurchaseOrder(purchaseOrder);

      // Find the product with matching GID
      const targetProductGid = `gid://shopify/Product/${productId}`;
      const targetProduct = purchaseOrder.products.find(
        (product) => product.productShopifyGid === targetProductGid
      );

      if (targetProduct) {
        setProductTitle(targetProduct.productName);

        // Create variants summary for selection
        const variantsSummary: VariantSummary[] = targetProduct.productVariants.map((variant) => ({
          variantColor: variant.variantColor,
          variantSize: variant.variantSize,
          variantSku: variant.variantSku,
          selected: false,
        }));

        setProductVariantsSummary(variantsSummary);

        // Pre-fill order details
        setBrand(purchaseOrder.brand);
        setSeason(purchaseOrder.purchaseOrderSeason);
        setTerms(purchaseOrder.terms);
        setDeposit(purchaseOrder.depositPercent);
        setDelivery(purchaseOrder.onDeliverPercent);
        setNet30(purchaseOrder.net30Percent);
        setStartShipDate(purchaseOrder.startShipDate.split("T")[0]);
        setCompleteDate(purchaseOrder.completedDate.split("T")[0]);
        setBrandPo(purchaseOrder.brandPoNumber);
        setNotes(purchaseOrder.purchaseOrderNotes);
      } else {
        throw new Error("Product not found in purchase order");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch product details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVariantCheckboxChange = (sku: string, checked: boolean) => {
    setProductVariantsSummary((prev) =>
      prev.map((variant) =>
        variant.variantSku === sku ? { ...variant, selected: checked } : variant
      )
    );

    if (checked) {
      setSelectedVariantSkus((prev) => [...prev, sku]);
    } else {
      setSelectedVariantSkus((prev) => prev.filter((s) => s !== sku));
    }
  };

  const handleReorderExistingSize = async () => {
    if (selectedVariantSkus.length === 0) {
      setError("Please select at least one variant");
      return;
    }

    setReorderMode("existing");
    await populateReorderItems(false);
  };

  const handleReorderNewSize = async () => {
    if (selectedVariantSkus.length === 0) {
      setError("Please select at least one variant");
      return;
    }

    setReorderMode("new");
    await populateReorderItems(true);
  };

  const populateReorderItems = async (isNewSize: boolean) => {
    if (!originalPurchaseOrder) return;

    try {
      setIsLoading(true);

      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

      let newSku = "";
      let newBarcode = "";

      if (isNewSize) {
        // Fetch new SKU and barcode for new size variants
        const [skuResponse, barcodeResponse] = await Promise.all([
          fetch(`${apiBaseUrl}${basePath}/shopify/getsku/1`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${apiBaseUrl}${basePath}/shopify/barcode/1`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        if (skuResponse.ok && barcodeResponse.ok) {
          newSku = await skuResponse.text();
          newBarcode = await barcodeResponse.text();
        }
      }

      const items: ReorderItem[] = [];

      // Process selected variants
      for (const sku of selectedVariantSkus) {
        // Find the variant in the original purchase order
        for (const product of originalPurchaseOrder.products) {
          const variant = product.productVariants.find((v) => v.variantSku === sku);
          if (variant) {
            const margin =
              variant.variantRetail !== 0
                ? (variant.variantRetail - variant.variantCost) / variant.variantRetail
                : 0;

            const item: ReorderItem = {
              productName: product.productName,
              variantColor: variant.variantColor,
              variantSize: variant.variantSize,
              qtyToReorder: 1,
              variantCost: variant.variantCost,
              variantRetail: variant.variantRetail,
              variantSku: isNewSize ? newSku : variant.variantSku,
              variantBarcode: isNewSize ? newBarcode : variant.variantBarcode,
              productType: product.productType,
              productTags: product.productTags,
              variantPreOrder: variant.variantPreOrder,
              variantMetafieldShoeSize: variant.variantMetafieldShoeSize,
              variantMetafieldClothingSize: variant.variantMetafieldClothingSize,
              variantMetafieldJeansSize: variant.variantMetafieldJeansSize,
              variantMetafieldCategory: variant.variantMetafieldCategory,
              lineTotal: variant.variantCost,
              season: originalPurchaseOrder.purchaseOrderSeason,
              margin: margin * 100,
              variantShopifyGid: variant.variantShopifyGid,
              variantShopifyInventoryItemGid: variant.variantShopifyInventoryItemGid,
              variantShopifyProductGid: product.productShopifyGid,
              isNewSize,
            };

            items.push(item);
            break;
          }
        }
      }

      setReorderItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to prepare reorder items");
    } finally {
      setIsLoading(false);
    }
  };

  const updateReorderItemQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;

    setReorderItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, qtyToReorder: newQty, lineTotal: item.variantCost * newQty }
          : item
      )
    );
  };

  const updateReorderItemField = (index: number, field: keyof ReorderItem, value: any) => {
    setReorderItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeReorderItem = (index: number) => {
    setReorderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReorder = async () => {
    if (reorderItems.length === 0) {
      setError("No items to reorder");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

      // Calculate totals
      const subTotal = reorderItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const totalVariantQuantity = reorderItems.reduce((sum, item) => sum + item.qtyToReorder, 0);

      // Group items by product
      const productDict: { [key: string]: any } = {};

      reorderItems.forEach((item) => {
        if (!productDict[item.productName]) {
          productDict[item.productName] = {
            productName: item.productName,
            productShopifyGid: item.variantShopifyProductGid,
            productShopifyHandle: originalPurchaseOrder?.products.find(
              (p) => p.productShopifyGid === item.variantShopifyProductGid
            )?.productShopifyHandle,
            productStyleNumber: originalPurchaseOrder?.products.find(
              (p) => p.productShopifyGid === item.variantShopifyProductGid
            )?.productStyleNumber,
            productShopifyCreatedAt: originalPurchaseOrder?.products.find(
              (p) => p.productShopifyGid === item.variantShopifyProductGid
            )?.productShopifyCreatedAt,
            productSeasonMetafield: item.season,
            productType: item.productType,
            productTags: item.productTags,
            productCanceled: false,
            productReceivedDate: null,
            productVariants: [],
          };
        }

        productDict[item.productName].productVariants.push({
          variantColor: item.variantColor,
          variantSize: item.variantSize,
          variantQuantity: item.qtyToReorder,
          variantCost: item.variantCost,
          variantRetail: item.variantRetail,
          variantSku: item.variantSku,
          variantBarcode: item.variantBarcode,
          variantPreOrder: item.variantPreOrder,
          variantMetafieldShoeSize: item.variantMetafieldShoeSize,
          variantMetafieldClothingSize: item.variantMetafieldClothingSize,
          variantMetafieldJeansSize: item.variantMetafieldJeansSize,
          variantMetafieldCategory: item.variantMetafieldCategory,
          variantQuantityReceived: 0,
          variantQuantityRejected: 0,
          variantCanceled: false,
          variantReceivedComplete: false,
          variantQuantityReceivedDate: null,
          shopifyPreOrderSold: 0,
          variantShopifyGid: item.variantShopifyGid,
          variantShopifyInventoryItemGid: item.variantShopifyInventoryItemGid,
          variantShopifyProductGid: item.variantShopifyProductGid,
        });
      });

      const schema = {
        purchaseOrderID: reorderId,
        brand,
        draftOrder: false,
        publishedOrder: true,
        createdDate,
        startShipDate,
        completedDate: completeDate,
        brandPoNumber: brandPo,
        purchaseOrderSeason: season,
        terms,
        depositPercent: deposit,
        onDeliverPercent: delivery,
        net30Percent: net30,
        purchaseOrderTotalPayments: 0,
        purchaseOrderTotalCredits: 0,
        purchaseOrderTotalItemsCost: subTotal,
        purchaseOrderBalanceDue: subTotal,
        purchaseOrderNotes: notes,
        purchaseOrderCompleteReceive: false,
        totalVariantReceivedQuantity: 0,
        purchaseOrdertotalReceivedValue: 0,
        totalVariantQuantity: totalVariantQuantity,
        totalProductQuantity: Object.keys(productDict).length,
        products: Object.values(productDict),
        orderFlag: reorderMode === "new" ? "new" : "old",
      };

      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/saveDraftPurchaseorder`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(schema),
      });

      if (!response.ok) {
        throw new Error("Failed to submit reorder");
      }

      setSuccess("Reorder submitted successfully");

      // Reset form after successful submission
      setTimeout(() => {
        setProductIdInput("");
        setOriginalPurchaseOrder(null);
        setProductTitle("");
        setProductVariantsSummary([]);
        setReorderMode("none");
        setSelectedVariantSkus([]);
        setReorderItems([]);
        setSuccess("");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit reorder");
    } finally {
      setIsSubmitting(false);
    }
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Calculate totals
  const subTotal = reorderItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalVariantCount = reorderItems.reduce((sum, item) => sum + item.qtyToReorder, 0);
  const grandTotal = subTotal; // No existing payments or credits for new reorders

  return (
    <Layout title="Re Order">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Re Order# <span className="text-purple-600">{reorderId}</span>
            </h1>
            <p className="text-slate-600 mt-1">Create new orders based on previous orders</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-5 space-y-6">
            {/* Product Search */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Product Search</h3>
                <FormField label="Product ID">
                  <div className="flex items-center space-x-3">
                    <Input
                      ref={productIdInputRef}
                      type="text"
                      value={productIdInput}
                      onChange={(e) => setProductIdInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && fetchProductDetails()}
                      placeholder="Enter Shopify Product ID or admin URL"
                      className="flex-1"
                    />
                    <Button
                      onClick={fetchProductDetails}
                      isLoading={isLoading}
                      disabled={!productIdInput.trim()}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </FormField>
                <div className="text-sm text-slate-600">
                  Enter the product ID from the Shopify admin URL (e.g., the number after
                  /products/) or paste the full admin URL.
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

            {/* Product Information */}
            {productTitle && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">Product Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">Product Name:</span>
                      </div>
                      <p className="text-slate-700 ml-6">{productTitle}</p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">Available Variants</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {productVariantsSummary.map((variant, index) => (
                        <label key={index} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={variant.selected}
                            onChange={(e) =>
                              handleVariantCheckboxChange(variant.variantSku, e.target.checked)
                            }
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm">
                            {variant.variantColor} / {variant.variantSize} ({variant.variantSku})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">Reorder Options</h3>
                    <div className="space-y-3">
                      <Button
                        onClick={handleReorderExistingSize}
                        disabled={selectedVariantSkus.length === 0 || reorderMode !== "none"}
                        className="w-full"
                        variant="secondary"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reorder Existing Size
                      </Button>
                      <Button
                        onClick={handleReorderNewSize}
                        disabled={selectedVariantSkus.length === 0 || reorderMode !== "none"}
                        className="w-full"
                        variant="outline"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Reorder New Size
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Order Details */}
            {originalPurchaseOrder && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">Brand Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">Brand:</span>
                        <span className="text-slate-700">{brand}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Leaf className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">Season:</span>
                        <span className="text-slate-700">{season}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">Terms:</span>
                        <span className="text-slate-700">{terms}</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">Dates</h3>
                    <div className="space-y-3">
                      <FormField label="Created Date">
                        <Input
                          type="date"
                          value={createdDate}
                          onChange={(e) => setCreatedDate(e.target.value)}
                        />
                      </FormField>
                      <FormField label="Start Ship Date">
                        <Input
                          type="date"
                          value={startShipDate}
                          onChange={(e) => setStartShipDate(e.target.value)}
                        />
                      </FormField>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">Additional Details</h3>
                    <div className="space-y-3">
                      <FormField label="Complete Date">
                        <Input
                          type="date"
                          value={completeDate}
                          onChange={(e) => setCompleteDate(e.target.value)}
                        />
                      </FormField>
                      <FormField label="Brand PO">
                        <Input
                          type="text"
                          value={brandPo}
                          onChange={(e) => setBrandPo(e.target.value)}
                          placeholder="Brand PO Number"
                        />
                      </FormField>
                      <div className="text-sm text-slate-600">
                        Deposit: {deposit}% - Delivery: {delivery}% - Net30: {net30}%
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Reorder Items Table */}
            {reorderItems.length > 0 && (
              <Card padding="none">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Reorder Items</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
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
                          Barcode
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                          Season
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
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                          S.S
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                          C.S
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                          J.S
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                          CAT
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {reorderItems.map((item, index) => (
                        <tr key={index} className={index % 2 === 1 ? "bg-slate-50" : "bg-white"}>
                          <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                            {item.productName}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.variantColor}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.isNewSize ? (
                              <Input
                                type="text"
                                value={item.variantSize}
                                onChange={(e) =>
                                  updateReorderItemField(index, "variantSize", e.target.value)
                                }
                                className="w-20 text-sm"
                              />
                            ) : (
                              item.variantSize
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() =>
                                  updateReorderItemQuantity(index, item.qtyToReorder - 1)
                                }
                                disabled={item.qtyToReorder <= 1}
                                className="w-6 h-6 flex items-center justify-center rounded bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <Input
                                type="number"
                                min="1"
                                value={item.qtyToReorder}
                                onChange={(e) =>
                                  updateReorderItemQuantity(index, parseInt(e.target.value) || 1)
                                }
                                className="w-16 text-center text-sm"
                              />
                              <button
                                onClick={() =>
                                  updateReorderItemQuantity(index, item.qtyToReorder + 1)
                                }
                                className="w-6 h-6 flex items-center justify-center rounded bg-green-100 text-green-600 hover:bg-green-200"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                            {formatCurrency(item.variantCost)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                            {formatCurrency(item.variantRetail)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.isNewSize ? (
                              <Input
                                type="text"
                                value={item.variantSku}
                                onChange={(e) =>
                                  updateReorderItemField(index, "variantSku", e.target.value)
                                }
                                className="w-24 text-sm"
                              />
                            ) : (
                              item.variantSku
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.isNewSize ? (
                              <Input
                                type="text"
                                value={item.variantBarcode}
                                onChange={(e) =>
                                  updateReorderItemField(index, "variantBarcode", e.target.value)
                                }
                                className="w-32 text-sm"
                              />
                            ) : (
                              item.variantBarcode
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.season}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.productType}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                            {item.productTags}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                item.variantPreOrder === "true" || item.variantPreOrder === true
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {String(item.variantPreOrder)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                            {formatPercentage(item.margin)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900 font-bold">
                            {formatCurrency(item.lineTotal)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.isNewSize ? (
                              <Input
                                type="text"
                                value={item.variantMetafieldShoeSize || ""}
                                onChange={(e) =>
                                  updateReorderItemField(
                                    index,
                                    "variantMetafieldShoeSize",
                                    e.target.value
                                  )
                                }
                                className="w-16 text-sm"
                              />
                            ) : (
                              item.variantMetafieldShoeSize || ""
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.isNewSize ? (
                              <Input
                                type="text"
                                value={item.variantMetafieldClothingSize || ""}
                                onChange={(e) =>
                                  updateReorderItemField(
                                    index,
                                    "variantMetafieldClothingSize",
                                    e.target.value
                                  )
                                }
                                className="w-16 text-sm"
                              />
                            ) : (
                              item.variantMetafieldClothingSize || ""
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.isNewSize ? (
                              <Input
                                type="text"
                                value={item.variantMetafieldJeansSize || ""}
                                onChange={(e) =>
                                  updateReorderItemField(
                                    index,
                                    "variantMetafieldJeansSize",
                                    e.target.value
                                  )
                                }
                                className="w-16 text-sm"
                              />
                            ) : (
                              item.variantMetafieldJeansSize || ""
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.variantMetafieldCategory || ""}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => removeReorderItem(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Notes and Totals */}
            {reorderItems.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">Notes</h3>
                    <FormField label="Order Notes">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                        rows={4}
                        placeholder="Add notes about this reorder..."
                      />
                    </FormField>

                    <div className="text-center">
                      <Button
                        onClick={handleSubmitReorder}
                        isLoading={isSubmitting}
                        disabled={reorderItems.length === 0}
                        size="lg"
                        className="px-8"
                      >
                        <Save className="w-5 h-5 mr-2" />
                        {reorderMode === "new" ? "New Size Reorder" : "Existing Size Reorder"}
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-900">Order Totals</h4>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Sub-Total:</span>
                        <span className="font-semibold">{formatCurrency(subTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Payments:</span>
                        <span className="font-semibold">{formatCurrency(0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Credits:</span>
                        <span className="font-semibold">{formatCurrency(0)}</span>
                      </div>
                      <hr className="border-slate-200" />
                      <div className="flex justify-between items-center text-lg">
                        <span className="font-semibold text-slate-900">Total Balance Due:</span>
                        <span className="font-bold text-slate-900">{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex justify-between items-center text-sm text-slate-600">
                        <span>Total Variants:</span>
                        <span className="font-medium">{totalVariantCount}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Empty State */}
            {!productTitle && !isLoading && (
              <Card className="text-center py-12">
                <RotateCcw className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Start a Reorder</h3>
                <p className="text-slate-600 mb-6">
                  Enter a Shopify product ID to begin creating a reorder based on previous purchase
                  orders.
                </p>
                <div className="text-sm text-slate-500">
                  Features available:
                  <ul className="mt-2 space-y-1">
                    <li>• Reorder existing sizes and colors</li>
                    <li>• Create new size variants</li>
                    <li>• Adjust quantities and details</li>
                    <li>• Generate new purchase orders</li>
                  </ul>
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
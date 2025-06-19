import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import FormField from "../components/ui/FormField";
import DataTable, { Column } from "../components/ui/DataTable";
import ServerMessagePanel from "../components/ui/ServerMessagePanel";
import {
  RotateCcw,
  Package,
  Building2,
  Calendar,
  DollarSign,
  Scan,
  Plus,
  X,
  Upload,
  FileText,
  Save,
  AlertTriangle,
  Trash2,
  ShoppingCart,
  Hash,
  Eye,
  CheckCircle,
} from "lucide-react";

interface ReturnProduct {
  productName: string;
  brand: string;
  variantColor: string;
  variantSize: string;
  variantQuantityReceived: number;
  variantCost: number;
  variantRetail: number;
  variantSku: string;
  variantBarcode: string;
  productType: string;
  qtyToReturn: number;
  lineTotal: number;
  variantShopifyProductGid: string;
  variantShopifyGid: string;
  variantShopifyInventoryItemGid: string;
  variantOriginalPO: string;
}

interface ReturnCredit {
  creditDate: string;
  creditDescription: string;
  creditMethod: string;
  creditAmount: number;
}

interface ReturnFile {
  fileName: string;
  filePath: string;
}

export default function NewReturn() {
  const navigate = useNavigate();
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [createdDate, setCreatedDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [returnProducts, setReturnProducts] = useState<ReturnProduct[]>([]);
  const [returnCredits, setReturnCredits] = useState<ReturnCredit[]>([]);
  const [returnFiles, setReturnFiles] = useState<ReturnFile[]>([]);

  // UI state
  const [vendors, setVendors] = useState<string[]>([]);
  const [isBarcodeEnabled, setIsBarcodeEnabled] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Generate return order ID
  const [returnOrderId] = useState<string>(`${Date.now()}-RT`);

  useEffect(() => {
    fetchVendors();
    // Set today's date as default
    const today = new Date().toISOString().split("T")[0];
    setCreatedDate(today);
  }, []);

  useEffect(() => {
    if (isBarcodeEnabled && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [isBarcodeEnabled]);

  const fetchVendors = async () => {
    try {
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
    }
  };

  const handleBarcodeSubmit = async (barcode: string) => {
    if (!barcode.trim() || !selectedVendor) {
      setError("Please select a vendor and scan a valid barcode");
      return;
    }

    try {
      setIsLoading(true);
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

      const response = await fetch(
        `${apiBaseUrl}${basePath}/shopify/getInformationByBarcode?barcode=${barcode}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Product not found");
      }

      const data = await response.json();

      // Check if brand matches selected vendor
      if (data.brand.trim() !== selectedVendor.trim()) {
        setError("Brand does not match selected vendor");
        return;
      }

      // Check if product has received quantity
      if (data.variantQuantityReceived < 1) {
        setError("Cannot add item with quantity received less than or equal to 0");
        return;
      }

      // Check if product already exists in return list
      const existingProductIndex = returnProducts.findIndex(
        (product) => product.variantBarcode === data.variantBarcode
      );

      if (existingProductIndex !== -1) {
        // Increment quantity if product exists
        const updatedProducts = [...returnProducts];
        const existingProduct = updatedProducts[existingProductIndex];

        if (existingProduct.qtyToReturn + 1 > data.variantQuantityReceived) {
          setError("QTY to return exceeds the total received quantity");
          return;
        }

        existingProduct.qtyToReturn += 1;
        existingProduct.lineTotal = existingProduct.qtyToReturn * existingProduct.variantCost;
        setReturnProducts(updatedProducts);
      } else {
        // Add new product
        const newProduct: ReturnProduct = {
          productName: data.productName,
          brand: data.brand,
          variantColor: data.variantColor,
          variantSize: data.variantSize,
          variantQuantityReceived: data.variantQuantityReceived,
          variantCost: data.variantCost,
          variantRetail: data.variantRetail,
          variantSku: data.variantSku,
          variantBarcode: data.variantBarcode,
          productType: data.productType,
          qtyToReturn: 1,
          lineTotal: data.variantCost,
          variantShopifyProductGid: data.productShopifyGid,
          variantShopifyGid: data.variantShopifyGid,
          variantShopifyInventoryItemGid: data.variantShopifyInventoryItemGid,
          variantOriginalPO: data.purchaseOrderID,
        };
        setReturnProducts([...returnProducts, newProduct]);
      }

      setBarcodeValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch product information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBarcodeSubmit(barcodeValue);
    }
  };

  const removeProduct = (index: number) => {
    const updatedProducts = returnProducts.filter((_, i) => i !== index);
    setReturnProducts(updatedProducts);
  };

  const updateProductQuantity = (index: number, newQty: number) => {
    const updatedProducts = [...returnProducts];
    const product = updatedProducts[index];

    if (newQty > product.variantQuantityReceived) {
      setError("QTY to return exceeds the total received quantity");
      return;
    }

    if (newQty < 1) {
      removeProduct(index);
      return;
    }

    product.qtyToReturn = newQty;
    product.lineTotal = newQty * product.variantCost;
    setReturnProducts(updatedProducts);
  };

  const addCredit = () => {
    const today = new Date().toISOString().split("T")[0];
    const newCredit: ReturnCredit = {
      creditDate: today,
      creditDescription: "",
      creditMethod: "Cash",
      creditAmount: 0,
    };
    setReturnCredits([...returnCredits, newCredit]);
  };

  const removeCredit = (index: number) => {
    const updatedCredits = returnCredits.filter((_, i) => i !== index);
    setReturnCredits(updatedCredits);
  };

  const updateCredit = (index: number, field: keyof ReturnCredit, value: any) => {
    const updatedCredits = [...returnCredits];
    updatedCredits[index] = { ...updatedCredits[index], [field]: value };
    setReturnCredits(updatedCredits);
  };

  const handleFileUpload = async () => {
    if (!selectedFiles) return;

    try {
      setIsUploading(true);
      const formData = new FormData();

      Array.from(selectedFiles).forEach((file) => {
        formData.append("files", file);
      });

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
      const newFiles: ReturnFile[] = data.filePaths.map((path: string) => ({
        fileName: path.split("/").pop() || "",
        filePath: path,
      }));

      setReturnFiles([...returnFiles, ...newFiles]);
      setSelectedFiles(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateReturn = async () => {
    if (!selectedVendor || !createdDate || returnProducts.length === 0) {
      setError("Please fill in all required fields and add at least one product");
      return;
    }

    try {
      setIsCreating(true);
      const token = localStorage.getItem("bridesbyldToken");

      const subTotal = returnProducts.reduce((sum, product) => sum + product.lineTotal, 0);
      const creditTotal = returnCredits.reduce((sum, credit) => sum + credit.creditAmount, 0);
      const grandTotal = subTotal - creditTotal;

      // Group products by original PO for credits
      const originalPOTracker: { [key: string]: any } = {};
      returnProducts.forEach((product) => {
        if (originalPOTracker[product.variantOriginalPO]) {
          originalPOTracker[product.variantOriginalPO].creditAmount += product.lineTotal;
        } else {
          originalPOTracker[product.variantOriginalPO] = {
            variantOriginalPO: product.variantOriginalPO,
            creditAmount: product.lineTotal,
            creditDescription: `Return order Number ${returnOrderId}`,
            creditDate: createdDate,
          };
        }
      });

      const originalPurchaseOrder = Object.values(originalPOTracker);

      const returnData = {
        purchaseOrderID: returnOrderId,
        brand: selectedVendor,
        createdDate: new Date(createdDate),
        purchaseOrderNotes: notes,
        purchaseOrderTotalItemsCost: subTotal,
        purchaseOrderTotalReturnValue: subTotal,
        purchaseOrderTotalCredits: creditTotal,
        purchaseOrderBalanceDue: grandTotal,
        variantReturn: returnProducts,
        totalVariantQuantity: returnProducts.reduce((sum, product) => sum + product.qtyToReturn, 0),
        returnOrderFiles: returnFiles,
        returnOrderCredits: returnCredits,
        originalPurchaseOrder: originalPurchaseOrder,
      };

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/createReturnToVendor`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(returnData),
      });

      if (!response.ok) {
        throw new Error("Failed to create return");
      }

      // Navigate to return detail page or return list
      navigate(`/return-list`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create return");
    } finally {
      setIsCreating(false);
      setShowConfirmModal(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Product table columns
  const productColumns: Column[] = [
    {
      key: "productName",
      header: "Name",
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: "brand",
      header: "Brand",
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: "variantColor",
      header: "Color",
    },
    {
      key: "variantSize",
      header: "Size",
    },
    {
      key: "variantQuantityReceived",
      header: "QTY Available",
      className: "text-center",
    },
    {
      key: "variantCost",
      header: "Cost",
      render: (value) => formatCurrency(value),
      className: "text-right",
    },
    {
      key: "variantRetail",
      header: "Retail",
      render: (value) => formatCurrency(value),
      className: "text-right",
    },
    {
      key: "variantSku",
      header: "SKU",
    },
    {
      key: "variantBarcode",
      header: "Barcode",
    },
    {
      key: "productType",
      header: "P-Type",
    },
    {
      key: "qtyToReturn",
      header: "QTY to Return",
      render: (value, row, index) => (
        <Input
          type="number"
          min="1"
          max={row.variantQuantityReceived}
          value={value}
          onChange={(e) => updateProductQuantity(index!, parseInt(e.target.value) || 0)}
          className="w-20 text-center"
        />
      ),
      className: "text-center",
    },
    {
      key: "lineTotal",
      header: "Total",
      render: (value) => <span className="font-semibold">{formatCurrency(value)}</span>,
      className: "text-right",
    },
    {
      key: "actions",
      header: "Del.",
      render: (_, __, index) => (
        <Button variant="danger" size="sm" onClick={() => removeProduct(index!)}>
          <X className="w-4 h-4" />
        </Button>
      ),
      className: "text-center",
    },
  ];

  // Calculate totals
  const subTotal = returnProducts.reduce((sum, product) => sum + product.lineTotal, 0);
  const creditTotal = returnCredits.reduce((sum, credit) => sum + credit.creditAmount, 0);
  const grandTotal = subTotal - creditTotal;
  const totalQtyToReturn = returnProducts.reduce((sum, product) => sum + product.qtyToReturn, 0);

  return (
    <Layout title="New Return">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Order# <span className="text-purple-600">{returnOrderId}</span> -- Return To Vendor
            </h1>
            <p className="text-slate-600 mt-1">Create a new product return to vendor</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-5 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="space-y-4">
                  <FormField label="Brand" required>
                    <select
                      value={selectedVendor}
                      onChange={(e) => setSelectedVendor(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Choose...</option>
                      {vendors.map((vendor) => (
                        <option key={vendor} value={vendor}>
                          {vendor}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Created Date" required>
                    <Input
                      type="date"
                      value={createdDate}
                      onChange={(e) => setCreatedDate(e.target.value)}
                    />
                  </FormField>
                </div>
              </Card>

              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <Scan className="w-5 h-5 mr-2" />
                    Barcode Scanner
                  </h3>
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setIsBarcodeEnabled(true)}
                        variant={isBarcodeEnabled ? "primary" : "outline"}
                        size="sm"
                      >
                        Add Items
                      </Button>
                      <Button
                        onClick={() => setIsBarcodeEnabled(false)}
                        variant={!isBarcodeEnabled ? "primary" : "outline"}
                        size="sm"
                      >
                        Finished Adding
                      </Button>
                    </div>
                    <FormField label="Scan Barcode">
                      <Input
                        ref={barcodeInputRef}
                        type="text"
                        value={barcodeValue}
                        onChange={(e) => setBarcodeValue(e.target.value)}
                        onKeyPress={handleBarcodeKeyPress}
                        disabled={!isBarcodeEnabled || !selectedVendor}
                        placeholder={!selectedVendor ? "Select a vendor first" : "Scan barcode..."}
                        autoFocus={isBarcodeEnabled}
                      />
                    </FormField>
                  </div>
                </div>
              </Card>
            </div>

            {/* Error Display */}
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

            {/* Products Table */}
            <Card padding="none">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Return Items</h3>
              </div>
              <DataTable
                columns={productColumns}
                data={returnProducts.map((product, index) => ({ ...product, index }))}
                emptyMessage="No items added to return. Use the barcode scanner to add products."
              />
            </Card>

            {/* Credits Section */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Credits</h3>
                  <Button onClick={addCredit} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Credit
                  </Button>
                </div>

                {returnCredits.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No credits added</p>
                ) : (
                  <div className="space-y-3">
                    {returnCredits.map((credit, index) => (
                      <Card
                        key={index}
                        className="border-2 border-dashed border-blue-200 bg-blue-50"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <FormField label="Date">
                            <Input
                              type="date"
                              value={credit.creditDate}
                              onChange={(e) => updateCredit(index, "creditDate", e.target.value)}
                            />
                          </FormField>
                          <FormField label="Description">
                            <Input
                              value={credit.creditDescription}
                              onChange={(e) =>
                                updateCredit(index, "creditDescription", e.target.value)
                              }
                              placeholder="Credit description"
                            />
                          </FormField>
                          <FormField label="Method">
                            <select
                              value={credit.creditMethod}
                              onChange={(e) => updateCredit(index, "creditMethod", e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            >
                              <option value="Cash">Cash</option>
                              <option value="Credit Card">Credit Card</option>
                            </select>
                          </FormField>
                          <FormField label="Amount">
                            <div className="flex space-x-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={credit.creditAmount}
                                onChange={(e) =>
                                  updateCredit(
                                    index,
                                    "creditAmount",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="0.00"
                              />
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => removeCredit(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </FormField>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Notes and Files */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Notes</h3>
                  <FormField label="Additional Notes">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      rows={4}
                      placeholder="Add notes about this return..."
                    />
                  </FormField>
                </div>
              </Card>

              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Files</h3>

                  {/* Existing Files */}
                  {returnFiles.length > 0 && (
                    <div className="space-y-2">
                      {returnFiles.map((file, index) => (
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

            {/* Totals and Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-900">Return Totals</h4>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Sub-Total:</span>
                      <span className="font-semibold">{formatCurrency(subTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Credits:</span>
                      <span className="font-semibold">{formatCurrency(creditTotal)}</span>
                    </div>
                    <hr className="border-slate-200" />
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold text-slate-900">Total Balance Due:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-900">Actions</h4>
                  <Button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={returnProducts.length === 0 || !selectedVendor || !createdDate}
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Create Return
                  </Button>
                </div>
              </Card>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="max-w-md w-full mx-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Confirm Return Creation
                    </h3>
                    <p className="text-slate-600">
                      You are returning {totalQtyToReturn} items to vendor, and reducing the same
                      number from inventory.
                    </p>
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => setShowConfirmModal(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateReturn}
                        isLoading={isCreating}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm
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

import React, { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import FormField from "../components/ui/FormField";
import {
  Upload,
  FileSpreadsheet,
  Plus,
  Trash2,
  Save,
  CheckSquare,
  Square,
  AlertCircle,
  Calendar,
  DollarSign,
  Wifi,
  WifiOff,
} from "lucide-react";
import * as XLSX from "xlsx";
import { io, Socket } from "socket.io-client";

interface Product {
  id: string;
  selected: boolean;
  name: string;
  style: string;
  color: string;
  size: string;
  quantity: number;
  cost: number;
  retail: number;
  sku: string;
  barcode: string;
  season: string;
  category: string;
  tags: string;
  preorder: boolean;
  margin: number;
  total: number;
  shoeSize: string;
  clothingSize: string;
  jeansSize: string;
  metaCategory: string;
}

interface Payment {
  id: string;
  date: string;
  description: string;
  method: string;
  amount: number;
}

interface Credit {
  id: string;
  date: string;
  description: string;
  method: string;
  amount: number;
}

export default function PurchaseOrderImport() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [serverMessages, setServerMessages] = useState<
    Array<{ message: string; isError: boolean }>
  >([]);

  // Form state
  const [formData, setFormData] = useState({
    vendorType: "existing",
    selectedVendor: "",
    newVendor: "",
    category: "",
    preorder: "false",
    sizing: "australia",
    season: "Fall",
    brandSeason: "",
    yearSeason: "23",
    terms: "100% Before Delivery",
    deposit: "0",
    delivery: "100",
    net30: "0",
    brandPO: "",
    createdDate: new Date().toISOString().split("T")[0],
    startShipDate: "",
    completeDate: "",
    notes: "",
  });

  const [totals, setTotals] = useState({
    subTotal: 0,
    paymentTotal: 0,
    creditTotal: 0,
    grandTotal: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authentication check and WebSocket initialization
  useEffect(() => {
    const token = localStorage.getItem("bridesbyldToken");
    if (!token) {
      window.location.href = "/";
      return;
    }

    // Initialize WebSocket connection only after confirming authentication
    initializeWebSocket(token);

    return () => {
      // Cleanup WebSocket on unmount
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const initializeWebSocket = (token: string) => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
    const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

    // Initialize Socket.IO connection with authentication
    const socketInstance = io(apiBaseUrl, {
      path: `${apiBaseUrl}/socket.io/`,
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      auth: {
        token: token,
      },
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Connection event handlers
    socketInstance.on("connect", () => {
      console.log("Socket.IO connected with authentication");
      setSocketConnected(true);
      setServerMessages((prev) => [
        ...prev,
        { message: "Server connected - You are Good to go", isError: false },
      ]);
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket.IO disconnected");
      setSocketConnected(false);
      setServerMessages((prev) => [...prev, { message: "Server disconnected", isError: true }]);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
      setSocketConnected(false);
      setServerMessages((prev) => [
        ...prev,
        { message: `Connection error: ${error.message}`, isError: true },
      ]);

      // If authentication fails, redirect to login
      if (error.message.includes("Authentication") || error.message.includes("Unauthorized")) {
        localStorage.removeItem("bridesbyldToken");
        window.location.href = "/";
      }
    });

    // Authentication error handler
    socketInstance.on("auth_error", (error) => {
      console.error("Socket.IO authentication error:", error);
      setServerMessages((prev) => [
        ...prev,
        { message: `Authentication error: ${error}`, isError: true },
      ]);
      localStorage.removeItem("bridesbyldToken");
      window.location.href = "/";
    });

    // Message event handler
    socketInstance.on("message", (messageContent: string, contentError?: string) => {
      const isError = contentError === "error";
      setServerMessages((prev) => [...prev, { message: messageContent, isError }]);
    });

    setSocket(socketInstance);
  };

  // Load vendors and categories
  useEffect(() => {
    loadVendors();
    loadCategories();
  }, []);

  // Calculate totals when products, payments, or credits change
  useEffect(() => {
    calculateTotals();
  }, [products, payments, credits]);

  const loadVendors = async () => {
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
      const data = await response.json();
      setVendors(data.sort());
    } catch (error) {
      setError("Failed to load vendors");
    }
  };

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/productTypes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setCategories(data.sort());
    } catch (error) {
      setError("Failed to load categories");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError("");
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          await processExcelData(jsonData);
        } catch (error) {
          setError("Failed to process Excel file");
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      setError("Failed to read file");
      setIsLoading(false);
    }
  };

  const processExcelData = async (data: any[][]) => {
    // Find header positions
    let headersPosition = data.findIndex((row) => row.includes("Style Name"));
    if (headersPosition === -1) {
      setError("Invalid Excel format - Style Name column not found");
      return;
    }

    const headers = data[headersPosition];
    const styleNamePos = headers.indexOf("Style Name");
    const styleNumberPos = headers.indexOf("Style Number");
    const colorPos = headers.indexOf("Color");
    const firstSizePos = headers.indexOf("Country of Origin") + 1;
    const costPos = headers.indexOf("WholeSale (USD)");
    const retailPos = headers.indexOf("Sugg. Retail (USD)");

    // Extract form data from Excel
    updateFormFromExcel(data);

    // Count products for SKU/barcode generation
    let productCount = 0;
    for (let i = headersPosition + 1; i < data.length; i++) {
      if (!data[i][styleNamePos]) break;
      for (let j = firstSizePos; j < data[i].length; j++) {
        if (data[i][j] && data[i][j] !== "0" && headers[j] !== "Sugg. Retail (USD)") {
          productCount++;
        }
      }
    }

    // Get SKUs and barcodes
    const token = localStorage.getItem("bridesbyldToken");
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
    const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

    const [skusResponse, barcodesResponse] = await Promise.all([
      fetch(`${apiBaseUrl}${basePath}/shopify/getsku/${productCount}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${apiBaseUrl}${basePath}/shopify/barcode/${productCount}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const skus = await skusResponse.json();
    const barcodes = await barcodesResponse.json();

    // Process products
    const newProducts: Product[] = [];
    let skuIndex = 0;
    let barcodeIndex = 0;

    for (let i = headersPosition + 1; i < data.length; i++) {
      if (!data[i][styleNamePos]) break;

      for (let j = firstSizePos; j < data[i].length; j++) {
        const quantity = data[i][j];
        if (quantity && quantity !== "0" && headers[j] !== "Sugg. Retail (USD)") {
          const cost = parseFloat(data[i][costPos]) || 0;
          const retail = parseFloat(data[i][retailPos]) || 0;
          const margin = retail > 0 ? ((retail - cost) / retail) * 100 : 0;

          newProducts.push({
            id: `${i}-${j}`,
            selected: false,
            name: `${data[i][styleNamePos]} ${data[i][styleNumberPos]} ${data[i][colorPos]}`,
            style: data[i][styleNumberPos],
            color: data[i][colorPos],
            size: headers[j],
            quantity: parseInt(quantity),
            cost,
            retail,
            sku: skus[skuIndex++],
            barcode: barcodes[barcodeIndex++],
            season: "",
            category: "",
            tags: "",
            preorder: false,
            margin,
            total: cost * parseInt(quantity),
            shoeSize: "",
            clothingSize: "",
            jeansSize: "",
            metaCategory: "",
          });
        }
      }
    }

    setProducts(newProducts);
  };

  const updateFormFromExcel = (data: any[][]) => {
    // Extract vendor name
    const vendorName = data[1]?.[1];
    if (vendorName) {
      setFormData((prev) => ({ ...prev, newVendor: vendorName }));
    }

    // Extract PO number
    const poRow = data.findIndex((row) => row.includes("PO Number:"));
    if (poRow !== -1) {
      const poNumber = data[poRow][data[poRow].indexOf("PO Number:") + 1];
      setFormData((prev) => ({ ...prev, brandPO: poNumber }));
    }

    // Extract dates
    const createdRow = data.findIndex((row) => row.includes("Created Date:"));
    if (createdRow !== -1) {
      const createdDate = data[createdRow][data[createdRow].indexOf("Created Date:") + 1];
      setFormData((prev) => ({ ...prev, createdDate: formatDate(createdDate) }));
    }

    const datesRow = data.findIndex((row) => row.includes("Dates"));
    if (datesRow !== -1) {
      const shipDate = data[datesRow + 1]?.[data[datesRow].indexOf("Dates")]?.split(": ")[1];
      const completeDate = data[datesRow + 2]?.[data[datesRow].indexOf("Dates")]?.split(": ")[1];

      setFormData((prev) => ({
        ...prev,
        startShipDate: shipDate ? formatDate(shipDate) : "",
        completeDate: completeDate ? formatDate(completeDate) : "",
      }));
    }
  };

  const formatDate = (dateStr: string): string => {
    const parts = dateStr.split("/");
    const date = new Date(+parts[2], +parts[0] - 1, +parts[1]);
    return date.toISOString().split("T")[0];
  };

  const calculateTotals = () => {
    const subTotal = products.reduce((sum, product) => sum + product.total, 0);
    const paymentTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const creditTotal = credits.reduce((sum, credit) => sum + credit.amount, 0);
    const grandTotal = subTotal - paymentTotal - creditTotal;

    setTotals({ subTotal, paymentTotal, creditTotal, grandTotal });
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setProducts(products.map((product) => ({ ...product, selected: newSelectAll })));
  };

  const handleProductSelect = (id: string) => {
    setProducts(
      products.map((product) =>
        product.id === id ? { ...product, selected: !product.selected } : product
      )
    );
  };

  const applyToSelected = (field: string, value: any) => {
    setProducts(
      products.map((product) => (product.selected ? { ...product, [field]: value } : product))
    );
  };

  const addPayment = () => {
    const newPayment: Payment = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      description: "",
      method: "cash",
      amount: 0,
    };
    setPayments([...payments, newPayment]);
  };

  const addCredit = () => {
    const newCredit: Credit = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      description: "",
      method: "cash",
      amount: 0,
    };
    setCredits([...credits, newCredit]);
  };

  const removePayment = (id: string) => {
    setPayments(payments.filter((payment) => payment.id !== id));
  };

  const removeCredit = (id: string) => {
    setCredits(credits.filter((credit) => credit.id !== id));
  };

  const updatePayment = (id: string, field: string, value: any) => {
    setPayments(
      payments.map((payment) => (payment.id === id ? { ...payment, [field]: value } : payment))
    );
  };

  const updateCredit = (id: string, field: string, value: any) => {
    setCredits(
      credits.map((credit) => (credit.id === id ? { ...credit, [field]: value } : credit))
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Validation and save logic here
      console.log("Saving purchase order...", { formData, products, payments, credits, totals });
      // Add actual save implementation
    } catch (error) {
      setError("Failed to save purchase order");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="New Draft Order" showHeader={true} showFooter={false}>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header Section */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                New Draft Order:
                <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-lg text-sm font-medium">
                  DRAFT
                </span>
              </h1>
              <p className="text-slate-600 mt-1">Import purchase order from Excel file</p>

              {/* Socket Connection Status */}
              <div className="flex items-center gap-2 mt-2">
                {socketConnected ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <Wifi className="w-4 h-4" />
                    <span className="text-sm">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm">Disconnected</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="secondary" size="sm">
                Switch to NeOrder
              </Button>

              <div className="flex gap-2">
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    {selectedFile ? selectedFile.name : "Choose Excel File"}
                  </Button>
                </div>
                <Button
                  onClick={handleFileUpload}
                  isLoading={isLoading}
                  disabled={!selectedFile}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Server Messages */}
        {serverMessages.length > 0 && (
          <Card className="max-h-32 overflow-y-auto">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Server Messages</h3>
            <div className="space-y-1">
              {serverMessages.slice(-5).map((msg, index) => (
                <p
                  key={index}
                  className={`text-xs ${msg.isError ? "text-red-600" : "text-green-600"}`}
                >
                  {msg.message}
                </p>
              ))}
            </div>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </Card>
        )}

        {/* Vendor Selection */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Vendor Information</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="vendorType"
                  value="existing"
                  checked={formData.vendorType === "existing"}
                  onChange={(e) => setFormData({ ...formData, vendorType: e.target.value })}
                  className="text-purple-600"
                />
                <span className="font-medium">Existing Brand</span>
              </label>
              <select
                value={formData.selectedVendor}
                onChange={(e) => setFormData({ ...formData, selectedVendor: e.target.value })}
                disabled={formData.vendorType !== "existing"}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-slate-100"
              >
                <option value="">Choose vendor...</option>
                {vendors.map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="vendorType"
                  value="new"
                  checked={formData.vendorType === "new"}
                  onChange={(e) => setFormData({ ...formData, vendorType: e.target.value })}
                  className="text-purple-600"
                />
                <span className="font-medium">New Brand</span>
              </label>
              <Input
                value={formData.newVendor}
                onChange={(e) => setFormData({ ...formData, newVendor: e.target.value })}
                disabled={formData.vendorType !== "new"}
                placeholder="Enter new vendor name"
              />
            </div>
          </div>
        </Card>

        {/* Control Panel */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Product Controls</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <FormField label="Category">
              <div className="flex gap-2">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Choose category...</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={() => applyToSelected("category", formData.category)}
                  disabled={!formData.category}
                >
                  Apply
                </Button>
                <Button size="sm" variant="danger" onClick={() => applyToSelected("category", "")}>
                  Clear
                </Button>
              </div>
            </FormField>

            <FormField label="Preorder">
              <div className="flex gap-2">
                <select
                  value={formData.preorder}
                  onChange={(e) => setFormData({ ...formData, preorder: e.target.value })}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
                <Button
                  size="sm"
                  onClick={() => applyToSelected("preorder", formData.preorder === "true")}
                >
                  Apply
                </Button>
              </div>
            </FormField>

            <FormField label="Standard Sizing">
              <div className="flex gap-2">
                <select
                  value={formData.sizing}
                  onChange={(e) => setFormData({ ...formData, sizing: e.target.value })}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="australia">Australia</option>
                  <option value="france">France</option>
                  <option value="uk">Great Britain</option>
                  <option value="italy">Italy</option>
                  <option value="us">United States</option>
                  <option value="zimmermann">Zimmermann</option>
                  <option value="jd">Juliet Dunn</option>
                  <option value="lmf">Lisa Marie Fernandez</option>
                </select>
                <Button size="sm">Apply</Button>
              </div>
            </FormField>
          </div>
        </Card>

        {/* Order Details */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField label="Brand PO">
              <Input
                value={formData.brandPO}
                onChange={(e) => setFormData({ ...formData, brandPO: e.target.value })}
                placeholder="Brand PO number"
              />
            </FormField>

            <FormField label="Created Date">
              <Input
                type="date"
                value={formData.createdDate}
                onChange={(e) => setFormData({ ...formData, createdDate: e.target.value })}
                icon={<Calendar className="w-4 h-4 text-slate-400" />}
              />
            </FormField>

            <FormField label="Start Ship Date">
              <Input
                type="date"
                value={formData.startShipDate}
                onChange={(e) => setFormData({ ...formData, startShipDate: e.target.value })}
                icon={<Calendar className="w-4 h-4 text-slate-400" />}
              />
            </FormField>

            <FormField label="Complete Date">
              <Input
                type="date"
                value={formData.completeDate}
                onChange={(e) => setFormData({ ...formData, completeDate: e.target.value })}
                icon={<Calendar className="w-4 h-4 text-slate-400" />}
              />
            </FormField>
          </div>
        </Card>

        {/* Products Table */}
        {products.length > 0 && (
          <Card padding="none">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Products ({products.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center justify-center w-5 h-5 border border-slate-300 rounded hover:bg-slate-100"
                      >
                        {selectAll ? (
                          <CheckSquare className="w-4 h-4 text-purple-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Style
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Color
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Cost
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Retail
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Barcode
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Preorder
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Margin
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {products.map((product, index) => (
                    <tr key={product.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleProductSelect(product.id)}
                          className="flex items-center justify-center w-5 h-5 border border-slate-300 rounded hover:bg-slate-100"
                        >
                          {product.selected ? (
                            <CheckSquare className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{product.style}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{product.color}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{product.size}</td>
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                        {product.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        ${product.cost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        ${product.retail.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-mono">{product.sku}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                        {product.barcode}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{product.category}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            product.preorder
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {product.preorder ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {product.margin.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                        ${product.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Financial Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Credits */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Credits</h3>
              <Button size="sm" onClick={addCredit} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Credit
              </Button>
            </div>
            <div className="space-y-3">
              {credits.map((credit) => (
                <div key={credit.id} className="flex gap-2 items-center">
                  <Input
                    type="date"
                    value={credit.date}
                    onChange={(e) => updateCredit(credit.id, "date", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Description"
                    value={credit.description}
                    onChange={(e) => updateCredit(credit.id, "description", e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={credit.method}
                    onChange={(e) => updateCredit(credit.id, "method", e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="credit">Credit Card</option>
                  </select>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={credit.amount || ""}
                    onChange={(e) =>
                      updateCredit(credit.id, "amount", parseFloat(e.target.value) || 0)
                    }
                    icon={<DollarSign className="w-4 h-4 text-slate-400" />}
                    className="w-32"
                  />
                  <Button size="sm" variant="danger" onClick={() => removeCredit(credit.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Payments */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Payments</h3>
              <Button size="sm" onClick={addPayment} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Payment
              </Button>
            </div>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex gap-2 items-center">
                  <Input
                    type="date"
                    value={payment.date}
                    onChange={(e) => updatePayment(payment.id, "date", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Description"
                    value={payment.description}
                    onChange={(e) => updatePayment(payment.id, "description", e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={payment.method}
                    onChange={(e) => updatePayment(payment.id, "method", e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="credit">Credit Card</option>
                  </select>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={payment.amount || ""}
                    onChange={(e) =>
                      updatePayment(payment.id, "amount", parseFloat(e.target.value) || 0)
                    }
                    icon={<DollarSign className="w-4 h-4 text-slate-400" />}
                    className="w-32"
                  />
                  <Button size="sm" variant="danger" onClick={() => removePayment(payment.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Notes and Totals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <FormField label="Notes">
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Add any notes about this order..."
              />
            </FormField>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Totals</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Sub-Total:</span>
                <span className="font-medium">${totals.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Payments:</span>
                <span className="font-medium">${totals.paymentTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Credits:</span>
                <span className="font-medium">${totals.creditTotal.toFixed(2)}</span>
              </div>
              <hr className="border-slate-200" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Balance Due:</span>
                <span className="text-purple-600">${totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Save Button */}
        <Card className="text-center">
          <Button
            size="lg"
            onClick={handleSave}
            isLoading={isLoading}
            className="flex items-center gap-2 mx-auto"
          >
            <Save className="w-5 h-5" />
            Save Draft Order
          </Button>
        </Card>
      </div>
    </Layout>
  );
}

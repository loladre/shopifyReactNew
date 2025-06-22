import React, { useState, useEffect, useRef } from "react";
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
  Package,
  ShoppingCart,
  Building2,
  Hash,
  Tag,
  Percent,
  CheckCircle,
  X,
  RefreshCw,
  Settings,
  Eye,
  TrendingUp,
} from "lucide-react";
import * as ExcelJS from "exceljs";
import { io, Socket } from "socket.io-client";
import {
  selectMapping,
  sizeMappings,
  sizeMappingFilters,
  shoeSizeFilter,
  getSizeMapping,
  getSizeMappingFilter,
  getMetaCategory,
  convertShoeSize,
  getProductType,
  isDenimShorts,
  sizingOptions,
  seasonOptions,
  yearOptions,
} from "../utils/sizeConversions";

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

interface PurchaseOrderSchema {
  purchaseOrderID: number;
  purchaseOrderNumber: string;
  brand: string;
  draftOrder: boolean;
  publishedOrder: boolean;
  createdDate: string;
  startShipDate: string;
  completedDate: string;
  brandPoNumber: string;
  purchaseOrderSeason: string;
  terms: string;
  depositPercent: string;
  onDeliverPercent: string;
  net30Percent: string;
  purchaseOrderTotalPayments: string;
  purchaseOrderTotalCredits: string;
  purchaseOrderTotalItemsCost: string;
  purchaseOrderBalanceDue: string;
  purchaseOrderNotes: string;
  purchaseOrderCompleteReceive: boolean;
  totalVariantReceivedQuantity: number;
  purchaseOrdertotalReceivedValue: number;
  purchaseOrderFiles: any[];
  totalProductQuantity: number;
  totalVariantQuantity: number;
  products: any[];
  purchaseOrderCredits: any[];
  purchaseOrderPayments: any[];
}

export default function PurchaseOrderImport() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

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
    yearSeason: "26",
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

  // Authentication check and WebSocket initialization
  useEffect(() => {
    const token = localStorage.getItem("bridesbyldToken");
    if (!token) {
      navigate("/");
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
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    // Initialize Socket.IO connection to the correct server endpoint
    const socketInstance = io(apiBaseUrl, {
      path: "/socket.io/",
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
      setSocketConnected(true);
      setServerMessages((prev) => [
        ...prev,
        { message: "Server connected - You are Good to go", isError: false },
      ]);
    });

    socketInstance.on("disconnect", () => {
      setSocketConnected(false);
      setServerMessages((prev) => [...prev, { message: "Server disconnected", isError: true }]);
    });

    socketInstance.on("connect_error", (error) => {
      setSocketConnected(false);
      setServerMessages((prev) => [
        ...prev,
        { message: `Connection error: ${error.message}`, isError: true },
      ]);

      // If authentication fails, redirect to login
      if (error.message.includes("Authentication") || error.message.includes("Unauthorized")) {
        localStorage.removeItem("bridesbyldToken");
        navigate("/");
      }
    });

    // Authentication error handler
    socketInstance.on("auth_error", (error) => {
      setServerMessages((prev) => [
        ...prev,
        { message: `Authentication error: ${error}`, isError: true },
      ]);
      localStorage.removeItem("bridesbyldToken");
      navigate("/");
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

  // Update season and tags when season constructor changes
  useEffect(() => {
    updateAllProductSeasons();
  }, [formData.season, formData.brandSeason, formData.yearSeason, formData.startShipDate]);

  // Update tags when preorder status changes
  useEffect(() => {
    updateAllProductTags();
  }, [formData.season, formData.brandSeason, formData.yearSeason, formData.startShipDate]);

  const loadVendors = async () => {
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
      const data = await response.json();
      setVendors(data.sort());
    } catch (error) {
      setError("Failed to load vendors");
    }
  };

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

      const response = await fetch(`${apiBaseUrl}${basePath}/productTypes`, {
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

  const constructSeason = () => {
    const { season, brandSeason, yearSeason } = formData;
    if (brandSeason) {
      return `${season} ${brandSeason} ${yearSeason}`;
    }
    return `${season}${yearSeason}`;
  };
  const constructTags = (product: Product) => {
    const season = constructSeason();
    let tags = [season];

    if (product.preorder) {
      tags.push("preorder");
      if (formData.startShipDate) {
        const usFormattedDate = formatDateToUS(formData.startShipDate);
        tags.push(`Message2:282727:Ships by ${usFormattedDate}`);
      }
    }

    return tags.join(",");
  };

  const updateAllProductSeasons = () => {
    const season = constructSeason();
    setProducts(
      products.map((product) => ({
        ...product,
        season,
        tags: constructTags(product),
      }))
    );
  };

  const updateAllProductTags = () => {
    setProducts(
      products.map((product) => ({
        ...product,
        tags: constructTags(product),
      }))
    );
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
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.getWorksheet(1); // Get first worksheet
      if (!worksheet) {
        throw new Error("No worksheet found in the Excel file");
      }

      await processExcelData(worksheet);
    } catch (error) {
      console.error("Error processing Excel file:", error);
      setError(error instanceof Error ? error.message : "Failed to process Excel file");
    } finally {
      setIsLoading(false);
    }
  };

  // const processExcelData = async (worksheet: ExcelJS.Worksheet) => {
  //   // Convert worksheet to array format for easier processing
  //   const data: any[][] = [];
  //   worksheet.eachRow((row, rowNumber) => {
  //     const rowData: any[] = [];
  //     row.eachCell((cell, colNumber) => {
  //       rowData[colNumber - 1] = cell.value;
  //     });
  //     data[rowNumber - 1] = rowData;
  //   });

  //   // Find header positions
  //   let headersPosition = data.findIndex(
  //     (row) => row && row.some((cell) => cell && cell.toString().includes("Style Name"))
  //   );

  //   if (headersPosition === -1) {
  //     setError("Invalid Excel format - Style Name column not found");
  //     return;
  //   }

  //   const headers = data[headersPosition];
  //   const styleNamePos = headers.findIndex((h) => h && h.toString().includes("Style Name"));
  //   const styleNumberPos = headers.findIndex((h) => h && h.toString().includes("Style Number"));
  //   const colorPos = headers.findIndex((h) => h && h.toString().includes("Color"));
  //   const countryOfOriginPos = headers.findIndex(
  //     (h) => h && h.toString().includes("Country of Origin")
  //   );
  //   const costPos = headers.findIndex((h) => h && h.toString().includes("WholeSale"));
  //   const retailPos = headers.findIndex((h) => h && h.toString().includes("Sugg. Retail"));

  //   if (styleNamePos === -1 || styleNumberPos === -1 || colorPos === -1) {
  //     setError("Required columns not found in Excel file");
  //     return;
  //   }

  //   // Find the range of size columns - they should be between Country of Origin and Sugg. Retail
  //   const firstSizePos = countryOfOriginPos + 1;
  //   const lastSizePos = retailPos - 1; // Stop before Sugg. Retail column

  //   if (firstSizePos >= lastSizePos) {
  //     setError("No size columns found between Country of Origin and Sugg. Retail");
  //     return;
  //   }

  //   console.log(`Processing size columns from ${firstSizePos} to ${lastSizePos}`);
  //   console.log("Size columns:", headers.slice(firstSizePos, lastSizePos + 1));

  //   // Extract form data from Excel
  //   updateFormFromExcel(data);

  //   // Count products for SKU/barcode generation - count total quantity across all sizes
  //   let totalQuantity = 0;
  //   for (let i = headersPosition + 1; i < data.length; i++) {
  //     if (!data[i] || !data[i][styleNamePos]) break;
  //     for (let j = firstSizePos; j <= lastSizePos; j++) {
  //       const quantity = data[i][j];
  //       if (quantity && quantity !== "0" && quantity !== 0) {
  //         const quantityNum = parseInt(quantity.toString()) || 0;
  //         totalQuantity += quantityNum;
  //       }
  //     }
  //   }

  //   console.log(`Total quantity across all products: ${totalQuantity}`);

  //   // Get SKUs and barcodes based on total quantity
  //   const token = localStorage.getItem("bridesbyldToken");
  //   const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  //   const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

  //   const [skusResponse, barcodesResponse] = await Promise.all([
  //     fetch(`${apiBaseUrl}${basePath}/getsku/${totalQuantity}`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     }),
  //     fetch(`${apiBaseUrl}${basePath}/barcode/${totalQuantity}`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     }),
  //   ]);

  //   const skus = await skusResponse.json();
  //   const barcodes = await barcodesResponse.json();

  //   // Process products
  //   const newProducts: Product[] = [];
  //   let skuIndex = 0;
  //   let barcodeIndex = 0;

  //   for (let i = headersPosition + 1; i < data.length; i++) {
  //     if (!data[i] || !data[i][styleNamePos]) break;

  //     for (let j = firstSizePos; j <= lastSizePos; j++) {
  //       const quantity = data[i][j];
  //       if (quantity && quantity !== "0" && quantity !== 0) {
  //         const cost = parseFloat(data[i][costPos]?.toString() || "0") || 0;
  //         const retail = parseFloat(data[i][retailPos]?.toString() || "0") || 0;
  //         const margin = retail > 0 ? ((retail - cost) / retail) * 100 : 0;
  //         const quantityNum = parseInt(quantity.toString()) || 0;

  //         // Create individual products for each unit in the quantity
  //         for (let k = 0; k < quantityNum; k++) {
  //           const season = constructSeason();
  //           const product: Product = {
  //             id: `${i}-${j}-${k}`,
  //             selected: false,
  //             name: `${data[i][styleNamePos]} ${data[i][styleNumberPos]} ${data[i][colorPos]}`,
  //             style: data[i][styleNumberPos]?.toString() || "",
  //             color: data[i][colorPos]?.toString() || "",
  //             size: headers[j]?.toString() || "",
  //             quantity: 1, // Each product represents 1 unit
  //             cost,
  //             retail,
  //             sku: skus[skuIndex++] || "",
  //             barcode: barcodes[barcodeIndex++] || "",
  //             season,
  //             category: "",
  //             tags: "",
  //             preorder: false,
  //             margin,
  //             total: cost, // Cost for 1 unit
  //             shoeSize: "",
  //             clothingSize: "",
  //             jeansSize: "",
  //             metaCategory: "",
  //           };

  //           // Set initial tags
  //           product.tags = constructTags(product);
  //           newProducts.push(product);
  //         }
  //       }
  //     }
  //   }

  //   console.log(`Processed ${newProducts.length} individual products`);
  //   setSuccess(`Successfully processed ${newProducts.length} products from Excel file`);
  //   setProducts(newProducts);
  // };
  const parseNumericValue = (value: any): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const clean = value.replace(/[^0-9.]/g, ""); // Removes commas, dollar signs, etc.
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const processExcelData = async (worksheet: ExcelJS.Worksheet) => {
    const data: any[][] = [];
    worksheet.eachRow((row, rowNumber) => {
      const rowData: any[] = [];
      row.eachCell((cell, colNumber) => {
        rowData[colNumber - 1] = cell.value;
      });
      data[rowNumber - 1] = rowData;
    });

    // 1. Find header row based on "Style Image" in the first cell
    const headersPosition = data.findIndex(
      (row) => row && row[0] && row[0].toString().trim() === "Style Image"
    );

    if (headersPosition === -1) {
      setError("Invalid Excel format - 'Style Image' row not found");
      return;
    }

    const headers = data[headersPosition];
    const styleNamePos = headers.findIndex((h) => h?.toString().includes("Style Name"));
    const styleNumberPos = headers.findIndex((h) => h?.toString().includes("Style Number"));
    const colorPos = headers.findIndex((h) => h?.toString().includes("Color"));
    const countryOfOriginPos = headers.findIndex((h) =>
      h?.toString().includes("Country of Origin")
    );
    const costPos = headers.findIndex((h) => h?.toString().includes("WholeSale"));
    const retailPos = headers.findIndex((h) => h?.toString().includes("Sugg. Retail"));

    if (styleNamePos === -1 || styleNumberPos === -1 || colorPos === -1) {
      setError("Required columns not found: Style Name, Style Number, or Color");
      return;
    }

    const firstSizePos = countryOfOriginPos + 1;
    const lastSizePos = retailPos - 1;

    if (firstSizePos >= lastSizePos) {
      setError("No size columns found between Country of Origin and Sugg. Retail");
      return;
    }

    console.log(`Detected size columns from index ${firstSizePos} to ${lastSizePos}`);

    // Pull form data if needed
    updateFormFromExcel(data);

    // Count total quantity
    let totalQuantity = 0;
    for (let i = headersPosition + 1; i < data.length; i++) {
      if (!data[i] || !data[i][styleNamePos]) break;
      for (let j = firstSizePos; j <= lastSizePos; j++) {
        const quantity = data[i][j];
        if (quantity && quantity !== "0" && quantity !== 0) {
          const quantityNum = parseInt(quantity.toString()) || 0;
          totalQuantity += quantityNum;
        }
      }
    }

    console.log(`Total quantity: ${totalQuantity}`);

    // Fetch SKUs and barcodes
    const token = localStorage.getItem("bridesbyldToken");
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

    const [skusResponse, barcodesResponse] = await Promise.all([
      fetch(`${apiBaseUrl}${basePath}/getsku/${totalQuantity}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${apiBaseUrl}${basePath}/barcode/${totalQuantity}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const skus = await skusResponse.json();
    const barcodes = await barcodesResponse.json();

    const newProducts: Product[] = [];
    let skuIndex = 0;
    let barcodeIndex = 0;

    for (let i = headersPosition + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[styleNamePos]) break;

      const styleName = row[styleNamePos]?.toString().trim() || "";
      const styleNumber = row[styleNumberPos]?.toString().trim() || "";
      const color = row[colorPos]?.toString().trim() || "";
      const cost = parseNumericValue(row[costPos]);
      const retail = parseNumericValue(row[retailPos]);

      const margin = retail > 0 ? ((retail - cost) / retail) * 100 : 0;
      const season = constructSeason();
      const baseName = `${styleName} ${styleNumber} ${color}`.trim();

      for (let j = firstSizePos; j <= lastSizePos; j++) {
        const size = headers[j]?.toString().trim();
        const quantityCell = row[j];
        const quantityNum = parseInt(quantityCell?.toString() || "0");

        if (!quantityNum || quantityNum <= 0) continue;

        const product: Product = {
          id: `${i}-${j}`,
          selected: false,
          name: baseName,
          style: styleNumber,
          color: color,
          size: size,
          quantity: quantityNum,
          cost,
          retail,
          sku: skus[skuIndex++] || "",
          barcode: barcodes[barcodeIndex++] || "",
          season,
          category: "",
          tags: "",
          preorder: false,
          margin,
          total: cost * quantityNum,
          shoeSize: "",
          clothingSize: "",
          jeansSize: "",
          metaCategory: "",
        };

        product.tags = constructTags(product);
        newProducts.push(product);
      }
    }

    console.log(`Processed ${newProducts.length} products`);
    setSuccess(`Successfully processed ${newProducts.length} products from Excel file`);
    setProducts(newProducts);
  };

  const updateFormFromExcel = (data: any[][]) => {
    // Extract vendor name - look for it in the first few rows
    for (let i = 0; i < Math.min(5, data.length); i++) {
      if (data[i] && data[i][1]) {
        const vendorName = data[i][1].toString().trim();
        if (vendorName && vendorName.length > 2) {
          setFormData((prev) => ({ ...prev, newVendor: vendorName }));
          break;
        }
      }
    }

    // Extract PO number
    const poRow = data.findIndex(
      (row) => row && row.some((cell) => cell && cell.toString().includes("PO Number"))
    );
    if (poRow !== -1) {
      const poIndex = data[poRow].findIndex(
        (cell) => cell && cell.toString().includes("PO Number")
      );
      if (poIndex !== -1 && data[poRow][poIndex + 1]) {
        const poNumber = data[poRow][poIndex + 1].toString();
        setFormData((prev) => ({ ...prev, brandPO: poNumber }));
      }
    }

    // Extract dates
    const createdRow = data.findIndex(
      (row) => row && row.some((cell) => cell && cell.toString().includes("Created Date"))
    );
    if (createdRow !== -1) {
      const createdIndex = data[createdRow].findIndex(
        (cell) => cell && cell.toString().includes("Created Date")
      );
      if (createdIndex !== -1 && data[createdRow][createdIndex + 1]) {
        const createdDate = data[createdRow][createdIndex + 1];
        setFormData((prev) => ({ ...prev, createdDate: formatDate(createdDate) }));
      }
    }

    // Extract ship and complete dates
    const datesRow = data.findIndex(
      (row) => row && row.some((cell) => cell && cell.toString().includes("Dates"))
    );
    if (datesRow !== -1) {
      // Look for dates in subsequent rows
      for (let i = datesRow + 1; i < Math.min(datesRow + 5, data.length); i++) {
        if (data[i]) {
          const rowText = data[i].join(" ").toString();
          if (rowText.includes("Ship") || rowText.includes("Start")) {
            const dateMatch = rowText.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
            if (dateMatch) {
              setFormData((prev) => ({ ...prev, startShipDate: formatDate(dateMatch[1]) }));
            }
          }
          if (rowText.includes("Complete") || rowText.includes("End")) {
            const dateMatch = rowText.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
            if (dateMatch) {
              setFormData((prev) => ({ ...prev, completeDate: formatDate(dateMatch[1]) }));
            }
          }
        }
      }
    }
  };

  const formatDate = (dateInput: any): string => {
    try {
      let date: Date;

      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (typeof dateInput === "string") {
        // Handle MM/DD/YYYY format
        const parts = dateInput.split("/");
        if (parts.length === 3) {
          const month = parseInt(parts[0]) - 1; // Month is 0-indexed
          const day = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          date = new Date(year, month, day);
        } else {
          date = new Date(dateInput);
        }
      } else {
        date = new Date(dateInput);
      }

      if (isNaN(date.getTime())) {
        return "";
      }

      return date.toISOString().split("T")[0];
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };
  const formatDateToUS = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch {
      return isoDate;
    }
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
    const selectedNames = new Set(products.filter((p) => p.selected).map((p) => p.name));

    setProducts(
      products.map((product) => {
        // --- PREORDER APPLY ---
        if (field === "preorder") {
          if (product.selected) {
            const updatedProduct = { ...product, preorder: value };
            updatedProduct.tags = constructTags(updatedProduct);
            return updatedProduct;
          }

          if (selectedNames.has(product.name)) {
            const updatedProduct = { ...product };
            // 🛠 Temporarily override preorder for tags only
            const tagSimulatedProduct = { ...updatedProduct, preorder: value };
            updatedProduct.tags = constructTags(tagSimulatedProduct);
            return updatedProduct;
          }

          return product;
        }

        // --- CATEGORY APPLY ---
        if (field === "category") {
          if (selectedNames.has(product.name)) {
            const shouldClearSizing = product.category !== value;
            const updatedProduct: Product = {
              ...product,
              category: value,
              metaCategory: getMetaCategory(value),
            };

            if (shouldClearSizing) {
              updatedProduct.shoeSize = "";
              updatedProduct.clothingSize = "";
              updatedProduct.jeansSize = "";
            }

            return updatedProduct;
          }
          return product;
        }

        // --- DEFAULT APPLY FOR OTHER FIELDS ---
        if (product.selected) {
          return { ...product, [field]: value };
        }

        return product;
      })
    );
  };

  // Apply standard sizing to ALL products (not just selected)
  const applyStandardSizing = () => {
    const sizeMapping = getSizeMapping(formData.sizing);
    const sizeMappingFilter = getSizeMappingFilter(formData.sizing);

    setProducts(
      products.map((product) => {
        const updatedProduct = { ...product };
        const productType = getProductType(product.category);

        if (productType === "shoes") {
          // For shoes, update shoeSize
          updatedProduct.shoeSize = convertShoeSize(product.size);
        } else if (productType === "jeans") {
          if (isDenimShorts(product.category)) {
            // For denim shorts, apply size mapping and update both size display and jeansSize
            if (sizeMapping[product.size]) {
              updatedProduct.size = sizeMapping[product.size];
            }
            updatedProduct.jeansSize = sizeMappingFilter[product.size] || product.size;
          } else {
            // For regular jeans, just update jeansSize
            updatedProduct.jeansSize = product.size;
          }
        } else if (productType === "clothing") {
          // For clothing, apply size mapping and update clothingSize
          if (sizeMapping[product.size]) {
            updatedProduct.size = sizeMapping[product.size];
          }
          updatedProduct.clothingSize = sizeMappingFilter[product.size] || product.size;
        }

        return updatedProduct;
      })
    );
  };

  const applySeason = () => {
    const season = constructSeason();
    setProducts(
      products.map((product) => ({
        ...product,
        season,
        tags: constructTags(product),
      }))
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

  // Group products by style for alternating row colors
  const getRowClassName = (product: Product, index: number) => {
    const styleGroups: { [key: string]: number } = {};
    let groupIndex = 0;

    products.forEach((p, i) => {
      if (i <= index) {
        if (!styleGroups[p.style]) {
          styleGroups[p.style] = groupIndex++;
        }
      }
    });

    const currentGroupIndex = styleGroups[product.style];
    return currentGroupIndex % 2 === 0 ? "bg-white" : "bg-slate-50";
  };

  // Schema building functions
  const fillBasicDetails = (schema: PurchaseOrderSchema) => {
    // purchaseOrderID - use current epoch timestamp
    schema.purchaseOrderID = new Date().getTime();

    // purchaseOrderNumber
    schema.purchaseOrderNumber = formData.brandPO;

    // brand - check which radio button is selected
    if (formData.vendorType === "existing") {
      schema.brand = formData.selectedVendor;
    } else {
      schema.brand = formData.newVendor;
    }

    // draftOrder and publishedOrder
    schema.draftOrder = true;
    schema.publishedOrder = false;

    // dates
    schema.createdDate = formData.createdDate;
    schema.startShipDate = formData.startShipDate;
    schema.completedDate = formData.completeDate;

    // brandPoNumber
    schema.brandPoNumber = formData.brandPO;

    // season
    schema.purchaseOrderSeason = constructSeason();

    // terms
    schema.terms = formData.terms;
    schema.depositPercent = formData.deposit;
    schema.onDeliverPercent = formData.delivery;
    schema.net30Percent = formData.net30;

    // totals
    schema.purchaseOrderTotalPayments = totals.paymentTotal.toFixed(2);
    schema.purchaseOrderTotalCredits = totals.creditTotal.toFixed(2);
    schema.purchaseOrderTotalItemsCost = totals.subTotal.toFixed(2);
    schema.purchaseOrderBalanceDue = totals.grandTotal.toFixed(2);

    // notes
    schema.purchaseOrderNotes = formData.notes;

    // defaults
    schema.purchaseOrderCompleteReceive = false;
    schema.totalVariantReceivedQuantity = 0;
    schema.purchaseOrdertotalReceivedValue = 0;
    schema.purchaseOrderFiles = [];
  };

  const fillProducts = (schema: PurchaseOrderSchema) => {
    schema.products = [];
    let totalProductQuantity = 0;
    let totalVariantQuantity = 0;
    const productDict: { [key: string]: any } = {};

    products.forEach((product) => {
      const productName = product.name;
      const variant = {
        variantColor: product.color,
        variantSize: product.size,
        variantQuantity: product.quantity,
        variantCost: product.cost.toFixed(2),
        variantRetail: product.retail.toFixed(2),
        variantSku: product.sku,
        variantBarcode: product.barcode,
        variantPreOrder: product.preorder,
        variantMetafieldShoeSize: product.shoeSize,
        variantMetafieldClothingSize: product.clothingSize,
        variantMetafieldJeansSize: product.jeansSize,
        variantMetafieldCategory: product.metaCategory,
        variantQuantityReceived: 0,
        variantQuantityRejected: 0,
        variantCanceled: false,
        variantReceivedComplete: false,
        variantQuantityReceivedDate: null,
        shopifyPreOrderSold: 0,
      };

      totalVariantQuantity += variant.variantQuantity;

      const existingProduct = productDict[productName];
      if (existingProduct) {
        existingProduct.productVariants.push(variant);
        if (product.tags.includes("preorder")) {
          existingProduct.productTags = product.tags;
        }
      } else {
        const newProduct = {
          productName: productName,
          productStyleNumber: product.style,
          productSeasonMetafield: product.season,
          productType: product.category,
          productTags: product.tags,
          productCanceled: false,
          productReceivedDate: null,
          productVariants: [variant],
        };
        productDict[productName] = newProduct;
        totalProductQuantity++;
      }
    });

    schema.totalProductQuantity = totalProductQuantity;
    schema.totalVariantQuantity = totalVariantQuantity;
    schema.products = Object.values(productDict);
  };

  const fillPurchaseOrderCredits = (schema: PurchaseOrderSchema) => {
    schema.purchaseOrderCredits = credits.map((credit) => ({
      creditDate: credit.date,
      creditDescription: credit.description,
      creditMethod: credit.method,
      creditAmount: credit.amount,
    }));
  };

  const fillPurchaseOrderPayments = (schema: PurchaseOrderSchema) => {
    schema.purchaseOrderPayments = payments.map((payment) => ({
      paymentDate: payment.date,
      paymentDescription: payment.description,
      paymentMethod: payment.method,
      paymentAmount: payment.amount,
    }));
  };

  const validateSchema = async (schema: PurchaseOrderSchema): Promise<boolean> => {
    try {
      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

      // Check for duplicate orders
      const response = await fetch(
        `${apiBaseUrl}${basePath}/checkDuplicateOrder?brand=${encodeURIComponent(
          schema.brand
        )}&brandPoNumber=${encodeURIComponent(schema.brandPoNumber)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.duplicate) {
        setError("Combination of brand and PO number already exists");
        return false;
      }
    } catch (error) {
      console.error("Error checking for duplicate orders:", error);
      setError("There was an error checking for duplicate orders. Please try again later.");
      return false;
    }

    // Basic validation
    if (!schema.brand || schema.brand === "undefined") {
      setError("Brand is empty or null");
      return false;
    }

    if (!schema.purchaseOrderID) {
      setError("Purchase Order ID is empty or null");
      return false;
    }

    if (!schema.purchaseOrderTotalItemsCost) {
      setError("Purchase Order Total Items Cost is empty or null");
      return false;
    }

    if (!schema.purchaseOrderBalanceDue) {
      setError("Purchase Order Balance Due is empty or null");
      return false;
    }

    // Validate products
    for (const product of schema.products) {
      if (!product.productName) {
        setError("Product name is empty or null for a product");
        return false;
      }

      if (!product.productSeasonMetafield) {
        setError("Product season metafield is empty or null for a product");
        return false;
      }

      if (!product.productType) {
        setError("Product type is empty or null for a product");
        return false;
      }

      if (!product.productTags) {
        setError("Product tags is empty or null for a product");
        return false;
      }

      // Validate variants
      for (const variant of product.productVariants) {
        if (!variant.variantColor) {
          setError("Variant color is empty or null for a product variant");
          return false;
        }

        if (!variant.variantSize) {
          setError("Variant size is empty or null for a product variant");
          return false;
        }

        if (!variant.variantQuantity) {
          setError("Variant quantity is empty or null for a product variant");
          return false;
        }

        if (!variant.variantCost || variant.variantCost === "0") {
          setError("Variant cost is empty or null for a product variant");
          return false;
        }

        if (!variant.variantRetail || variant.variantRetail === "0") {
          setError("Variant retail is empty or null for a product variant");
          return false;
        }

        if (!variant.variantSku) {
          setError("Variant SKU is empty or null for a product variant");
          return false;
        }

        if (!variant.variantBarcode) {
          setError("Variant barcode is empty or null for a product variant");
          return false;
        }

        if (variant.variantPreOrder === undefined) {
          setError("Variant pre order is undefined for a product variant");
          return false;
        }
      }
    }

    return true;
  };

  const sendPurchaseOrder = async (schema: PurchaseOrderSchema) => {
    const token = localStorage.getItem("bridesbyldToken");
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

    try {
      const response = await fetch(`${apiBaseUrl}${basePath}/saveDraftPurchaseorder`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(schema),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error sending purchase order:", error);
      throw error;
    }
  };

  const createPurchaseOrder = async () => {
    setIsLoading(true);
    setError("");
    setSubmitSuccess(false);

    try {
      const schema: PurchaseOrderSchema = {
        purchaseOrderID: 0,
        purchaseOrderNumber: "",
        brand: "",
        draftOrder: true,
        publishedOrder: false,
        createdDate: "",
        startShipDate: "",
        completedDate: "",
        brandPoNumber: "",
        purchaseOrderSeason: "",
        terms: "",
        depositPercent: "",
        onDeliverPercent: "",
        net30Percent: "",
        purchaseOrderTotalPayments: "",
        purchaseOrderTotalCredits: "",
        purchaseOrderTotalItemsCost: "",
        purchaseOrderBalanceDue: "",
        purchaseOrderNotes: "",
        purchaseOrderCompleteReceive: false,
        totalVariantReceivedQuantity: 0,
        purchaseOrdertotalReceivedValue: 0,
        purchaseOrderFiles: [],
        totalProductQuantity: 0,
        totalVariantQuantity: 0,
        products: [],
        purchaseOrderCredits: [],
        purchaseOrderPayments: [],
      };

      fillBasicDetails(schema);
      fillProducts(schema);
      fillPurchaseOrderCredits(schema);
      fillPurchaseOrderPayments(schema);

      // Debug: Log the schema to console
      console.log("Purchase Order Schema:", JSON.stringify(schema, null, 2));

      // Validate schema
      if (!(await validateSchema(schema))) {
        return;
      }

      // Send to server
      const result = await sendPurchaseOrder(schema);

      setSubmitSuccess(true);
      setSubmitMessage("Draft Purchase order submitted successfully");
      setSuccess("Draft Purchase order submitted successfully");

      // Disable further submissions
      setIsLoading(false);
    } catch (error) {
      console.error("Error creating purchase order:", error);
      setError("OOPS, we ran into a snag, this purchase order was not submitted successfully");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    await createPurchaseOrder();
  };

  // Calculate summary statistics
  const totalProducts = products.length;
  const uniqueStyles = new Set(products.map((p) => p.style)).size;
  const totalCost = products.reduce((sum, p) => sum + p.cost, 0);
  const totalRetail = products.reduce((sum, p) => sum + p.retail, 0);
  const avgMargin =
    products.length > 0 ? products.reduce((sum, p) => sum + p.margin, 0) / products.length : 0;

  return (
    <Layout title="New Purchase Order">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              New Purchase Order
              <span className="ml-3 bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded">
                DRAFT
              </span>
            </h1>
            <p className="text-slate-600 mt-1">
              Import and create a new purchase order from Excel file
            </p>
          </div>
          <div className="flex space-x-3">
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
            <Button onClick={handleFileUpload} isLoading={isLoading} disabled={!selectedFile}>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-5 space-y-6">
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

            {/* Summary Cards */}
            {products.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatusCard
                  title="Total Products"
                  value={totalProducts}
                  icon={Package}
                  color="blue"
                />
                <StatusCard title="Unique Styles" value={uniqueStyles} icon={Tag} color="green" />
                <StatusCard
                  title="Total Cost"
                  value={`$${totalCost.toFixed(2)}`}
                  icon={DollarSign}
                  color="purple"
                />
                <StatusCard
                  title="Avg Margin"
                  value={`${avgMargin.toFixed(1)}%`}
                  icon={Percent}
                  color="orange"
                />
              </div>
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

            {/* Season Constructor & Order Details */}
            <Card>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Season & Order Details</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Season Constructor - Left Half */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-slate-800">Season Constructor</h4>
                  <div className="flex gap-2 items-end">
                    <FormField label="Season">
                      <select
                        value={formData.season}
                        onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 w-28"
                      >
                        {seasonOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Brand">
                      <select
                        value={formData.brandSeason}
                        onChange={(e) => setFormData({ ...formData, brandSeason: e.target.value })}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 flex-1 min-w-0"
                      >
                        <option value="">Select Brand...</option>
                        {vendors.map((vendor) => (
                          <option key={vendor} value={vendor}>
                            {vendor}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Year">
                      <select
                        value={formData.yearSeason}
                        onChange={(e) => setFormData({ ...formData, yearSeason: e.target.value })}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 w-20"
                      >
                        {yearOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <Button size="sm" onClick={applySeason}>
                      Apply
                    </Button>
                  </div>

                  {/* Season Preview */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">Preview: </span>
                    <span className="font-medium text-slate-900">{constructSeason()}</span>
                  </div>
                </div>

                {/* Order Details - Right Half */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-slate-800">Order Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        onChange={(e) =>
                          setFormData({ ...formData, startShipDate: e.target.value })
                        }
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
                </div>
              </div>
            </Card>

            {/* Product Controls */}
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
                      {sizingOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" onClick={applyStandardSizing}>
                      Apply
                    </Button>
                  </div>
                </FormField>
              </div>
            </Card>

            {/* Products Table */}
            {products.length > 0 && (
              <Card padding="none">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Products ({products.length})
                    </h3>
                    <div className="flex items-center space-x-2">
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
                      <span className="text-sm text-slate-600">Select All</span>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <span className="sr-only">Select</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                          Style
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                          Color
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                          Size
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                          Qty
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {products.map((product, index) => (
                        <tr key={product.id} className={getRowClassName(product, index)}>
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
                          <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                            {product.sku}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                            {product.barcode}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{product.season}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{product.category}</td>
                          <td
                            className="px-4 py-3 text-sm text-slate-600 max-w-32 truncate"
                            title={product.tags}
                          >
                            {product.tags}
                          </td>
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
                          <td className="px-4 py-3 text-sm text-slate-600">{product.shoeSize}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {product.clothingSize}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{product.jeansSize}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {product.metaCategory}
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
            {/* Status Messages */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                  <Button variant="ghost" size="sm" onClick={() => setError("")}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Save Button */}
            <Card className="text-center">
              <Button
                size="lg"
                onClick={handleSave}
                isLoading={isLoading}
                disabled={submitSuccess}
                className="flex items-center gap-2 mx-auto"
              >
                <Save className="w-5 h-5" />
                {submitSuccess ? "Order Submitted Successfully" : "Save Draft Order"}
              </Button>
            </Card>

            {/* Empty State */}
            {products.length === 0 && !isLoading && (
              <Card className="text-center py-12">
                <FileSpreadsheet className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Products Loaded</h3>
                <p className="text-slate-600 mb-6">
                  Upload an Excel file containing product data to get started.
                </p>
                <div className="text-sm text-slate-500">
                  <p className="mb-2">Expected Excel format:</p>
                  <ul className="space-y-1">
                    <li>• Style Name, Style Number, Color columns</li>
                    <li>• Size columns between Country of Origin and Sugg. Retail</li>
                    <li>• WholeSale and Sugg. Retail price columns</li>
                    <li>• Quantity values in size columns</li>
                  </ul>
                </div>
              </Card>
            )}

            {/* Loading State */}
            {isLoading && (
              <Card className="text-center py-12">
                <RefreshCw className="w-16 h-16 text-slate-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Processing Data</h3>
                <p className="text-slate-600">Please wait while we process your Excel file...</p>
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

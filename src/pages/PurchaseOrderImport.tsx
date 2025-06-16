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
import * as ExcelJS from "exceljs";
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

// Size mapping objects from your original code
const selectMapping: { [key: string]: string } = {
  "Accessories - Belts": "Belts",
  "Clothing - Swim - Bikinis": "Bikinis",
  "Clothing - Jackets & Coats - Blazers": "Blazers",
  "Clothing - Tops - Blouses": "Blouses",
  "Clothing - Tops - Bodysuits": "Bodysuits",
  "Shoes - Booties & Boots": "Booties & Boots",
  "Accessories - Jewelry - Bracelets": "Bracelets",
  "Handbags - Bucket Bags": "Bucket Bags",
  "Clothing - Tops - Camis": "Camis",
  "Handbags - Clutches": "Clutches",
  "Clothing - Swim - Cover-Ups": "Cover Ups",
  "Clothing - Tops - Cropped": "Cropped Tops",
  "Handbags - Crossbody Bags": "Crossbody Bags",
  "Accessories - Jewelry - Earrings": "Earrings",
  "Shoes - Espadrilles": "Espadrilles",
  "Shoes - Sandals - Flats": "Flats",
  "Accessories - Hair": "Hair",
  "Handbags - Top-Handle Bags": "Handle Bags",
  "Accessories - Hats": "Hats",
  "Shoes - Sandals - Heels": "Heels",
  "Clothing - Jackets & Coats": "Jackets & Coats",
  "Clothing - Denim": "Jeans",
  "Clothing - Jumpsuits": "Jumpsuits",
  "Clothing - Tops - Knitwear": "Knitwear",
  "Clothing - Jackets & Coats - Leather": "Leather",
  "Clothing - Activewear - Leggings": "Leggings",
  "Clothing - Lingerie": "Lingerie",
  "Misc - Lip Balm": "Lip Balm",
  "Clothing - Loungewear": "Loungewear",
  "Clothing - Dresses - Maxi": "Maxi Dresses",
  "Clothing - Dresses - Midi": "Midi Dresses",
  "Clothing - Dresses - Mini": "Mini Dresses",
  "Shoes - Sandals - Mules": "Mules",
  "Accessories - Jewelry - Necklaces": "Necklaces",
  "Clothing - Swim - One Pieces": "One Pieces",
  "Clothing - Pants": "Pants",
  "Clothing - Swim - Pareos": "Pareos",
  "Accessories - Jewelry - Rings": "Rings",
  "Clothing - Rompers": "Rompers",
  "Shoes - Sandals - Wedges": "Sandals",
  "Accessories - Scarves": "Scarves",
  "Clothing - Shorts": "Shorts",
  "Handbags - Shoulder Bags": "Shoulder Bags",
  "Clothing - Skirts": "Skirts",
  "Shoes - Sneakers": "Sneakers",
  "Clothing - Activewear - Sports Bras": "Sports Bras",
  "Accessories - Sunglasses": "Sunglasses",
  "Clothing - Tops - Sweatshirts & Hoodies": "Sweatshirts & Hoodies",
  "Clothing - Tops - T-Shirts": "T-Shirts",
  "Clothing - Tops - Tees & Tanks": "Tees & Tanks",
  "Clothing - Tops": "Tops",
  "Handbags - Totes": "Totes",
  "Accessories - Travel": "Travel",
  "Clothing - Jackets & Coats - Trench Coats": "Trench Coats",
  "Handbags - Wristlets": "Wristlets",
  "Clothing - Denim - Jackets": "Jackets & Coats",
  "Clothing - Denim - Jeans": "Jeans",
  "Clothing - Denim - Shorts": "Shorts",
  "Clothing - Denim - Skirts": "Skirts",
  "Clothing - Jeans": "Jeans",
};

const sizeMappings: { [key: string]: { [key: string]: string } } = {
  france: {
    "32": "FR32 - (US0)",
    "34": "FR34 - (US2)",
    "36": "FR36 - (US4)",
    "38": "FR38 - (US6)",
    "40": "FR40 - (US8)",
    "42": "FR42 - (US10)",
    "44": "FR44 - (US12)",
  },
  australia: {
    "4": "AU4 - (US0)",
    "6": "AU6 - (US2)",
    "8": "AU8 - (US4)",
    "10": "AU10 - (US6)",
    "12": "AU12 - (US8)",
    "14": "AU14 - (US10)",
    "16": "AU16 - (US12)",
    "18": "AU18 - (US14)",
  },
  us: {
    "00": "US00",
    "0": "US0",
    "2": "US2",
    "4": "US4",
    "6": "US6",
    "8": "US8",
    "10": "US10",
    "12": "US12",
    "14": "US14",
  },
  italy: {
    "36": "IT36 - (US0)",
    "38": "IT38 - (US2)",
    "40": "IT40 - (US4)",
    "42": "IT42 - (US6)",
    "44": "IT44 - (US8)",
    "46": "IT46 - (US10)",
    "48": "IT48 - (US12)",
  },
  uk: {
    "4": "UK4 - (US0)",
    "6": "UK6 - (US2)",
    "8": "UK8 - (US4)",
    "10": "UK10 - (US6)",
    "12": "UK12 - (US8)",
    "14": "UK14 - (US10)",
    "16": "UK16 - (US12)",
    "18": "UK18 - (US14)",
  },
  zimmermann: {
    "0": "0 - (US0-2)",
    "1": "1 - (US2-4)",
    "2": "2 - (US6-8)",
    "3": "3 - (US8-10)",
    "4": "4 - (US10-12)",
  },
  jd: {
    "0": "0 - (US0-2)",
    "1": "1 - (US2-4)",
    "2": "2 - (US6-8)",
    "3": "3 - (US8-10)",
  },
  lmf: {
    "1": "1 - (US0-2)",
    "2": "2 - (US2-4)",
    "3": "3 - (US6-8)",
    "4": "4 - (US8-10)",
  },
};

const sizeMappingFilters: { [key: string]: { [key: string]: string } } = {
  france: {
    "P": "XS", "XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL",
    "32": "XXS", "34": "XS", "36": "S", "38": "M", "40": "M", "42": "L", "44": "XL",
  },
  australia: {
    "4": "XS", "6": "XS", "8": "S", "10": "M", "12": "M", "14": "L", "16": "XL", "18": "XL",
    "P": "XS", "XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL",
  },
  us: {
    "00": "XXS", "0": "XS", "2": "XS", "4": "S", "6": "M", "8": "M", "10": "L", "12": "XL", "14": "XL",
    "P": "XS", "XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL",
  },
  italy: {
    "36": "XS", "38": "XS", "40": "S", "42": "M", "44": "M", "46": "L", "48": "XL",
    "P": "XS", "XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL",
  },
  uk: {
    "4": "XS", "6": "XS", "8": "S", "10": "M", "12": "M", "14": "L", "16": "XL", "18": "XL",
    "P": "XS", "XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL",
  },
  zimmermann: {
    "0": "XS", "1": "S", "2": "M", "3": "L", "4": "XL",
    "P": "XS", "XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL",
  },
  jd: {
    "0": "XS", "1": "S", "2": "M", "3": "L",
    "P": "XS", "XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL",
  },
  lmf: {
    "1": "XS", "2": "S", "3": "M", "4": "L",
    "P": "XS", "XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL",
  },
};

const shoeSizeFilter: { [key: string]: string } = {
  "6": "6", "6.5": "6.5", "7": "7", "7.5": "7.5", "8": "8", "8.5": "8.5",
  "9": "9", "9.5": "9.5", "10": "10", "10.5": "10.5", "11": "11",
  "36": "6", "36.5": "6.5", "37": "7", "37.5": "7.5", "38": "8", "38.5": "8.5",
  "39": "9", "39.5": "9.5", "40": "10", "40.5": "10.5", "41": "11",
};

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

    // Initialize Socket.IO connection to the correct server endpoint
    const socketInstance = io(apiBaseUrl, {
      path: "/socket.io/", // Use the correct Socket.IO path from your Apache config
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

  const processExcelData = async (worksheet: ExcelJS.Worksheet) => {
    // Convert worksheet to array format for easier processing
    const data: any[][] = [];
    worksheet.eachRow((row, rowNumber) => {
      const rowData: any[] = [];
      row.eachCell((cell, colNumber) => {
        rowData[colNumber - 1] = cell.value;
      });
      data[rowNumber - 1] = rowData;
    });

    // Find header positions
    let headersPosition = data.findIndex((row) => 
      row && row.some(cell => cell && cell.toString().includes("Style Name"))
    );
    
    if (headersPosition === -1) {
      setError("Invalid Excel format - Style Name column not found");
      return;
    }

    const headers = data[headersPosition];
    const styleNamePos = headers.findIndex(h => h && h.toString().includes("Style Name"));
    const styleNumberPos = headers.findIndex(h => h && h.toString().includes("Style Number"));
    const colorPos = headers.findIndex(h => h && h.toString().includes("Color"));
    const countryOfOriginPos = headers.findIndex(h => h && h.toString().includes("Country of Origin"));
    const costPos = headers.findIndex(h => h && h.toString().includes("WholeSale"));
    const retailPos = headers.findIndex(h => h && h.toString().includes("Sugg. Retail"));

    if (styleNamePos === -1 || styleNumberPos === -1 || colorPos === -1) {
      setError("Required columns not found in Excel file");
      return;
    }

    // Find the range of size columns - they should be between Country of Origin and Sugg. Retail
    const firstSizePos = countryOfOriginPos + 1;
    const lastSizePos = retailPos - 1; // Stop before Sugg. Retail column

    if (firstSizePos >= lastSizePos) {
      setError("No size columns found between Country of Origin and Sugg. Retail");
      return;
    }

    console.log(`Processing size columns from ${firstSizePos} to ${lastSizePos}`);
    console.log("Size columns:", headers.slice(firstSizePos, lastSizePos + 1));

    // Extract form data from Excel
    updateFormFromExcel(data);

    // Count products for SKU/barcode generation - count total quantity across all sizes
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

    console.log(`Total quantity across all products: ${totalQuantity}`);

    // Get SKUs and barcodes based on total quantity
    const token = localStorage.getItem("bridesbyldToken");
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
    const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

    const [skusResponse, barcodesResponse] = await Promise.all([
      fetch(`${apiBaseUrl}${basePath}/shopify/getsku/${totalQuantity}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${apiBaseUrl}${basePath}/shopify/barcode/${totalQuantity}`, {
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
      if (!data[i] || !data[i][styleNamePos]) break;

      for (let j = firstSizePos; j <= lastSizePos; j++) {
        const quantity = data[i][j];
        if (quantity && quantity !== "0" && quantity !== 0) {
          const cost = parseFloat(data[i][costPos]?.toString() || "0") || 0;
          const retail = parseFloat(data[i][retailPos]?.toString() || "0") || 0;
          const margin = retail > 0 ? ((retail - cost) / retail) * 100 : 0;
          const quantityNum = parseInt(quantity.toString()) || 0;

          // Create individual products for each unit in the quantity
          for (let k = 0; k < quantityNum; k++) {
            newProducts.push({
              id: `${i}-${j}-${k}`,
              selected: false,
              name: `${data[i][styleNamePos]} ${data[i][styleNumberPos]} ${data[i][colorPos]}`,
              style: data[i][styleNumberPos]?.toString() || "",
              color: data[i][colorPos]?.toString() || "",
              size: headers[j]?.toString() || "",
              quantity: 1, // Each product represents 1 unit
              cost,
              retail,
              sku: skus[skuIndex++] || "",
              barcode: barcodes[barcodeIndex++] || "",
              season: "",
              category: "",
              tags: "",
              preorder: false,
              margin,
              total: cost, // Cost for 1 unit
              shoeSize: "",
              clothingSize: "",
              jeansSize: "",
              metaCategory: "",
            });
          }
        }
      }
    }

    console.log(`Processed ${newProducts.length} individual products`);
    setProducts(newProducts);
  };

  const updateFormFromExcel = (data: any[][]) => {
    // Extract vendor name - look for it in the first few rows
    for (let i = 0; i < Math.min(5, data.length); i++) {
      if (data[i] && data[i][1]) {
        const vendorName = data[i][1].toString().trim();
        if (vendorName && vendorName.length > 2) {
          setFormData((prev) => ({ ...prev, newVendor: vendorName, brandSeason: vendorName }));
          break;
        }
      }
    }

    // Extract PO number
    const poRow = data.findIndex((row) => 
      row && row.some(cell => cell && cell.toString().includes("PO Number"))
    );
    if (poRow !== -1) {
      const poIndex = data[poRow].findIndex(cell => cell && cell.toString().includes("PO Number"));
      if (poIndex !== -1 && data[poRow][poIndex + 1]) {
        const poNumber = data[poRow][poIndex + 1].toString();
        setFormData((prev) => ({ ...prev, brandPO: poNumber }));
      }
    }

    // Extract dates
    const createdRow = data.findIndex((row) => 
      row && row.some(cell => cell && cell.toString().includes("Created Date"))
    );
    if (createdRow !== -1) {
      const createdIndex = data[createdRow].findIndex(cell => cell && cell.toString().includes("Created Date"));
      if (createdIndex !== -1 && data[createdRow][createdIndex + 1]) {
        const createdDate = data[createdRow][createdIndex + 1];
        setFormData((prev) => ({ ...prev, createdDate: formatDate(createdDate) }));
      }
    }

    // Extract ship and complete dates
    const datesRow = data.findIndex((row) => 
      row && row.some(cell => cell && cell.toString().includes("Dates"))
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
      } else if (typeof dateInput === 'string') {
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

  // Updated function to apply changes to all products with the same style/name
  const applyToSelected = (field: string, value: any) => {
    // Get the styles/names of all selected products
    const selectedProductStyles = new Set(
      products
        .filter(product => product.selected)
        .map(product => `${product.style}-${product.color}`) // Use style + color as unique identifier
    );

    if (selectedProductStyles.size === 0) {
      setError("Please select at least one product first");
      return;
    }

    // Apply the change to all products that match any of the selected styles
    setProducts(products.map(product => {
      const productStyleKey = `${product.style}-${product.color}`;
      if (selectedProductStyles.has(productStyleKey)) {
        let updatedProduct = { ...product, [field]: value };
        
        // If applying category, also update metaCategory
        if (field === 'category' && selectMapping[value]) {
          updatedProduct.metaCategory = selectMapping[value];
        }
        
        return updatedProduct;
      }
      return product;
    }));

    // Clear error if it was set
    setError("");
    
    // Show success message
    const affectedCount = products.filter(product => {
      const productStyleKey = `${product.style}-${product.color}`;
      return selectedProductStyles.has(productStyleKey);
    }).length;
    
    setServerMessages(prev => [
      ...prev,
      { 
        message: `Applied ${field} to ${affectedCount} products across ${selectedProductStyles.size} style(s)`, 
        isError: false 
      }
    ]);
  };

  // Updated function to clear field for selected product styles
  const clearFromSelected = (field: string) => {
    // Get the styles/names of all selected products
    const selectedProductStyles = new Set(
      products
        .filter(product => product.selected)
        .map(product => `${product.style}-${product.color}`) // Use style + color as unique identifier
    );

    if (selectedProductStyles.size === 0) {
      setError("Please select at least one product first");
      return;
    }

    // Clear the field for all products that match any of the selected styles
    setProducts(products.map(product => {
      const productStyleKey = `${product.style}-${product.color}`;
      if (selectedProductStyles.has(productStyleKey)) {
        let updatedProduct = { ...product, [field]: field === 'preorder' ? false : '' };
        
        // If clearing category, also clear metaCategory
        if (field === 'category') {
          updatedProduct.metaCategory = '';
        }
        
        return updatedProduct;
      }
      return product;
    }));

    // Clear error if it was set
    setError("");
    
    // Show success message
    const affectedCount = products.filter(product => {
      const productStyleKey = `${product.style}-${product.color}`;
      return selectedProductStyles.has(productStyleKey);
    }).length;
    
    setServerMessages(prev => [
      ...prev,
      { 
        message: `Cleared ${field} from ${affectedCount} products across ${selectedProductStyles.size} style(s)`, 
        isError: false 
      }
    ]);
  };

  // Apply season to selected products
  const applySeason = () => {
    const seasonString = `${formData.season} ${formData.brandSeason} ${formData.yearSeason}`;
    applyToSelected('season', seasonString);
  };

  // Clear season from selected products
  const clearSeason = () => {
    clearFromSelected('season');
  };

  // Apply standard sizing to selected products
  const applyStandardSizing = () => {
    const selectedProductStyles = new Set(
      products
        .filter(product => product.selected)
        .map(product => `${product.style}-${product.color}`)
    );

    if (selectedProductStyles.size === 0) {
      setError("Please select at least one product first");
      return;
    }

    const sizeMapping = sizeMappings[formData.sizing];
    const sizeMappingFilter = sizeMappingFilters[formData.sizing];

    setProducts(products.map(product => {
      const productStyleKey = `${product.style}-${product.color}`;
      if (selectedProductStyles.has(productStyleKey)) {
        let updatedProduct = { ...product };
        const originalSize = product.size;
        const category = product.category.toLowerCase();

        // Update size display if mapping exists
        if (sizeMapping && sizeMapping[originalSize]) {
          updatedProduct.size = sizeMapping[originalSize];
        }

        // Update sizing fields based on category
        if (category.includes('jeans') || category.includes('denim')) {
          if (category.includes('shorts')) {
            // For denim shorts, use clothing size mapping
            if (sizeMappingFilter && sizeMappingFilter[originalSize]) {
              updatedProduct.clothingSize = sizeMappingFilter[originalSize];
            } else {
              updatedProduct.clothingSize = originalSize;
            }
          } else {
            // For jeans, use original size
            updatedProduct.jeansSize = originalSize;
          }
        } else if (category.includes('shoes')) {
          // For shoes, use shoe size filter
          if (shoeSizeFilter[originalSize]) {
            updatedProduct.shoeSize = shoeSizeFilter[originalSize];
          } else {
            updatedProduct.shoeSize = originalSize;
          }
        } else if (category.includes('clothing')) {
          // For clothing, use clothing size mapping
          if (sizeMappingFilter && sizeMappingFilter[originalSize]) {
            updatedProduct.clothingSize = sizeMappingFilter[originalSize];
          } else {
            updatedProduct.clothingSize = originalSize;
          }
        }

        return updatedProduct;
      }
      return product;
    }));

    // Show success message
    const affectedCount = products.filter(product => {
      const productStyleKey = `${product.style}-${product.color}`;
      return selectedProductStyles.has(productStyleKey);
    }).length;
    
    setServerMessages(prev => [
      ...prev,
      { 
        message: `Applied ${formData.sizing} sizing to ${affectedCount} products across ${selectedProductStyles.size} style(s)`, 
        isError: false 
      }
    ]);
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

  // Generate year options from 26 to 40
  const yearOptions = Array.from({ length: 15 }, (_, i) => (26 + i).toString());

  return (
    <Layout title="New Draft Order" showHeader={true} showFooter={false}>
      <div className="w-full px-6 py-6 space-y-6">
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
          <p className="text-sm text-slate-600 mb-4">
            Select products by checking the boxes, then apply changes to all sizes of the same style.
          </p>
          
          {/* Season Controls */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <h4 className="text-md font-semibold text-slate-900 mb-3">Season</h4>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 max-w-32"
              >
                <option value="Resort">Resort</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
                <option value="Fall">Fall</option>
                <option value="Personal">Personal</option>
                <option value="Consignment">Consignment</option>
              </select>
              
              <select
                value={formData.brandSeason}
                onChange={(e) => setFormData({ ...formData, brandSeason: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 max-w-64"
              >
                <option value="">Select a Vendor Name</option>
                {vendors.map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>
              
              <select
                value={formData.yearSeason}
                onChange={(e) => setFormData({ ...formData, yearSeason: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 max-w-20"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              
              <Button size="sm" onClick={applySeason}>
                Apply
              </Button>
              <Button size="sm" variant="danger" onClick={clearSeason}>
                Delete
              </Button>
            </div>
          </div>

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
                <Button size="sm" variant="danger" onClick={() => clearFromSelected("category")}>
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
                <Button size="sm" variant="danger" onClick={() => clearFromSelected("preorder")}>
                  Clear
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
                <Button size="sm" onClick={applyStandardSizing}>
                  Apply
                </Button>
                <Button size="sm" variant="danger" onClick={() => clearFromSelected("sizing")}>
                  Clear
                </Button>
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
              <p className="text-sm text-slate-600 mt-1">
                Select products to apply bulk changes to all sizes of the same style
              </p>
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
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Style</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Color</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Size</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Qty</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Cost</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Retail</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">SKU</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Barcode</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Season</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">P-Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Tags</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Preorder</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Margin</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">S.S</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">C.S</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">J.S</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">CAT</th>
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
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium">{product.quantity}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">${product.cost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">${product.retail.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-mono">{product.sku}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-mono">{product.barcode}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{product.season}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{product.category}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{product.tags}</td>
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
                      <td className="px-4 py-3 text-sm text-slate-900">{product.margin.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium">${product.total.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{product.shoeSize}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{product.clothingSize}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{product.jeansSize}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{product.metaCategory}</td>
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
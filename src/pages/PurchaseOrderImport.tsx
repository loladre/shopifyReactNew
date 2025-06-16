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
import { 
  getSizeMapping, 
  getSizeMappingFilter, 
  getMetaCategory, 
  convertShoeSize, 
  getProductType, 
  isDenimShorts,
  seasonOptions,
  yearOptions,
  sizingOptions
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

export default function PurchaseOrderImport() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
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

  // Update season for all products when season constructor changes
  useEffect(() => {
    updateAllProductSeasons();
  }, [formData.season, formData.brandSeason, formData.yearSeason]);

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

  const generateSeasonString = () => {
    const { season, brandSeason, yearSeason } = formData;
    if (brandSeason.trim()) {
      return `${season} ${brandSeason} ${yearSeason}`;
    } else {
      return `${season}${yearSeason}`;
    }
  };

  const updateAllProductSeasons = () => {
    const seasonString = generateSeasonString();
    setProducts(prevProducts =>
      prevProducts.map(product => ({
        ...product,
        season: seasonString,
        tags: updateProductTags(product, seasonString)
      }))
    );
  };

  const updateProductTags = (product: Product, seasonString: string) => {
    let tags = seasonString;
    
    if (product.preorder) {
      const shipDate = formData.startShipDate || "TBD";
      tags += `, Preorder, Ships ${shipDate}`;
    }
    
    return tags;
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
          const seasonString = generateSeasonString();

          // Create individual products for each unit in the quantity
          for (let k = 0; k < quantityNum; k++) {
            const product: Product = {
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
              season: seasonString,
              category: "",
              tags: seasonString,
              preorder: false,
              margin,
              total: cost, // Cost for 1 unit
              shoeSize: "",
              clothingSize: "",
              jeansSize: "",
              metaCategory: "",
            };

            newProducts.push(product);
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
          setFormData((prev) => ({ ...prev, newVendor: vendorName }));
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

  const applyToSelected = (field: string, value: any) => {
    const selectedProducts = products.filter(p => p.selected);
    const selectedProductNames = [...new Set(selectedProducts.map(p => p.name))];
    
    setProducts(prevProducts =>
      prevProducts.map(product => {
        if (selectedProductNames.includes(product.name)) {
          let updatedProduct = { ...product, [field]: value };
          
          // Update meta category when category changes
          if (field === 'category') {
            updatedProduct.metaCategory = getMetaCategory(value);
          }
          
          // Update tags when preorder changes
          if (field === 'preorder') {
            updatedProduct.tags = updateProductTags(updatedProduct, updatedProduct.season);
          }
          
          return updatedProduct;
        }
        return product;
      })
    );
  };

  const applyStandardSizing = () => {
    const sizeMapping = getSizeMapping(formData.sizing);
    const sizeMappingFilter = getSizeMappingFilter(formData.sizing);
    
    setProducts(prevProducts =>
      prevProducts.map(product => {
        // Only apply if product has a category (restriction as requested)
        if (!product.category) return product;
        
        const productType = getProductType(product.category);
        let updatedProduct = { ...product };
        
        if (productType === 'shoes') {
          updatedProduct.shoeSize = convertShoeSize(product.size);
          updatedProduct.clothingSize = "";
          updatedProduct.jeansSize = "";
        } else if (productType === 'jeans') {
          if (isDenimShorts(product.category)) {
            updatedProduct.clothingSize = sizeMappingFilter[product.size] || product.size;
            updatedProduct.jeansSize = "";
          } else {
            updatedProduct.jeansSize = sizeMapping[product.size] || product.size;
            updatedProduct.clothingSize = "";
          }
          updatedProduct.shoeSize = "";
        } else if (productType === 'clothing') {
          updatedProduct.clothingSize = sizeMappingFilter[product.size] || product.size;
          updatedProduct.shoeSize = "";
          updatedProduct.jeansSize = "";
        }
        
        return updatedProduct;
      })
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

  const validateSchema = (schema: any): boolean => {
    const errors: string[] = [];

    // Basic validation
    if (!schema.brand || schema.brand === "undefined") {
      errors.push("Brand is empty or null");
    }

    if (!schema.purchaseOrderID) {
      errors.push("Purchase Order ID is empty or null");
    }

    if (!schema.purchaseOrderTotalItemsCost) {
      errors.push("Purchase Order Total Items Cost is empty or null");
    }

    if (!schema.purchaseOrderBalanceDue) {
      errors.push("Purchase Order Balance Due is empty or null");
    }

    // Validate each product
    for (let product of schema.products) {
      if (!product.productName) {
        errors.push("Product name is empty or null for a product");
      }

      if (!product.productSeasonMetafield) {
        errors.push("Product season metafield is empty or null for a product");
      }

      if (!product.productType) {
        errors.push("Product type is empty or null for a product");
      }

      if (!product.productTags) {
        errors.push("Product tags is empty or null for a product");
      }

      // Validate each variant
      for (let variant of product.productVariants) {
        if (!variant.variantColor) {
          errors.push("Variant color is empty or null for a product variant");
        }

        if (!variant.variantSize) {
          errors.push("Variant size is empty or null for a product variant");
        }

        if (!variant.variantQuantity) {
          errors.push("Variant quantity is empty or null for a product variant");
        }

        if (!variant.variantCost || variant.variantCost === "0") {
          errors.push("Variant cost is empty or null for a product variant");
        }

        if (!variant.variantRetail || variant.variantRetail === "0") {
          errors.push("Variant retail is empty or null for a product variant");
        }

        if (!variant.variantSku) {
          errors.push("Variant SKU is empty or null for a product variant");
        }

        if (!variant.variantBarcode) {
          errors.push("Variant barcode is empty or null for a product variant");
        }

        if (variant.variantPreOrder === undefined) {
          errors.push("Variant pre order is undefined for a product variant");
        }
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async () => {
    setIsLoading(true);
    setValidationErrors([]);
    
    try {
      // Build schema object
      const schema = {
        purchaseOrderID: new Date().getTime(),
        purchaseOrderNumber: "",
        brand: formData.vendorType === "existing" ? formData.selectedVendor : formData.newVendor,
        draftOrder: true,
        publishedOrder: false,
        createdDate: formData.createdDate,
        startShipDate: formData.startShipDate,
        completedDate: formData.completeDate,
        brandPoNumber: formData.brandPO,
        purchaseOrderSeason: generateSeasonString(),
        terms: formData.terms,
        depositPercent: formData.deposit,
        onDeliverPercent: formData.delivery,
        net30Percent: formData.net30,
        purchaseOrderTotalPayments: totals.paymentTotal.toString(),
        purchaseOrderTotalCredits: totals.creditTotal.toString(),
        purchaseOrderTotalItemsCost: totals.subTotal.toString(),
        purchaseOrderBalanceDue: totals.grandTotal.toString(),
        purchaseOrderNotes: formData.notes,
        purchaseOrderCompleteReceive: false,
        totalVariantReceivedQuantity: 0,
        purchaseOrdertotalReceivedValue: 0,
        purchaseOrderFiles: [],
        totalProductQuantity: 0,
        totalVariantQuantity: 0,
        products: [],
        purchaseOrderCredits: credits.map(credit => ({
          creditDate: credit.date,
          creditDescription: credit.description,
          creditMethod: credit.method,
          creditAmount: credit.amount,
        })),
        purchaseOrderPayments: payments.map(payment => ({
          paymentDate: payment.date,
          paymentDescription: payment.description,
          paymentMethod: payment.method,
          paymentAmount: payment.amount,
        })),
      };

      // Group products by name for schema
      const productDict: { [key: string]: any } = {};
      let totalProductQuantity = 0;
      let totalVariantQuantity = 0;

      products.forEach(product => {
        const productName = product.name;
        const variant = {
          variantColor: product.color,
          variantSize: product.size,
          variantQuantity: product.quantity,
          variantCost: product.cost.toString(),
          variantRetail: product.retail.toString(),
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

        if (productDict[productName]) {
          productDict[productName].productVariants.push(variant);
          if (product.preorder) {
            productDict[productName].productTags = product.tags;
          }
        } else {
          productDict[productName] = {
            productName: productName,
            productStyleNumber: product.style,
            productSeasonMetafield: product.season,
            productType: product.category,
            productTags: product.tags,
            productCanceled: false,
            productReceivedDate: null,
            productVariants: [variant],
          };
          totalProductQuantity++;
        }
      });

      schema.totalProductQuantity = totalProductQuantity;
      schema.totalVariantQuantity = totalVariantQuantity;
      schema.products = Object.values(productDict);

      // Debug: Log the schema
      console.log("Purchase Order Schema:", JSON.stringify(schema, null, 2));

      // Validate schema
      if (!validateSchema(schema)) {
        return; // Validation errors will be displayed
      }

      // Check for duplicate orders
      const token = localStorage.getItem("bridesbyldToken");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://hushloladre.com";
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || "";

      const duplicateResponse = await fetch(
        `${apiBaseUrl}${basePath}/shopify/checkDuplicateOrder?brand=${schema.brand}&brandPoNumber=${schema.brandPoNumber}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!duplicateResponse.ok) {
        throw new Error(`HTTP error! status: ${duplicateResponse.status}`);
      }

      const duplicateData = await duplicateResponse.json();
      if (duplicateData.duplicate) {
        setValidationErrors(["Combination of brand and PO number already exists"]);
        return;
      }

      // Submit the order
      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/saveDraftPurchaseorder`, {
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
      console.log("Order saved successfully:", data);
      
      // Show success message
      setError("");
      setValidationErrors([]);
      alert("Draft Purchase order submitted successfully");
      
    } catch (error) {
      console.error("Error saving purchase order:", error);
      setValidationErrors([error instanceof Error ? error.message : "Failed to save purchase order"]);
    } finally {
      setIsLoading(false);
    }
  };

  // Group products by style for alternating row colors
  const getRowColorClass = (product: Product, index: number) => {
    const currentStyle = product.name;
    const previousProduct = index > 0 ? products[index - 1] : null;
    const previousStyle = previousProduct?.name;
    
    // Find the first occurrence of this style
    const firstOccurrenceIndex = products.findIndex(p => p.name === currentStyle);
    const styleGroupIndex = [...new Set(products.slice(0, firstOccurrenceIndex + 1).map(p => p.name))].length - 1;
    
    return styleGroupIndex % 2 === 0 ? "bg-white" : "bg-slate-50";
  };

  return (
    <Layout title="New Draft Order" showHeader={true} showFooter={false}>
      <div className="flex w-full">
        {/* Main Content */}
        <div className="flex-1 px-6 py-6 space-y-6">
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

          {/* Season & Order Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Season Constructor</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Season">
                    <select
                      value={formData.season}
                      onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      {seasonOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Year">
                    <select
                      value={formData.yearSeason}
                      onChange={(e) => setFormData({ ...formData, yearSeason: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      {yearOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <FormField label="Brand Season (Optional)">
                  <Input
                    value={formData.brandSeason}
                    onChange={(e) => setFormData({ ...formData, brandSeason: e.target.value })}
                    placeholder="e.g., Zimmermann"
                  />
                </FormField>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">Generated Season: </span>
                  <span className="font-bold text-purple-600">{generateSeasonString()}</span>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Details</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-2 gap-4">
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
              </div>
            </Card>
          </div>

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
                    {sizingOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" onClick={applyStandardSizing}>Apply</Button>
                </div>
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
                      <tr key={product.id} className={getRowColorClass(product, index)}>
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
                        <td className={`px-4 py-3 text-sm font-medium ${
                          product.margin < 56 ? "text-red-600 bg-red-50" : "text-slate-900"
                        }`}>
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

          {/* Validation Errors - Moved below submit button */}
          {validationErrors.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <h3 className="text-sm font-semibold text-red-900 mb-2">Validation Errors</h3>
              <div className="space-y-1">
                {validationErrors.map((error, index) => (
                  <div key={index} className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Server Messages Sidebar */}
        <div className="w-80 border-l border-slate-200 bg-slate-50">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Server Messages</h3>
          </div>
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {serverMessages.length === 0 ? (
              <p className="text-sm text-slate-500">No messages yet...</p>
            ) : (
              serverMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-xs ${
                    msg.isError 
                      ? "bg-red-100 text-red-700 border border-red-200" 
                      : "bg-green-100 text-green-700 border border-green-200"
                  }`}
                >
                  {msg.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
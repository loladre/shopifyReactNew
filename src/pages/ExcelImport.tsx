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
import * as ExcelJS from "exceljs";
import {
  FileSpreadsheet,
  Upload,
  Search,
  DollarSign,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
  Edit,
  Building2,
  Calendar,
  Eye,
  Percent,
  BarChart3,
  Download,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface ExcelRowData {
  item: string;
  price: number;
  percentDiff: string;
  competitorPrice: number;
  competitorName: string;
  competitorLink?: string;
  barcode: string; // Changed from 'id' to 'barcode' to be more explicit
  brand: string;
}

interface EnrichedPriceAdjustmentItem {
  id: string;
  itemName: string;
  brand: string;
  receivedDate: string;
  onSale: boolean;
  price: number;
  salePrice: number;
  cost: number;
  suggestedPrice: number;
  removeDiscount: boolean;
  adjustMainPrice: boolean;
  tags: string;
  handle: string;
  competitorPrice: number;
  competitorName: string;
  competitorLink?: string;
  percentDiff: string;
  selected: boolean;
  shopify: {
    id: string;
    price: string;
    compareAtPrice: string;
    inventoryItem?: {
      unitCost?: {
        amount: string;
      };
    };
    product: {
      id: string;
      title: string;
      handle: string;
      tags: string[];
      metafield?: { value: string };
      variants: any[];
    };
  };
}

export default function ExcelImport() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleInputRef = useRef<HTMLInputElement>(null);

  // State
  const [items, setItems] = useState<EnrichedPriceAdjustmentItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<EnrichedPriceAdjustmentItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [handleSearch, setHandleSearch] = useState<string>("");
  const [filterBy, setFilterBy] = useState<string>("All");
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [selectAll, setSelectAll] = useState(false);
  const [mode, setMode] = useState<"excel" | "single">("single");

  useEffect(() => {
    filterItems();
  }, [filterBy, items]);

  useEffect(() => {
    // Auto-focus handle input when in single mode
    if (mode === "single" && handleInputRef.current) {
      handleInputRef.current.focus();
    }
  }, [mode]);

  const filterItems = () => {
    if (filterBy === "All") {
      setFilteredItems(items);
    } else {
      setFilteredItems(
        items.filter((item) => {
          switch (filterBy) {
            case "Reduce":
              return item.suggestedPrice < (item.onSale ? item.salePrice : item.price);
            case "Raise":
              return item.suggestedPrice > (item.onSale ? item.salePrice : item.price);
            case "OnSale":
              return item.onSale;
            case "NotOnSale":
              return !item.onSale;
            default:
              return true;
          }
        })
      );
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError("");
    }
  };

  const processExcelFile = async (file: File) => {
    try {
      setIsUploading(true);
      setError("");

      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error("No worksheet found in the Excel file");
      }

      const excelData: ExcelRowData[] = [];

      // Process all rows and extract data including hyperlinks
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const values = row.values as any[];

        // Filter out rows with 0% difference
        const percentDiff = values[3];
        if (percentDiff === "0%" || percentDiff === 0) return;

        // Extract competitor link from cell E (column 5) - this is column D in 0-based indexing
        const competitorCell = worksheet.getCell(`E${rowNumber}`);
        let competitorLink: string | undefined;
        
        if (competitorCell.hyperlink) {
          competitorLink = competitorCell.hyperlink;
        } else if (competitorCell.value && typeof competitorCell.value === 'object' && 'hyperlink' in competitorCell.value) {
          competitorLink = (competitorCell.value as any).hyperlink;
        }

        // Extract competitor price from column E (index 4 in values array)
        const competitorPrice = parseFloat(String(values[5]).replace(/[,$]/g, "")) || 0;

        excelData.push({
          item: String(values[1] || "").split(" - ")[0].trim(),
          price: parseFloat(String(values[2]).replace(/[,$]/g, "")) || 0,
          percentDiff: String(percentDiff),
          competitorPrice: competitorPrice,
          competitorName: String(values[5] || ""), // Column E contains competitor name
          competitorLink,
          barcode: String(values[8] || ""), // Column H (index 7) contains the barcode
          brand: String(values[10] || ""), // Column J (index 9) contains the brand
        });
      });

      if (excelData.length === 0) {
        throw new Error("No valid data found in the Excel file");
      }

      // Send all data to backend for processing
      await processBatchData(excelData);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process Excel file");
    } finally {
      setIsUploading(false);
    }
  };

  const processBatchData = async (excelData: ExcelRowData[]) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

      const response = await fetch(`${apiBaseUrl}${basePath}/processPriceMonitorSheet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(excelData),
      });

      if (!response.ok) {
        throw new Error("Failed to process data with backend");
      }

      const enrichedData: any[] = await response.json();
      
      // Process the enriched data locally
      const processedItems = enrichedData
        .filter(item => item.shopify && item.shopify.product) // Only items with valid Shopify data
        .map(item => processEnrichedItem(item))
        .filter(item => item !== null) as EnrichedPriceAdjustmentItem[];

      setItems(processedItems);
      setSuccess(`Successfully processed ${processedItems.length} items`);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process batch data");
    }
  };

  const processEnrichedItem = (enrichedItem: any): EnrichedPriceAdjustmentItem | null => {
    const shopifyData = enrichedItem.shopify;
    
    if (!shopifyData || !shopifyData.product) return null;

    // Skip if competitor price is missing or invalid
    if (enrichedItem.competitorPrice === null || enrichedItem.competitorPrice === undefined) {
      return null;
    }

    // Calculate price and sale price
    let price: number, salePrice: number;
    const compareAtPrice = parseFloat(shopifyData.compareAtPrice || "0");
    const currentPrice = parseFloat(shopifyData.price || "0");

    if (compareAtPrice === 0 || compareAtPrice === null) {
      price = currentPrice;
      salePrice = currentPrice;
    } else {
      price = compareAtPrice;
      salePrice = currentPrice;
    }

    const competitorPrice = parseFloat(enrichedItem.competitorPrice || "0");

    // Filter logic - skip items with small price differences
    const priceDiffPercentage = ((price - competitorPrice) / price) * 100;
    const salePriceDiffPercentage = ((salePrice - competitorPrice) / salePrice) * 100;

    if (
      (Math.abs(priceDiffPercentage) <= 1.5 && salePrice === price) ||
      (salePrice !== price && Math.abs(salePriceDiffPercentage) <= 1.5)
    ) {
      return null;
    }

    const onSale = salePrice !== price;
    
    // Extract cost from enriched data
    const cost = parseFloat(
      shopifyData.inventoryItem?.unitCost?.amount || 
      shopifyData.product.variants?.[0]?.inventoryItem?.unitCost?.amount || 
      "0"
    );

    // Format percentage difference properly
    let formattedPercentDiff = enrichedItem.percentDiff;
    if (typeof formattedPercentDiff === 'number') {
      formattedPercentDiff = `${Math.round(formattedPercentDiff * 100)}%`;
    } else if (typeof formattedPercentDiff === 'string' && !formattedPercentDiff.includes('%')) {
      const numValue = parseFloat(formattedPercentDiff);
      if (!isNaN(numValue)) {
        formattedPercentDiff = `${Math.round(numValue * 100)}%`;
      }
    }

    return {
      id: shopifyData.id,
      itemName: enrichedItem.item || shopifyData.product.title, // Use item from Excel first, fallback to Shopify title
      brand: enrichedItem.brand, // Use brand from Excel
      receivedDate: shopifyData.product.metafield?.value || "",
      onSale,
      price,
      salePrice,
      cost,
      suggestedPrice: competitorPrice,
      removeDiscount: false,
      adjustMainPrice: false,
      tags: shopifyData.product.tags?.join(", ") || "",
      handle: shopifyData.product.handle,
      competitorPrice,
      competitorName: enrichedItem.competitorName,
      competitorLink: enrichedItem.competitorLink,
      percentDiff: formattedPercentDiff,
      selected: false,
      shopify: shopifyData,
    };
  };

  const handleSingleItemSearch = async () => {
    if (!handleSearch.trim()) {
      setError("Please enter a product handle");
      return;
    }

    try {
      setIsSearching(true);
      setError("");

      // Create a single item array for batch processing
      const singleItemData: ExcelRowData[] = [{
        item: handleSearch.trim(),
        price: 0,
        percentDiff: "0%",
        competitorPrice: 0,
        competitorName: "Manual Search",
        competitorLink: "",
        barcode: "", // Will be filled by backend
        brand: "", // Will be filled by backend
      }];

      // Use the same batch processing endpoint
      await processBatchData(singleItemData);

      if (items.length === 0) {
        setError("Item does not meet criteria for price adjustment or was not found");
        return;
      }

      setHandleSearch("");
      setSuccess("Item added successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch item");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setItems(items.map((item) => ({ ...item, selected: checked })));
  };

  const handleItemSelect = (index: number, checked: boolean) => {
    const updatedItems = [...items];
    updatedItems[index].selected = checked;
    setItems(updatedItems);

    // Update select all state
    const allSelected = updatedItems.every((item) => item.selected);
    const noneSelected = updatedItems.every((item) => !item.selected);
    setSelectAll(allSelected);
  };

  const updateItemField = (index: number, field: keyof EnrichedPriceAdjustmentItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Handle checkbox logic
    if (field === "removeDiscount" && value) {
      updatedItems[index].adjustMainPrice = false;
    } else if (field === "adjustMainPrice" && value) {
      updatedItems[index].removeDiscount = false;
    }

    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const handleSubmitPriceAdjustments = async () => {
    const selectedItems = items.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      setError("Please select at least one item to adjust");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const adjustmentData = selectedItems.map((item) => {
        const extractedId = item.id.match(/Product\/(\d+)/)?.[1] || item.id;

        return {
          id: extractedId,
          onSale: item.onSale,
          price: item.price,
          salePrice: item.salePrice,
          suggestedPrice: item.suggestedPrice,
          adjustMainPrice: item.adjustMainPrice,
          removeDiscount: item.removeDiscount,
          tags: item.tags,
        };
      });

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

      const response = await fetch(`${apiBaseUrl}${basePath}/itemsWithPriceToFixPrice2Spy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adjustmentData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit price adjustments");
      }

      const result = await response.json();
      setSuccess(`Successfully updated prices for ${selectedItems.length} items`);

      // Remove processed items from the list
      const remainingItems = items.filter((item) => !item.selected);
      setItems(remainingItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit price adjustments");
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

  const getDecision = (item: EnrichedPriceAdjustmentItem): string => {
    const currentPrice = item.onSale ? item.salePrice : item.price;
    if (item.suggestedPrice > currentPrice) return "Raise";
    if (item.suggestedPrice < currentPrice) return "Reduce";
    return "No Change";
  };

  const getDecisionColor = (decision: string): string => {
    switch (decision) {
      case "Raise":
        return "text-green-600";
      case "Reduce":
        return "text-red-600";
      default:
        return "text-slate-600";
    }
  };

  // Table columns
  const columns: Column[] = [
    {
      key: "selected",
      header: (
        <input
          type="checkbox"
          checked={selectAll}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
        />
      ),
      render: (_, __, index) => (
        <input
          type="checkbox"
          checked={items[index]?.selected || false}
          onChange={(e) => handleItemSelect(index!, e.target.checked)}
          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
        />
      ),
      className: "text-center",
    },
    {
      key: "itemName",
      header: "Item Name",
      render: (value, item) => (
        <a
          href={`https://loladre.com/products/${item.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 hover:text-purple-800 font-medium flex items-center space-x-1"
        >
          <span className="max-w-xs truncate" title={value}>
            {value}
          </span>
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      ),
    },
    {
      key: "brand",
      header: "Brand",
      render: (value, item) => (
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(
            value + " " + item.itemName
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
        >
          {value}
        </a>
      ),
    },
    {
      key: "competitorName",
      header: "Competitor",
      render: (value, item) => {
        if (item.competitorLink) {
          return (
            <a
              href={item.competitorLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>{value}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          );
        }
        return <span>{value}</span>;
      },
    },
    {
      key: "competitorPrice",
      header: "Competitor Price",
      render: (value) => formatCurrency(value),
      className: "text-right",
    },
    {
      key: "percentDiff",
      header: "% Diff",
      render: (value) => (
        <span className={`font-medium ${
          value.startsWith('-') ? 'text-red-600' : 'text-green-600'
        }`}>
          {value}
        </span>
      ),
      className: "text-center",
    },
    {
      key: "receivedDate",
      header: "Received Date",
      render: (value) => value || "-",
    },
    {
      key: "onSale",
      header: "On Sale",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            value ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {value ? "YES" : "NO"}
        </span>
      ),
      className: "text-center",
    },
    {
      key: "price",
      header: "Price",
      render: (value) => formatCurrency(value),
      className: "text-right",
    },
    {
      key: "salePrice",
      header: "Sale Price",
      render: (value) => formatCurrency(value),
      className: "text-right",
    },
    {
      key: "cost",
      header: "Cost",
      render: (value) => formatCurrency(value),
      className: "text-right",
    },
    {
      key: "suggestedPrice",
      header: "Suggested Price",
      render: (value, _, index) => (
        <Input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) =>
            updateItemField(index!, "suggestedPrice", parseFloat(e.target.value) || 0)
          }
          className="w-24 text-right"
        />
      ),
      className: "text-right",
    },
    {
      key: "removeDiscount",
      header: "Remove Discount",
      render: (value, item, index) => (
        <input
          type="checkbox"
          checked={value}
          disabled={!item.onSale}
          onChange={(e) => updateItemField(index!, "removeDiscount", e.target.checked)}
          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
        />
      ),
      className: "text-center",
    },
    {
      key: "adjustMainPrice",
      header: "Adjust Main Price",
      render: (value, item, index) => (
        <input
          type="checkbox"
          checked={value}
          disabled={item.onSale}
          onChange={(e) => updateItemField(index!, "adjustMainPrice", e.target.checked)}
          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
        />
      ),
      className: "text-center",
    },
    {
      key: "decision",
      header: "Decision",
      render: (_, item) => {
        const decision = getDecision(item);
        return <span className={`font-medium ${getDecisionColor(decision)}`}>{decision}</span>;
      },
      className: "text-center",
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, __, index) => (
        <Button variant="danger" size="sm" onClick={() => removeItem(index!)}>
          <X className="w-4 h-4" />
        </Button>
      ),
      className: "text-center",
    },
  ];

  // Calculate statistics
  const selectedCount = items.filter((item) => item.selected).length;
  const raiseCount = filteredItems.filter((item) => getDecision(item) === "Raise").length;
  const reduceCount = filteredItems.filter((item) => getDecision(item) === "Reduce").length;
  const onSaleCount = filteredItems.filter((item) => item.onSale).length;

  return (
    <Layout title="Price Adjustment">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Price Adjust</h1>
            <p className="text-slate-600 mt-1">
              Import competitor prices and adjust product pricing
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => setMode(mode === "excel" ? "single" : "excel")}
              variant="outline"
            >
              Switch to {mode === "excel" ? "Single Item" : "Excel Import"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-5 space-y-6">
            {/* Mode Toggle and Input */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {mode === "excel" ? "Excel Import" : "Single Item Search"}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-sm ${
                        mode === "single" ? "font-semibold text-purple-600" : "text-slate-500"
                      }`}
                    >
                      Single Item
                    </span>
                    <button
                      onClick={() => setMode(mode === "excel" ? "single" : "excel")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        mode === "excel" ? "bg-purple-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          mode === "excel" ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span
                      className={`text-sm ${
                        mode === "excel" ? "font-semibold text-purple-600" : "text-slate-500"
                      }`}
                    >
                      Excel Import
                    </span>
                  </div>
                </div>

                {mode === "excel" ? (
                  <div className="space-y-4">
                    <FormField label="Upload Excel File">
                      <div className="flex items-center space-x-3">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileSelect}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => selectedFile && processExcelFile(selectedFile)}
                          disabled={!selectedFile || isUploading}
                          isLoading={isUploading}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Process File
                        </Button>
                      </div>
                    </FormField>
                    <div className="text-sm text-slate-600">
                      <p>
                        Expected Excel format: Item, Price, % Diff, Competitor Price, Competitor Name (with link), ..., Barcode (Column H), ..., Brand (Column J)
                      </p>
                      <p>Rows with 0% difference will be automatically filtered out.</p>
                      <p>Competitor links will be automatically extracted from Excel hyperlinks.</p>
                      <p><strong>Note:</strong> Column H should contain the product barcode, not a variant GID.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FormField label="Product Handle">
                      <div className="flex items-center space-x-3">
                        <Input
                          ref={handleInputRef}
                          type="text"
                          value={handleSearch}
                          onChange={(e) => setHandleSearch(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSingleItemSearch()}
                          placeholder="Enter product handle..."
                          className="flex-1"
                        />
                        <Button
                          onClick={handleSingleItemSearch}
                          disabled={!handleSearch.trim() || isSearching}
                          isLoading={isSearching}
                        >
                          <Search className="w-4 h-4 mr-2" />
                          Search
                        </Button>
                      </div>
                    </FormField>
                  </div>
                )}
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

            {/* Summary Cards */}
            {items.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatusCard title="Total Items" value={items.length} icon={Package} color="blue" />
                <StatusCard
                  title="Selected"
                  value={selectedCount}
                  icon={CheckCircle}
                  color="green"
                />
                <StatusCard
                  title="Price Increases"
                  value={raiseCount}
                  icon={TrendingUp}
                  color="green"
                />
                <StatusCard
                  title="Price Reductions"
                  value={reduceCount}
                  icon={BarChart3}
                  color="red"
                />
              </div>
            )}

            {/* Filters */}
            {items.length > 0 && (
              <Card>
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-semibold text-slate-700">Filter by:</label>
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="All">All Items</option>
                    <option value="Raise">Price Increases</option>
                    <option value="Reduce">Price Reductions</option>
                    <option value="OnSale">On Sale</option>
                    <option value="NotOnSale">Not On Sale</option>
                  </select>
                  <span className="text-sm text-slate-600">
                    Showing {filteredItems.length} of {items.length} items
                  </span>
                </div>
              </Card>
            )}

            {/* Items Table */}
            {items.length > 0 && (
              <Card padding="none">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Price Adjustment Items</h3>
                    <Button
                      onClick={handleSubmitPriceAdjustments}
                      disabled={selectedCount === 0 || isSubmitting}
                      isLoading={isSubmitting}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Fix Prices ({selectedCount})
                    </Button>
                  </div>
                </div>
                <DataTable
                  columns={columns}
                  data={filteredItems.map((item, index) => ({
                    ...item,
                    index: items.indexOf(item),
                  }))}
                  emptyMessage="No items match the current filter"
                />
              </Card>
            )}

            {/* Empty State */}
            {items.length === 0 && (
              <Card className="text-center py-12">
                <FileSpreadsheet className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Items Loaded</h3>
                <p className="text-slate-600 mb-6">
                  {mode === "excel"
                    ? "Upload an Excel file with competitor pricing data to get started."
                    : "Search for individual products by their handle to add them for price adjustment."}
                </p>
                <div className="text-sm text-slate-500">
                  <p className="mb-2">Features available:</p>
                  <ul className="space-y-1">
                    <li>• Import competitor pricing from Excel files with automatic link extraction</li>
                    <li>• Batch processing of all items at once</li>
                    <li>• Search individual products by handle</li>
                    <li>• Bulk price adjustments with suggested pricing</li>
                    <li>• Remove discounts or adjust main prices</li>
                    <li>• Filter and sort items by various criteria</li>
                  </ul>
                </div>
              </Card>
            )}

            {/* Instructions */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Instructions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Excel Import Mode</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Upload Excel files with competitor pricing data</li>
                      <li>• System processes all items in a single batch request</li>
                      <li>• Competitor links are automatically extracted from Excel hyperlinks</li>
                      <li>• Items with less than 1.5% price difference are excluded</li>
                      <li>• Bulk processing of multiple products at once</li>
                      <li>• <strong>Column H must contain product barcodes</strong></li>
                      <li>• <strong>Column J must contain brand names</strong></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Single Item Mode</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Search individual products by their Shopify handle</li>
                      <li>• Manual price adjustment for specific items</li>
                      <li>• Real-time validation against competitor pricing</li>
                      <li>• Ideal for targeted price updates</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
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
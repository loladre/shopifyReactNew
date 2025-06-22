import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import FormField from "../components/ui/FormField";
import ServerMessagePanel from "../components/ui/ServerMessagePanel";
import * as ExcelJS from "exceljs";
import {
  TrendingUp,
  Upload,
  Calendar,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  X,
  BarChart3,
  DollarSign,
  Package,
} from "lucide-react";

interface SellThroughData {
  date: string;
  season: string;
  brand: string;
  qoh: number;
  costValue: number;
  retailValue: number;
  qtySold: number;
  qtyReceived: number;
  netSales: number;
  grossMarginDollar: number;
  grossMarginPercent: number;
  cogs: number;
  sellThrough: number;
}

export default function SellThroughImport() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("Choose file");

  // UI state
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [processedData, setProcessedData] = useState<SellThroughData[]>([]);

  // Set today's date as default
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
  }, []);

  const seasonOptions = [
    { value: "", label: "Choose..." },
    { value: "Spring 23", label: "Spring 23" },
    { value: "Summer 23", label: "Summer 23" },
    { value: "Fall 23", label: "Fall 23" },
    { value: "Resort 24", label: "Resort 24" },
    { value: "Spring 24", label: "Spring 24" },
    { value: "Summer 24", label: "Summer 24" },
    { value: "Fall 24", label: "Fall 24" },
    { value: "Resort 25", label: "Resort 25" },
    { value: "Spring 25", label: "Spring 25" },
    { value: "Summer 25", label: "Summer 25" },
    { value: "Fall 25", label: "Fall 25" },
    { value: "Resort 26", label: "Resort 26" },
    { value: "Spring 26", label: "Spring 26" },
    { value: "Summer 26", label: "Summer 26" },
    { value: "Fall 26", label: "Fall 26" },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
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

      const sellThroughData: SellThroughData[] = [];

      // Skip header row and process data
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const values = row.values as any[];

        // Filter out rows with 0% or empty data
        const percentDiff = values[3];
        if (percentDiff === "0%" || percentDiff === 0 || !values[1]) return;

        const rowData: SellThroughData = {
          date: selectedDate,
          season: selectedSeason,
          brand: String(values[1] || ""),
          qoh: parseFloat(String(values[2]).replace(/[,$]/g, "")) || 0,
          costValue: parseFloat(String(values[3]).replace(/[,$]/g, "")) || 0,
          retailValue: parseFloat(String(values[4]).replace(/[,$]/g, "")) || 0,
          qtySold: parseFloat(String(values[5]).replace(/[,$]/g, "")) || 0,
          qtyReceived: parseFloat(String(values[6]).replace(/[,$]/g, "")) || 0,
          netSales: parseFloat(String(values[7]).replace(/[,$]/g, "")) || 0,
          grossMarginDollar: parseFloat(String(values[8]).replace(/[,$]/g, "")) || 0,
          grossMarginPercent: parseFloat(String(values[9]).replace(/[,$%]/g, "")) || 0,
          cogs: parseFloat(String(values[10]).replace(/[,$]/g, "")) || 0,
          sellThrough: parseFloat(String(values[11]).replace(/[,$%]/g, "")) || 0,
        };

        sellThroughData.push(rowData);
      });

      setProcessedData(sellThroughData);
      await sendData(sellThroughData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process Excel file");
    } finally {
      setIsUploading(false);
    }
  };

  const sendData = async (data: SellThroughData[]) => {
    try {
      const token = localStorage.getItem("bridesbyldToken");

      if (!token) {
        navigate("/");
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

      const response = await fetch(`${apiBaseUrl}${basePath}/saveSellThroughData`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save sell-through data");
      }

      const result = await response.json();
      setSuccess(`Successfully imported ${data.length} sell-through records for ${selectedSeason}`);

      // Reset form
      setSelectedFile(null);
      setFileName("Choose file");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save sell-through data");
    }
  };

  const handleUpload = () => {
    if (!selectedDate) {
      setError("Please select a date");
      return;
    }

    if (!selectedSeason) {
      setError("Please select a season");
      return;
    }

    if (!selectedFile) {
      setError("Please select an Excel file");
      return;
    }

    processExcelFile(selectedFile);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // Calculate summary statistics
  const totalRecords = processedData.length;
  const totalNetSales = processedData.reduce((sum, item) => sum + item.netSales, 0);
  const totalQtySold = processedData.reduce((sum, item) => sum + item.qtySold, 0);
  const averageSellThrough =
    totalRecords > 0
      ? processedData.reduce((sum, item) => sum + item.sellThrough, 0) / totalRecords
      : 0;

  return (
    <Layout title="Sell Through Import">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Sell Through Import</h1>
            <p className="text-slate-600 mt-1">Import weekly sell-through data from Excel files</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-5 space-y-6">
            {/* Import Form */}
            <Card>
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Import Sell-Through Data
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField label="Date" required>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </FormField>

                  <FormField label="Season" required>
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {seasonOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Excel File" required>
                    <div className="space-y-3">
                      <div className="relative">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="excel-upload"
                        />
                        <label
                          htmlFor="excel-upload"
                          className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors duration-200"
                        >
                          <FileSpreadsheet className="w-5 h-5 mr-2 text-slate-400" />
                          <span className="text-slate-600">{fileName}</span>
                        </label>
                      </div>
                      <Button
                        onClick={handleUpload}
                        disabled={!selectedDate || !selectedSeason || !selectedFile || isUploading}
                        isLoading={isUploading}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploading ? "Processing..." : "Upload & Process"}
                      </Button>
                    </div>
                  </FormField>
                </div>

                <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Expected Excel Format:</h4>
                  <p className="mb-2">
                    The Excel file should contain the following columns in order:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span>1. Brand</span>
                    <span>2. QOH (Quantity on Hand)</span>
                    <span>3. Cost Value</span>
                    <span>4. Retail Value</span>
                    <span>5. Qty Sold</span>
                    <span>6. Qty Received</span>
                    <span>7. Net Sales</span>
                    <span>8. Gross Margin ($)</span>
                    <span>9. Gross Margin (%)</span>
                    <span>10. COGS</span>
                    <span>11. Sell Through (%)</span>
                  </div>
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

            {/* Summary Cards */}
            {processedData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Total Records</p>
                      <p className="text-2xl font-bold text-blue-900">{totalRecords}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Total Net Sales</p>
                      <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(totalNetSales)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Total Qty Sold</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {totalQtySold.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 text-sm font-medium">Avg Sell Through</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {formatPercentage(averageSellThrough)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Import Summary */}
            {processedData.length > 0 && (
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Import Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Import Date:</span>
                        <span className="font-semibold text-slate-900">{selectedDate}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Season:</span>
                        <span className="font-semibold text-slate-900">{selectedSeason}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Records Processed:</span>
                        <span className="font-semibold text-slate-900">{totalRecords}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Total Net Sales:</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(totalNetSales)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Total Units Sold:</span>
                        <span className="font-semibold text-slate-900">
                          {totalQtySold.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Average Sell Through:</span>
                        <span className="font-semibold text-slate-900">
                          {formatPercentage(averageSellThrough)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Empty State */}
            {processedData.length === 0 && !isUploading && (
              <Card className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Import Sell-Through Data
                </h3>
                <p className="text-slate-600 mb-6">
                  Upload an Excel file containing weekly sell-through data to get started.
                </p>
                <div className="text-sm text-slate-500">
                  Features available:
                  <ul className="mt-2 space-y-1">
                    <li>• Import weekly sell-through data from Excel files</li>
                    <li>• Automatic data validation and processing</li>
                    <li>• Support for multiple seasons and date ranges</li>
                    <li>• Real-time summary statistics</li>
                  </ul>
                </div>
              </Card>
            )}

            {/* Instructions */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Import Instructions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Before Importing</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Ensure your Excel file follows the expected format</li>
                      <li>• Select the correct date for the sell-through period</li>
                      <li>• Choose the appropriate season from the dropdown</li>
                      <li>• Verify all numerical data is properly formatted</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Data Processing</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• System automatically removes rows with 0% values</li>
                      <li>• Currency symbols and commas are automatically cleaned</li>
                      <li>• Data is validated before saving to the database</li>
                      <li>• Import summary is provided after successful processing</li>
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

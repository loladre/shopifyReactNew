import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import FormField from "../components/ui/FormField";
import StatusCard from "../components/ui/StatusCard";
import ServerMessagePanel from "../components/ui/ServerMessagePanel";
import {
  Calculator,
  DollarSign,
  Percent,
  TrendingUp,
  Package,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Info,
} from "lucide-react";

interface CalculationResult {
  profitMargin: number;
  totalCost: number;
  profit: number;
  isValid: boolean;
}

export default function MarginCalculator() {
  // Form state
  const [wholesaleCost, setWholesaleCost] = useState<string>("");
  const [retailCost, setRetailCost] = useState<string>("");
  const [dutiesType, setDutiesType] = useState<"percentage" | "dollar">("percentage");
  const [dutiesValue, setDutiesValue] = useState<string>("");

  // Calculation state
  const [result, setResult] = useState<CalculationResult>({
    profitMargin: 0,
    totalCost: 0,
    profit: 0,
    isValid: false,
  });

  // UI state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Real-time calculation
  useEffect(() => {
    calculateMargin();
  }, [wholesaleCost, retailCost, dutiesType, dutiesValue]);

  const validateInputs = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    const wholesale = parseFloat(wholesaleCost);
    const retail = parseFloat(retailCost);
    const duties = parseFloat(dutiesValue);

    if (!wholesaleCost || isNaN(wholesale) || wholesale <= 0) {
      newErrors.wholesaleCost = "Please enter a valid wholesale cost";
    }

    if (!retailCost || isNaN(retail) || retail <= 0) {
      newErrors.retailCost = "Please enter a valid retail cost";
    }

    if (!dutiesValue || isNaN(duties) || duties < 0) {
      newErrors.dutiesValue = "Please enter a valid duties value";
    }

    if (dutiesType === "percentage" && duties > 100) {
      newErrors.dutiesValue = "Percentage cannot exceed 100%";
    }

    if (wholesale > 0 && retail > 0 && wholesale >= retail) {
      newErrors.retailCost = "Retail cost should be higher than wholesale cost";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateMargin = () => {
    if (!validateInputs()) {
      setResult({
        profitMargin: 0,
        totalCost: 0,
        profit: 0,
        isValid: false,
      });
      return;
    }

    const wholesale = parseFloat(wholesaleCost);
    const retail = parseFloat(retailCost);
    const duties = parseFloat(dutiesValue);

    let totalCost: number;

    if (dutiesType === "percentage") {
      // Profit margin % = (Retail cost - (WholeSale Cost * (1+ duties%/100))) / Retail Cost
      totalCost = wholesale * (1 + duties / 100);
    } else {
      // Profit margin % = (Retail cost - (WholeSale Cost + duties $)) / Retail Cost
      totalCost = wholesale + duties;
    }

    const profit = retail - totalCost;
    const profitMargin = (profit / retail) * 100;

    setResult({
      profitMargin,
      totalCost,
      profit,
      isValid: true,
    });
  };

  const handleClear = () => {
    setWholesaleCost("");
    setRetailCost("");
    setDutiesValue("");
    setErrors({});
    setResult({
      profitMargin: 0,
      totalCost: 0,
      profit: 0,
      isValid: false,
    });
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

  const getMarginColor = (margin: number): string => {
    if (margin >= 50) return "text-green-600";
    if (margin >= 30) return "text-yellow-600";
    return "text-red-600";
  };

  const getMarginStatus = (margin: number): string => {
    if (margin >= 50) return "Excellent";
    if (margin >= 30) return "Good";
    if (margin >= 15) return "Fair";
    return "Poor";
  };

  return (
    <Layout title="Margin Calculator">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Margin Calculator</h1>
            <p className="text-slate-600 mt-1">
              Calculate profit margins with wholesale costs, retail prices, and duties
            </p>
          </div>
          <Button onClick={handleClear} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-5 space-y-6">
            {/* Calculator Form */}
            <Card>
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <Calculator className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Profit Margin Calculator</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Wholesale Cost */}
                  <FormField label="Total Wholesale Cost" required error={errors.wholesaleCost}>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="number"
                        step="0.01"
                        value={wholesaleCost}
                        onChange={(e) => setWholesaleCost(e.target.value)}
                        placeholder="0.00"
                        className="pl-10"
                        error={!!errors.wholesaleCost}
                      />
                    </div>
                  </FormField>

                  {/* Retail Cost */}
                  <FormField label="Total Retail Cost" required error={errors.retailCost}>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="number"
                        step="0.01"
                        value={retailCost}
                        onChange={(e) => setRetailCost(e.target.value)}
                        placeholder="0.00"
                        className="pl-10"
                        error={!!errors.retailCost}
                      />
                    </div>
                  </FormField>
                </div>

                {/* Duties Section */}
                <div className="space-y-4">
                  <FormField label="Duties Type">
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="percentage"
                          checked={dutiesType === "percentage"}
                          onChange={(e) => setDutiesType(e.target.value as "percentage")}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Percentage (%)</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="dollar"
                          checked={dutiesType === "dollar"}
                          onChange={(e) => setDutiesType(e.target.value as "dollar")}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Dollar Amount ($)</span>
                      </label>
                    </div>
                  </FormField>

                  <FormField
                    label={dutiesType === "percentage" ? "Duties Percentage" : "Duties Cost Value"}
                    required
                    error={errors.dutiesValue}
                  >
                    <div className="relative">
                      {dutiesType === "percentage" ? (
                        <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      ) : (
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      )}
                      <Input
                        type="number"
                        step={dutiesType === "percentage" ? "0.1" : "0.01"}
                        value={dutiesValue}
                        onChange={(e) => setDutiesValue(e.target.value)}
                        placeholder={dutiesType === "percentage" ? "0.0" : "0.00"}
                        className="pl-10"
                        error={!!errors.dutiesValue}
                      />
                    </div>
                  </FormField>
                </div>
              </div>
            </Card>

            {/* Results */}
            {result.isValid && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatusCard
                    title="Profit Margin"
                    value={formatPercentage(result.profitMargin)}
                    icon={TrendingUp}
                    color={result.profitMargin >= 50 ? "green" : result.profitMargin >= 30 ? "orange" : "red"}
                  />
                  <StatusCard
                    title="Total Cost"
                    value={formatCurrency(result.totalCost)}
                    icon={Package}
                    color="blue"
                  />
                  <StatusCard
                    title="Profit Amount"
                    value={formatCurrency(result.profit)}
                    icon={DollarSign}
                    color="purple"
                  />
                  <StatusCard
                    title="Margin Status"
                    value={getMarginStatus(result.profitMargin)}
                    icon={result.profitMargin >= 30 ? CheckCircle : AlertTriangle}
                    color={result.profitMargin >= 50 ? "green" : result.profitMargin >= 30 ? "orange" : "red"}
                  />
                </div>

                {/* Detailed Results */}
                <Card>
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900">Calculation Results</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-900">Cost Breakdown</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600">Wholesale Cost:</span>
                            <span className="font-semibold text-slate-900">
                              {formatCurrency(parseFloat(wholesaleCost) || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600">
                              Duties ({dutiesType === "percentage" ? "%" : "$"}):
                            </span>
                            <span className="font-semibold text-slate-900">
                              {dutiesType === "percentage"
                                ? `${dutiesValue}% = ${formatCurrency(
                                    (parseFloat(wholesaleCost) || 0) * (parseFloat(dutiesValue) || 0) / 100
                                  )}`
                                : formatCurrency(parseFloat(dutiesValue) || 0)}
                            </span>
                          </div>
                          <hr className="border-slate-200" />
                          <div className="flex justify-between items-center text-lg">
                            <span className="font-semibold text-slate-900">Total Cost:</span>
                            <span className="font-bold text-slate-900">
                              {formatCurrency(result.totalCost)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-900">Profit Analysis</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600">Retail Price:</span>
                            <span className="font-semibold text-slate-900">
                              {formatCurrency(parseFloat(retailCost) || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600">Total Cost:</span>
                            <span className="font-semibold text-slate-900">
                              {formatCurrency(result.totalCost)}
                            </span>
                          </div>
                          <hr className="border-slate-200" />
                          <div className="flex justify-between items-center text-lg">
                            <span className="font-semibold text-slate-900">Profit:</span>
                            <span className={`font-bold ${getMarginColor(result.profitMargin)}`}>
                              {formatCurrency(result.profit)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-lg">
                            <span className="font-semibold text-slate-900">Margin:</span>
                            <span className={`font-bold ${getMarginColor(result.profitMargin)}`}>
                              {formatPercentage(result.profitMargin)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Margin Status Indicator */}
                    <div className="p-4 rounded-lg border-l-4 border-l-purple-500 bg-purple-50">
                      <div className="flex items-center space-x-2">
                        <Info className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-purple-900">
                          Margin Status: {getMarginStatus(result.profitMargin)}
                        </span>
                      </div>
                      <p className="text-sm text-purple-700 mt-1">
                        {result.profitMargin >= 50 && "Excellent profit margin! This is a highly profitable item."}
                        {result.profitMargin >= 30 && result.profitMargin < 50 && "Good profit margin. This item should be profitable."}
                        {result.profitMargin >= 15 && result.profitMargin < 30 && "Fair profit margin. Consider reviewing costs or pricing."}
                        {result.profitMargin < 15 && "Low profit margin. Review pricing strategy or cost structure."}
                      </p>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* Formula Reference */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Calculation Formulas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900">When Duties is a Percentage:</h4>
                    <div className="p-4 bg-slate-50 rounded-lg font-mono text-sm">
                      <p>Profit Margin % = </p>
                      <p>(Retail Cost - (Wholesale Cost × (1 + Duties%/100))) / Retail Cost</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900">When Duties is a Dollar Amount:</h4>
                    <div className="p-4 bg-slate-50 rounded-lg font-mono text-sm">
                      <p>Profit Margin % = </p>
                      <p>(Retail Cost - (Wholesale Cost + Duties $)) / Retail Cost</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Empty State */}
            {!result.isValid && Object.keys(errors).length === 0 && (
              <Card className="text-center py-12">
                <Calculator className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Ready to Calculate</h3>
                <p className="text-slate-600 mb-6">
                  Enter your wholesale cost, retail cost, and duties to calculate profit margins.
                </p>
                <div className="text-sm text-slate-500">
                  Features:
                  <ul className="mt-2 space-y-1">
                    <li>• Real-time calculation as you type</li>
                    <li>• Support for percentage or dollar amount duties</li>
                    <li>• Detailed cost breakdown and profit analysis</li>
                    <li>• Margin status indicators and recommendations</li>
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
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import FormField from "../components/ui/FormField";
import ServerMessagePanel from "../components/ui/ServerMessagePanel";
import {
  Trash2,
  AlertTriangle,
  Shield,
  CheckCircle,
  X,
  FileText,
  Lock,
  ArrowRight,
} from "lucide-react";

export default function DeletePurchaseOrder() {
  const navigate = useNavigate();

  // Form state
  const [purchaseOrderID, setPurchaseOrderID] = useState<string>("");
  const [confirmOrderID, setConfirmOrderID] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // UI state
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!purchaseOrderID.trim()) {
        setError("Please enter a purchase order ID");
        return;
      }
      setError("");
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (confirmOrderID !== purchaseOrderID) {
        setError("Purchase order IDs do not match. Please try again.");
        return;
      }
      setError("");
      setCurrentStep(3);
    }
  };

  const handlePreviousStep = () => {
    setError("");
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError("");

      const token = localStorage.getItem("bridesbyldToken");

      if (!token) {
        navigate("/");
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;

      const response = await fetch(`${apiBaseUrl}${basePath}/api/purchase-orders/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ purchaseOrderID: purchaseOrderID.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete purchase order");
      }

      const result = await response.json();
      setSuccess(`Purchase order ${purchaseOrderID} has been successfully deleted.`);

      // Reset form after successful deletion
      setTimeout(() => {
        setPurchaseOrderID("");
        setConfirmOrderID("");
        setCurrentStep(1);
        setSuccess("");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete purchase order");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReset = () => {
    setPurchaseOrderID("");
    setConfirmOrderID("");
    setCurrentStep(1);
    setError("");
    setSuccess("");
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 1:
        return purchaseOrderID.trim() !== "";
      case 2:
        return confirmOrderID === purchaseOrderID;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <Layout title="Delete Purchase Order">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Delete Purchase Order</h1>
            <p className="text-slate-600 mt-1">
              Permanently remove a purchase order from the system
            </p>
          </div>
          <Button onClick={() => navigate("/published-orders")} variant="outline">
            Back to Orders
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-5 space-y-6">
            {/* Important Warning */}
            <Card className="border-red-200 bg-red-50">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-900">Important Notice</h3>
                    <p className="text-red-700">
                      Purchase orders can only be deleted if they have no received products or
                      inventory.
                    </p>
                  </div>
                </div>
                <div className="bg-red-100 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-900 mb-2">Deletion Requirements:</h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• No products have been received for this order</li>
                    <li>• No inventory is associated with this order</li>
                    <li>• Order must be in draft or early stage</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Progress Steps */}
            <Card>
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Deletion Process</h3>

                {/* Step Indicator */}
                <div className="flex items-center justify-between">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                          currentStep === step
                            ? "bg-red-600 text-white"
                            : isStepComplete(step)
                            ? "bg-green-600 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isStepComplete(step) && currentStep > step ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          step
                        )}
                      </div>
                      {step < 3 && (
                        <div
                          className={`w-16 h-1 mx-2 ${
                            currentStep > step ? "bg-green-600" : "bg-slate-200"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Step Labels */}
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Enter Order ID</span>
                  <span>Confirm Order ID</span>
                  <span>Final Confirmation</span>
                </div>
              </div>
            </Card>

            {/* Step Content */}
            <Card>
              <div className="space-y-6">
                {/* Step 1: Enter Purchase Order ID */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-6 h-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-slate-900">
                        Step 1: Enter Purchase Order ID
                      </h3>
                    </div>
                    <FormField label="Purchase Order ID" required>
                      <Input
                        type="text"
                        value={purchaseOrderID}
                        onChange={(e) => setPurchaseOrderID(e.target.value)}
                        placeholder="Enter the purchase order ID (e.g., PO-123456)"
                        className="text-lg"
                      />
                    </FormField>
                    <div className="text-sm text-slate-600">
                      <p>
                        Enter the exact purchase order ID that you want to delete. Make sure this is
                        the correct order as this action cannot be undone.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2: Confirm Purchase Order ID */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-6 h-6 text-yellow-600" />
                      <h3 className="text-lg font-semibold text-slate-900">
                        Step 2: Confirm Purchase Order ID
                      </h3>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-slate-600 mb-2">You entered:</p>
                      <p className="text-lg font-semibold text-slate-900">{purchaseOrderID}</p>
                    </div>
                    <FormField label="Re-enter Purchase Order ID to confirm" required>
                      <Input
                        type="text"
                        value={confirmOrderID}
                        onChange={(e) => setConfirmOrderID(e.target.value)}
                        placeholder="Type the purchase order ID again"
                        className="text-lg"
                      />
                    </FormField>
                    <div className="text-sm text-slate-600">
                      <p>
                        Please re-enter the purchase order ID to confirm you want to delete the
                        correct order.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3: Final Confirmation */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                      <h3 className="text-lg font-semibold text-slate-900">
                        Step 3: Final Confirmation
                      </h3>
                    </div>
                    <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Lock className="w-8 h-8 text-red-600" />
                          <div>
                            <h4 className="text-lg font-semibold text-red-900">
                              This action cannot be undone!
                            </h4>
                            <p className="text-red-700">
                              You are about to permanently delete purchase order:{" "}
                              <span className="font-bold">{purchaseOrderID}</span>
                            </p>
                          </div>
                        </div>
                        <div className="bg-red-100 p-4 rounded border border-red-300">
                          <h5 className="font-semibold text-red-900 mb-2">
                            What will happen when you delete this order:
                          </h5>
                          <ul className="text-sm text-red-800 space-y-1">
                            <li>• The purchase order will be permanently removed from the system</li>
                            <li>• All associated data will be deleted</li>
                            <li>• This action cannot be reversed or undone</li>
                            <li>• You will need to recreate the order if needed later</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div className="flex space-x-3">
                    {currentStep > 1 && (
                      <Button onClick={handlePreviousStep} variant="outline">
                        Previous
                      </Button>
                    )}
                    <Button onClick={handleReset} variant="ghost">
                      <X className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>

                  <div className="flex space-x-3">
                    {currentStep < 3 ? (
                      <Button
                        onClick={handleNextStep}
                        disabled={!isStepComplete(currentStep)}
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleDelete}
                        variant="danger"
                        isLoading={isDeleting}
                        disabled={!isStepComplete(currentStep)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {isDeleting ? "Deleting..." : "Delete Purchase Order"}
                      </Button>
                    )}
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

            {/* Safety Information */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Safety Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Before Deleting</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Verify the order has no received inventory</li>
                      <li>• Check that no products have been shipped</li>
                      <li>• Ensure no payments have been processed</li>
                      <li>• Confirm this is the correct order to delete</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Alternative Actions</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Consider canceling instead of deleting</li>
                      <li>• Archive the order for future reference</li>
                      <li>• Contact support if you're unsure</li>
                      <li>• Export order data before deletion</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/published-orders")}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View All Orders
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/draft-orders")}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Draft Orders
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/purchase-order")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Order
                  </Button>
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
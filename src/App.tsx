import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, ShoppingBag } from "lucide-react";

// Import all pages
import PurchaseOrderImport from "./pages/PurchaseOrderImport";
import Dashboard from "./pages/Dashboard";
import DraftOrders from "./pages/DraftOrders";
import DraftOrderDetail from "./pages/DraftOrderDetail";
import PublishedOrders from "./pages/PublishedOrders";
import PublishedOrderDetail from "./pages/PublishedOrderDetail";
import DeletePurchaseOrder from "./pages/DeletePurchaseOrder";
import Reorder from "./pages/Reorder";
import LateOrders from "./pages/LateOrders";
import Vendors from "./pages/Vendors";
import Reminders from "./pages/Reminders";
import Seasons from "./pages/Seasons";
import Counts from "./pages/Counts";
import NewArrivals from "./pages/NewArrivals";
import NewReturn from "./pages/NewReturn";
import ReturnList from "./pages/ReturnList";
import Returns from "./pages/Returns";
import ExcelImport from "./pages/ExcelImport";
import SingleItem from "./pages/SingleItem";
import BulkDiscount from "./pages/BulkDiscount";
import BulkDiscountReverse from "./pages/BulkDiscountReverse";
import SellThroughImport from "./pages/SellThroughImport";
import SellThroughData from "./pages/SellThroughData";
import Pictures from "./pages/Pictures";
import EditPublishedOrder from "./pages/EditPublishedOrder";
import ReceiveInventory from "./pages/ReceiveInventory";
import MarginCalculator from "./pages/MarginCalculator";

interface LoginResponse {
  registered: boolean;
  token?: string;
}

function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(true);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Real-time email validation
    if (name === "email") {
      setIsValidEmail(value === "" || validateEmail(value));
    }

    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      setIsValidEmail(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Construct API URL based on environment
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH;
      const loginUrl = `${apiBaseUrl}${basePath}/login`;

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      const data: LoginResponse = await response.json();

      if (!data.registered) {
        window.location.href = `${basePath}/orders/register.html`;
      } else {
        if (data.token) {
          localStorage.setItem("bridesbyldToken", data.token);
        }
        // Navigate to dashboard instead of purchase order page
        window.location.href = `${basePath}/shopifyreact/dashboard`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Main login card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 transition-all duration-300 hover:shadow-3xl hover:bg-white/15">
          {/* Logo and header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
              <img
                src="/logo.png"
                alt="Lola Dré"
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  // Fallback to icon if logo fails to load
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
              />
              <ShoppingBag className="w-8 h-8 text-purple-600 hidden" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Lola Dré</h1>
            <p className="text-white/70 text-sm font-medium">
              {import.meta.env.VITE_APP_TITLE || "Order Management System"}
            </p>
            {import.meta.env.VITE_ENVIRONMENT && (
              <p className="text-white/50 text-xs mt-1 uppercase tracking-wide">
                {import.meta.env.VITE_ENVIRONMENT}
              </p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
              <p className="text-red-200 text-sm text-center font-medium">{error}</p>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-white/90 text-sm font-semibold mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isValidEmail ? "text-white/50" : "text-red-400"
                    }`}
                  />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-4 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all duration-200 backdrop-blur-sm ${
                    isValidEmail
                      ? "border-white/20 focus:ring-purple-500 focus:border-transparent"
                      : "border-red-500/50 focus:ring-red-500"
                  }`}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-white/90 text-sm font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-white/50" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/50 hover:text-white/80 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-white/60 text-sm">Secure login powered by Shopify</p>
          </div>
        </div>

        {/* Subtle animation dots */}
        <div className="flex justify-center mt-6 space-x-2">
          <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse animation-delay-1000"></div>
          <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse animation-delay-2000"></div>
        </div>
      </div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("bridesbyldToken");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/shopifyreact" element={<Navigate to="/dashboard" replace />} />
        <Route path="/shopifyreact/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shopifyreact/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase-order"
          element={
            <ProtectedRoute>
              <PurchaseOrderImport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shopifyreact/purchase-order"
          element={
            <ProtectedRoute>
              <PurchaseOrderImport />
            </ProtectedRoute>
          }
        />

        {/* Orders Routes */}
        <Route
          path="/draft-orders"
          element={
            <ProtectedRoute>
              <DraftOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/draft-order-detail"
          element={
            <ProtectedRoute>
              <DraftOrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/published-orders"
          element={
            <ProtectedRoute>
              <PublishedOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/published-order-detail"
          element={
            <ProtectedRoute>
              <PublishedOrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delete-purchase-order"
          element={
            <ProtectedRoute>
              <DeletePurchaseOrder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-published-order/"
          element={
            <ProtectedRoute>
              <EditPublishedOrder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receive-inventory"
          element={
            <ProtectedRoute>
              <ReceiveInventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reorder"
          element={
            <ProtectedRoute>
              <Reorder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/late-orders"
          element={
            <ProtectedRoute>
              <LateOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/margin-calculator"
          element={
            <ProtectedRoute>
              <MarginCalculator />
            </ProtectedRoute>
          }
        />

        {/* Accounting Routes */}
        <Route
          path="/vendors"
          element={
            <ProtectedRoute>
              <Vendors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reminders"
          element={
            <ProtectedRoute>
              <Reminders />
            </ProtectedRoute>
          }
        />

        {/* Products Routes */}
        <Route
          path="/seasons"
          element={
            <ProtectedRoute>
              <Seasons />
            </ProtectedRoute>
          }
        />
        <Route
          path="/counts"
          element={
            <ProtectedRoute>
              <Counts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/new-arrivals"
          element={
            <ProtectedRoute>
              <NewArrivals />
            </ProtectedRoute>
          }
        />

        {/* Returns Routes */}
        <Route
          path="/new-return"
          element={
            <ProtectedRoute>
              <NewReturn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/return-list"
          element={
            <ProtectedRoute>
              <ReturnList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/returns"
          element={
            <ProtectedRoute>
              <Returns />
            </ProtectedRoute>
          }
        />

        {/* Price2Spy Routes */}
        <Route
          path="/excel-import"
          element={
            <ProtectedRoute>
              <ExcelImport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/single-item"
          element={
            <ProtectedRoute>
              <SingleItem />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bulk-discount"
          element={
            <ProtectedRoute>
              <BulkDiscount />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bulk-discount-reverse"
          element={
            <ProtectedRoute>
              <BulkDiscountReverse />
            </ProtectedRoute>
          }
        />

        {/* Sell Through Routes */}
        <Route
          path="/sell-through-import"
          element={
            <ProtectedRoute>
              <SellThroughImport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sell-through-data"
          element={
            <ProtectedRoute>
              <SellThroughData />
            </ProtectedRoute>
          }
        />

        {/* Pictures Route */}
        <Route
          path="/pictures"
          element={
            <ProtectedRoute>
              <Pictures />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
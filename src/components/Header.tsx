import React, { useState } from 'react';
import { ShoppingBag, Menu, X, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();

  // Get user info from localStorage (if available)
  const token = localStorage.getItem('bridesbyldToken');
  const isLoggedIn = !!token;

  const handleLogout = () => {
    localStorage.removeItem('bridesbyldToken');
    window.location.href = '/';
  };

  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const closeAllDropdowns = () => {
    setOpenDropdown(null);
  };

  return (
    <header className="bg-white/90 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-200">
              <img 
                src="/logo.png" 
                alt="Lola Dré" 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  // Fallback to icon if logo fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <ShoppingBag className="w-6 h-6 text-purple-600 hidden" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Lola Dré</h1>
              <p className="text-xs text-slate-500 -mt-1">Order Management</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link 
              to="/dashboard" 
              className="px-3 py-2 text-slate-700 hover:text-purple-600 font-medium transition-colors duration-200 rounded-lg hover:bg-slate-50"
            >
              Dashboard
            </Link>

            {/* Orders Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('orders')}
                className="flex items-center px-3 py-2 text-slate-700 hover:text-purple-600 font-medium transition-colors duration-200 rounded-lg hover:bg-slate-50"
              >
                Orders
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {openDropdown === 'orders' && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                  <Link to="/purchase-order" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    New Purchase Order
                  </Link>
                  <Link to="/draft-orders" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    Draft Orders
                  </Link>
                  <Link to="/published-orders" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    Published Orders
                  </Link>
                  <Link to="/delete-purchase-order" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    Delete Purchase Order
                  </Link>
                  <Link to="/reorder" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    Re Order
                  </Link>
                  <Link to="/late-orders" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    Late Orders
                  </Link>
                </div>
              )}
            </div>

            {/* Accounting Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('accounting')}
                className="flex items-center px-3 py-2 text-slate-700 hover:text-purple-600 font-medium transition-colors duration-200 rounded-lg hover:bg-slate-50"
              >
                Accounting
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {openDropdown === 'accounting' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                  <Link to="/vendors" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    Vendors
                  </Link>
                  <Link to="/reminders" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    Reminders
                  </Link>
                </div>
              )}
            </div>

            {/* Products Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('products')}
                className="flex items-center px-3 py-2 text-slate-700 hover:text-purple-600 font-medium transition-colors duration-200 rounded-lg hover:bg-slate-50"
              >
                Products
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {openDropdown === 'products' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                  <Link to="/seasons" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    Seasons
                  </Link>
                  <Link to="/counts" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    Counts
                  </Link>
                  <Link to="/new-arrivals" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    New Arrivals
                  </Link>
                </div>
              )}
            </div>

            {/* Returns Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('returns')}
                className="flex items-center px-3 py-2 text-slate-700 hover:text-purple-600 font-medium transition-colors duration-200 rounded-lg hover:bg-slate-50"
              >
                Returns
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {openDropdown === 'returns' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                  <Link to="/new-return" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    New Return
                  </Link>
                  <Link to="/return-list" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    Return List
                  </Link>
                  <Link to="/returns" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    Returns Analysis
                  </Link>
                </div>
              )}
            </div>

            {/* Price2Spy Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('price2spy')}
                className="flex items-center px-3 py-2 text-slate-700 hover:text-purple-600 font-medium transition-colors duration-200 rounded-lg hover:bg-slate-50"
              >
                Price2Spy
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {openDropdown === 'price2spy' && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                  <Link to="/excel-import" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    Excel Import
                  </Link>
                  <Link to="/single-item" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    Single Item
                  </Link>
                  <Link to="/bulk-discount" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    Bulk Discount
                  </Link>
                  <Link to="/bulk-discount-reverse" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    Bulk Discount Reverse
                  </Link>
                </div>
              )}
            </div>

            {/* Sell Through Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('sellthrough')}
                className="flex items-center px-3 py-2 text-slate-700 hover:text-purple-600 font-medium transition-colors duration-200 rounded-lg hover:bg-slate-50"
              >
                Sell Through
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {openDropdown === 'sellthrough' && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                  <Link to="/sell-through-import" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    Sell Through Import
                  </Link>
                  <Link to="/sell-through-data" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors duration-200" onClick={closeAllDropdowns}>
                    Sell Through Data
                  </Link>
                </div>
              )}
            </div>

            <Link 
              to="/pictures" 
              className="px-3 py-2 text-slate-700 hover:text-purple-600 font-medium transition-colors duration-200 rounded-lg hover:bg-slate-50"
            >
              Pictures
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-slate-700">Account</span>
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                    <a
                      href="/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-200"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </a>
                    <hr className="my-1 border-slate-200" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors duration-200"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-slate-700" />
              ) : (
                <Menu className="w-5 h-5 text-slate-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200">
            <nav className="flex flex-col space-y-2">
              <Link to="/dashboard" className="text-slate-700 hover:text-purple-600 font-medium py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors duration-200">
                Dashboard
              </Link>
              
              {/* Mobile dropdowns would be implemented here with accordion-style behavior */}
              <div className="space-y-1">
                <div className="text-slate-600 font-medium py-2 px-3 text-sm uppercase tracking-wide">Orders</div>
                <Link to="/purchase-order" className="text-slate-700 hover:text-purple-600 py-2 px-6 block hover:bg-slate-50 rounded-lg transition-colors duration-200">
                  New Purchase Order
                </Link>
                <Link to="/draft-orders" className="text-slate-700 hover:text-purple-600 py-2 px-6 block hover:bg-slate-50 rounded-lg transition-colors duration-200">
                  Draft Orders
                </Link>
                <Link to="/published-orders" className="text-slate-700 hover:text-purple-600 py-2 px-6 block hover:bg-slate-50 rounded-lg transition-colors duration-200">
                  Published Orders
                </Link>
                <Link to="/delete-purchase-order" className="text-slate-700 hover:text-purple-600 py-2 px-6 block hover:bg-slate-50 rounded-lg transition-colors duration-200">
                  Delete Purchase Order
                </Link>
                <Link to="/reorder" className="text-slate-700 hover:text-purple-600 py-2 px-6 block hover:bg-slate-50 rounded-lg transition-colors duration-200">
                  Re Order
                </Link>
                <Link to="/late-orders" className="text-slate-700 hover:text-purple-600 py-2 px-6 block hover:bg-slate-50 rounded-lg transition-colors duration-200">
                  Late Orders
                </Link>
              </div>

              <div className="space-y-1">
                <div className="text-slate-600 font-medium py-2 px-3 text-sm uppercase tracking-wide">Returns</div>
                <Link to="/new-return" className="text-slate-700 hover:text-purple-600 py-2 px-6 block hover:bg-slate-50 rounded-lg transition-colors duration-200">
                  New Return
                </Link>
                <Link to="/return-list" className="text-slate-700 hover:text-purple-600 py-2 px-6 block hover:bg-slate-50 rounded-lg transition-colors duration-200">
                  Return List
                </Link>
                <Link to="/returns" className="text-slate-700 hover:text-purple-600 py-2 px-6 block hover:bg-slate-50 rounded-lg transition-colors duration-200">
                  Returns Analysis
                </Link>
              </div>

              <Link to="/pictures" className="text-slate-700 hover:text-purple-600 font-medium py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors duration-200">
                Pictures
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* Backdrop for closing dropdowns */}
      {openDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={closeAllDropdowns}
        />
      )}
    </header>
  );
}
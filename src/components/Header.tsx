import React, { useState } from 'react';
import { ShoppingBag, Menu, X, User, LogOut, Settings } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Get user info from localStorage (if available)
  const token = localStorage.getItem('bridesbyldToken');
  const isLoggedIn = !!token;

  const handleLogout = () => {
    localStorage.removeItem('bridesbyldToken');
    window.location.href = '/';
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Lola Dré</h1>
              <p className="text-xs text-slate-500 -mt-1">Order Management</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/orders" className="text-slate-700 hover:text-purple-600 font-medium transition-colors duration-200">
              Orders
            </a>
            <a href="/products" className="text-slate-700 hover:text-purple-600 font-medium transition-colors duration-200">
              Products
            </a>
            <a href="/customers" className="text-slate-700 hover:text-purple-600 font-medium transition-colors duration-200">
              Customers
            </a>
            <a href="/reports" className="text-slate-700 hover:text-purple-600 font-medium transition-colors duration-200">
              Reports
            </a>
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
              <a
                href="/"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Sign In
              </a>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors duration-200"
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
          <div className="md:hidden py-4 border-t border-slate-200">
            <nav className="flex flex-col space-y-3">
              <a href="/orders" className="text-slate-700 hover:text-purple-600 font-medium py-2 transition-colors duration-200">
                Orders
              </a>
              <a href="/products" className="text-slate-700 hover:text-purple-600 font-medium py-2 transition-colors duration-200">
                Products
              </a>
              <a href="/customers" className="text-slate-700 hover:text-purple-600 font-medium py-2 transition-colors duration-200">
                Customers
              </a>
              <a href="/reports" className="text-slate-700 hover:text-purple-600 font-medium py-2 transition-colors duration-200">
                Reports
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
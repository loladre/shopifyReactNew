import React from 'react';
import { Heart, Shield, Clock } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white/80 backdrop-blur-lg border-t border-slate-200/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg border border-slate-200 shadow-sm">
                <img 
                  src="/logo.png" 
                  alt="Lola Dré" 
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    // Fallback to icon if logo fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <Heart className="w-4 h-4 text-purple-600 hidden" />
              </div>
              <span className="text-lg font-bold text-slate-900">Lola Dré</span>
            </div>
            <p className="text-sm text-slate-600 max-w-sm">
              Professional order management system designed for modern businesses. 
              Streamline your workflow with our intuitive platform.
            </p>
          </div>

          {/* Features Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Features</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-slate-600">Secure & Encrypted</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-slate-600">Real-time Updates</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-slate-600">Customer Focused</span>
              </div>
            </div>
          </div>

          {/* Support Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Support</h3>
            <div className="space-y-2">
              <a href="/help" className="block text-sm text-slate-600 hover:text-purple-600 transition-colors duration-200">
                Help Center
              </a>
              <a href="/contact" className="block text-sm text-slate-600 hover:text-purple-600 transition-colors duration-200">
                Contact Us
              </a>
              <a href="/privacy" className="block text-sm text-slate-600 hover:text-purple-600 transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="/terms" className="block text-sm text-slate-600 hover:text-purple-600 transition-colors duration-200">
                Terms of Service
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <p className="text-sm text-slate-500">
              © {currentYear} Lola Dré Order System. All rights reserved.
            </p>
            <div className="flex items-center space-x-1 text-sm text-slate-500">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>for your business</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
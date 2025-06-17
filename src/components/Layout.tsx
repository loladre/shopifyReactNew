import React from "react";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}

export default function Layout({
  children,
  title,
  showHeader = true,
  showFooter = true,
  className = "",
}: LayoutProps) {
  // Update document title if provided
  React.useEffect(() => {
    if (title) {
      document.title = `${title} - Lola Dré Order System`;
    }
  }, [title]);

  return (
    <div
      className={`min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 ${className}`}
    >
      {showHeader && <Header />}

      <main className="flex-1 relative w-full">{children}</main>

      {showFooter && <Footer />}
    </div>
  );
}

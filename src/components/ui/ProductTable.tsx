import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface ProductTableColumn {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: any, product?: any) => React.ReactNode;
  className?: string;
  width?: string;
}

export interface ProductVariant {
  variantColor: string;
  variantSize: string;
  variantQuantity: number;
  variantCost: number;
  variantRetail: number;
  variantSku: string;
  variantBarcode: string;
  variantPreOrder: string;
  variantMetafieldShoeSize?: string;
  variantMetafieldClothingSize?: string;
  variantMetafieldJeansSize?: string;
  variantMetafieldCategory?: string;
}

export interface Product {
  productName: string;
  productType: string;
  productTags: string;
  productVariants: ProductVariant[];
}

interface ProductTableProps {
  columns: ProductTableColumn[];
  products: Product[];
  className?: string;
  emptyMessage?: string;
  showAlternatingRows?: boolean;
}

export default function ProductTable({ 
  columns, 
  products, 
  className = '',
  emptyMessage = 'No products available',
  showAlternatingRows = true
}: ProductTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Flatten products and variants for table display
  const tableData = useMemo(() => {
    const flattened: Array<{ product: Product; variant: ProductVariant; productIndex: number; variantIndex: number }> = [];
    
    products.forEach((product, productIndex) => {
      product.productVariants.forEach((variant, variantIndex) => {
        flattened.push({ product, variant, productIndex, variantIndex });
      });
    });
    
    return flattened;
  }, [products]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return tableData;

    return [...tableData].sort((a, b) => {
      let aValue, bValue;
      
      // Handle nested values (product.field or variant.field)
      if (sortConfig.key.startsWith('product.')) {
        const field = sortConfig.key.replace('product.', '');
        aValue = a.product[field as keyof Product];
        bValue = b.product[field as keyof Product];
      } else {
        aValue = a.variant[sortConfig.key as keyof ProductVariant];
        bValue = b.variant[sortConfig.key as keyof ProductVariant];
      }

      // Handle numeric sorting
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string sorting
      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();
      
      if (aStr < bStr) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aStr > bStr) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [tableData, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return null;
    }
    
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  };

  // Determine row styling for alternating product groups
  const getRowClassName = (item: typeof sortedData[0], index: number) => {
    let baseClasses = 'hover:bg-slate-50 transition-colors duration-200';
    
    if (showAlternatingRows) {
      // Group by product name for alternating colors
      const productNames = sortedData.map(d => d.product.productName);
      const uniqueNames = Array.from(new Set(productNames));
      const productIndex = uniqueNames.indexOf(item.product.productName);
      
      if (productIndex % 2 === 1) {
        baseClasses += ' bg-slate-100';
      }
    }
    
    return baseClasses;
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide ${
                    column.sortable ? 'cursor-pointer hover:bg-slate-100 select-none' : ''
                  } ${column.className || ''}`}
                  style={{ width: column.width }}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-6 py-12 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => (
                <tr
                  key={`${item.productIndex}-${item.variantIndex}`}
                  className={getRowClassName(item, index)}
                >
                  {columns.map((column) => {
                    let value;
                    if (column.key.startsWith('product.')) {
                      const field = column.key.replace('product.', '');
                      value = item.product[field as keyof Product];
                    } else {
                      value = item.variant[column.key as keyof ProductVariant];
                    }

                    return (
                      <td
                        key={column.key}
                        className={`px-4 py-3 text-sm text-slate-900 ${column.className || ''}`}
                      >
                        {column.render 
                          ? column.render(value, item.variant, item.product)
                          : value
                        }
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
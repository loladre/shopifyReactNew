import React, { useState, useRef } from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Upload, FileSpreadsheet, Download, Check, X, AlertCircle, Package, Settings, Wand2 } from 'lucide-react';
import * as XLSX from 'exceljs';
import { 
  selectMapping, 
  sizeMappings, 
  sizeMappingFilters, 
  shoeSizeFilter,
  sizingOptions,
  seasonOptions,
  yearOptions,
  getSizeMapping,
  getSizeMappingFilter,
  getMetaCategory,
  convertShoeSize,
  getProductType,
  isDenimShorts
} from '../utils/sizeConversions';

interface ProductItem {
  id: string;
  title: string;
  vendor: string;
  category: string;
  season: string;
  year: string;
  sizing: string;
  size: string;
  cost: number;
  price: number;
  comparePrice: number;
  sku: string;
  barcode: string;
  weight: number;
  inventoryQty: number;
  metaCategory?: string;
  standardSize?: string;
}

export default function PurchaseOrderImport() {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category assignment states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedItemForCategory, setSelectedItemForCategory] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Standard sizing states
  const [showSizingModal, setShowSizingModal] = useState(false);
  const [sizingCountry, setSizingCountry] = useState('us');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const workbook = new XLSX.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('No worksheet found in the Excel file');
      }

      const data: ProductItem[] = [];
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        
        const values = row.values as any[];
        if (!values || values.length < 2) return;

        const item: ProductItem = {
          id: `item-${rowNumber}`,
          title: values[1] || '',
          vendor: values[2] || '',
          category: values[3] || '',
          season: values[4] || '',
          year: values[5] || '',
          sizing: values[6] || '',
          size: values[7] || '',
          cost: parseFloat(values[8]) || 0,
          price: parseFloat(values[9]) || 0,
          comparePrice: parseFloat(values[10]) || 0,
          sku: values[11] || '',
          barcode: values[12] || '',
          weight: parseFloat(values[13]) || 0,
          inventoryQty: parseInt(values[14]) || 0,
        };

        data.push(item);
      });

      setItems(data);
      setSuccess(`Successfully imported ${data.length} items from Excel file`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import Excel file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const openCategoryModal = (itemId: string) => {
    setSelectedItemForCategory(itemId);
    setShowCategoryModal(true);
  };

  const applyCategoryAssignment = () => {
    if (!selectedCategory || !selectedItemForCategory) return;

    const targetItem = items.find(item => item.id === selectedItemForCategory);
    if (!targetItem) return;

    // Use the complete product title for matching
    const targetTitle = targetItem.title;
    const metaCategory = getMetaCategory(selectedCategory);

    setItems(prevItems => 
      prevItems.map(item => {
        // Apply category to all items with the exact same title
        if (item.title === targetTitle) {
          return {
            ...item,
            category: selectedCategory,
            metaCategory: metaCategory
          };
        }
        return item;
      })
    );

    // Count how many items were updated
    const matchingItems = items.filter(item => item.title === targetTitle);
    
    setSuccess(`Category "${selectedCategory}" applied to ${matchingItems.length} item(s) with title "${targetTitle}"`);
    setShowCategoryModal(false);
    setSelectedCategory('');
    setSelectedItemForCategory('');
  };

  const applyStandardSizing = () => {
    const sizeMapping = getSizeMappingFilter(sizingCountry);
    let processedCount = 0;
    let skippedCount = 0;

    setItems(prevItems => 
      prevItems.map(item => {
        // Process ALL items in the table, regardless of checkbox selection
        if (!item.category) {
          skippedCount++;
          return item;
        }

        const productType = getProductType(item.category);
        let standardSize = item.size;

        if (productType === 'shoes') {
          standardSize = convertShoeSize(item.size);
        } else if (productType === 'jeans' && !isDenimShorts(item.category)) {
          // Keep original size for jeans (not shorts)
          standardSize = item.size;
        } else {
          // Apply size mapping for clothing items
          standardSize = sizeMapping[item.size] || item.size;
        }

        processedCount++;
        return {
          ...item,
          standardSize: standardSize
        };
      })
    );

    let message = `Standard sizing applied to entire order: ${processedCount} items processed`;
    if (skippedCount > 0) {
      message += `, ${skippedCount} items skipped (no category assigned)`;
    }
    
    setSuccess(message);
    setShowSizingModal(false);
  };

  const exportToExcel = async () => {
    if (items.length === 0) {
      setError('No data to export');
      return;
    }

    try {
      const workbook = new XLSX.Workbook();
      const worksheet = workbook.addWorksheet('Purchase Order');

      // Add headers
      const headers = [
        'Title', 'Vendor', 'Category', 'Season', 'Year', 'Sizing', 'Size', 
        'Cost', 'Price', 'Compare Price', 'SKU', 'Barcode', 'Weight', 
        'Inventory Qty', 'Meta Category', 'Standard Size'
      ];
      
      worksheet.addRow(headers);

      // Add data rows
      items.forEach(item => {
        worksheet.addRow([
          item.title,
          item.vendor,
          item.category,
          item.season,
          item.year,
          item.sizing,
          item.size,
          item.cost,
          item.price,
          item.comparePrice,
          item.sku,
          item.barcode,
          item.weight,
          item.inventoryQty,
          item.metaCategory || '',
          item.standardSize || ''
        ]);
      });

      // Style the header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' }
      };

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });

      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `purchase-order-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess('Excel file exported successfully');
    } catch (err) {
      setError('Failed to export Excel file');
    }
  };

  return (
    <Layout title="Purchase Order Import">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Purchase Order Import</h1>
            <p className="text-slate-600 mt-1">Import and manage purchase orders from Excel files</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <Upload className="w-4 h-4" />
              Import Excel
            </Button>
            
            {items.length > 0 && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setShowSizingModal(true)}
                  className="flex items-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  Apply Standard Sizing
                </Button>
                
                <Button
                  variant="outline"
                  onClick={exportToExcel}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Excel
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </Card>
        )}

        {success && (
          <Card className="border-green-200 bg-green-50">
            <div className="flex items-center gap-3 text-green-800">
              <Check className="w-5 h-5 flex-shrink-0" />
              <p>{success}</p>
            </div>
          </Card>
        )}

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Data Table */}
        {items.length > 0 ? (
          <Card padding="none">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Purchase Order Items ({items.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-sm"
                >
                  {selectedItems.size === items.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedItems.size === items.length && items.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Standard Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cost</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-slate-900 max-w-xs truncate" title={item.title}>
                          {item.title}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{item.vendor}</td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-slate-900">
                          {item.category || (
                            <span className="text-slate-400 italic">Not assigned</span>
                          )}
                        </div>
                        {item.metaCategory && (
                          <div className="text-xs text-purple-600 mt-1">
                            Meta: {item.metaCategory}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{item.size}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {item.standardSize ? (
                          <span className="text-green-600 font-medium">{item.standardSize}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">${item.cost.toFixed(2)}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">${item.price.toFixed(2)}</td>
                      <td className="px-4 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openCategoryModal(item.id)}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="text-center py-12">
            <FileSpreadsheet className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Data Imported</h3>
            <p className="text-slate-600 mb-6">Upload an Excel file to get started with your purchase order.</p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 mx-auto"
              disabled={isLoading}
            >
              <Upload className="w-4 h-4" />
              {isLoading ? 'Importing...' : 'Import Excel File'}
            </Button>
          </Card>
        )}

        {/* Category Assignment Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Assign Category</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Select Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Choose a category...</option>
                      {Object.keys(selectMapping).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCategory && (
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-800">
                        <strong>Meta Category:</strong> {getMetaCategory(selectedCategory)}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        This category will be applied to all items with the same product title.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={applyCategoryAssignment}
                    disabled={!selectedCategory}
                    className="flex-1"
                  >
                    Apply Category
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCategoryModal(false);
                      setSelectedCategory('');
                      setSelectedItemForCategory('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Standard Sizing Modal */}
        {showSizingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Apply Standard Sizing</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Sizing Standard
                    </label>
                    <select
                      value={sizingCountry}
                      onChange={(e) => setSizingCountry(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {sizingOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Standard sizing will be applied to the entire order, 
                      regardless of which items are selected. Items without assigned categories will be skipped.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={applyStandardSizing}
                    className="flex-1"
                  >
                    Apply to Entire Order
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSizingModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
import React, { useState, useRef } from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Upload, FileSpreadsheet, Download, Check, X, AlertCircle, Package, Settings } from 'lucide-react';
import * as XLSX from 'exceljs';
import { 
  getSizeMapping, 
  getSizeMappingFilter, 
  getMetaCategory, 
  convertShoeSize, 
  getProductType, 
  isDenimShorts,
  sizingOptions,
  seasonOptions,
  yearOptions 
} from '../utils/sizeConversions';

interface ProductData {
  id: string;
  title: string;
  handle: string;
  body: string;
  vendor: string;
  type: string;
  tags: string;
  published: boolean;
  option1Name: string;
  option1Value: string;
  option2Name: string;
  option2Value: string;
  option3Name: string;
  option3Value: string;
  variantSku: string;
  variantGrams: number;
  variantInventoryTracker: string;
  variantInventoryQty: number;
  variantInventoryPolicy: string;
  variantFulfillmentService: string;
  variantPrice: number;
  variantCompareAtPrice: number;
  variantRequiresShipping: boolean;
  variantTaxable: boolean;
  variantBarcode: string;
  imagePosition: number;
  imageAltText: string;
  giftCard: boolean;
  seoTitle: string;
  seoDescription: string;
  googleShoppingCategory: string;
  googleShoppingGender: string;
  googleShoppingAgeGroup: string;
  googleShoppingMpn: string;
  googleShoppingCondition: string;
  googleShoppingCustomProduct: string;
  googleShoppingCustomLabel0: string;
  googleShoppingCustomLabel1: string;
  googleShoppingCustomLabel2: string;
  googleShoppingCustomLabel3: string;
  googleShoppingCustomLabel4: string;
  variant1Position: number;
  variant2Position: number;
  variant3Position: number;
  category?: string;
  originalSize?: string;
  standardSize?: string;
}

export default function PurchaseOrderImport() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sizingCountry, setSizingCountry] = useState('us');
  const [selectedSeason, setSelectedSeason] = useState('Resort');
  const [selectedYear, setSelectedYear] = useState('26');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.xlsx') && !uploadedFile.name.endsWith('.xls')) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setFile(uploadedFile);
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const workbook = new XLSX.Workbook();
      const arrayBuffer = await uploadedFile.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('No worksheet found in the Excel file');
      }

      const jsonData: ProductData[] = [];
      const headers: string[] = [];
      
      // Get headers from first row
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString() || '';
      });

      // Process data rows
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        
        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            rowData[header] = cell.value;
          }
        });

        // Map to ProductData structure
        const productData: ProductData = {
          id: rowData['ID'] || '',
          title: rowData['Title'] || '',
          handle: rowData['Handle'] || '',
          body: rowData['Body (HTML)'] || '',
          vendor: rowData['Vendor'] || '',
          type: rowData['Type'] || '',
          tags: rowData['Tags'] || '',
          published: rowData['Published'] === 'TRUE' || rowData['Published'] === true,
          option1Name: rowData['Option1 Name'] || '',
          option1Value: rowData['Option1 Value'] || '',
          option2Name: rowData['Option2 Name'] || '',
          option2Value: rowData['Option2 Value'] || '',
          option3Name: rowData['Option3 Name'] || '',
          option3Value: rowData['Option3 Value'] || '',
          variantSku: rowData['Variant SKU'] || '',
          variantGrams: Number(rowData['Variant Grams']) || 0,
          variantInventoryTracker: rowData['Variant Inventory Tracker'] || '',
          variantInventoryQty: Number(rowData['Variant Inventory Qty']) || 0,
          variantInventoryPolicy: rowData['Variant Inventory Policy'] || '',
          variantFulfillmentService: rowData['Variant Fulfillment Service'] || '',
          variantPrice: Number(rowData['Variant Price']) || 0,
          variantCompareAtPrice: Number(rowData['Variant Compare At Price']) || 0,
          variantRequiresShipping: rowData['Variant Requires Shipping'] === 'TRUE' || rowData['Variant Requires Shipping'] === true,
          variantTaxable: rowData['Variant Taxable'] === 'TRUE' || rowData['Variant Taxable'] === true,
          variantBarcode: rowData['Variant Barcode'] || '',
          imagePosition: Number(rowData['Image Position']) || 0,
          imageAltText: rowData['Image Alt Text'] || '',
          giftCard: rowData['Gift Card'] === 'TRUE' || rowData['Gift Card'] === true,
          seoTitle: rowData['SEO Title'] || '',
          seoDescription: rowData['SEO Description'] || '',
          googleShoppingCategory: rowData['Google Shopping / Google Product Category'] || '',
          googleShoppingGender: rowData['Google Shopping / Gender'] || '',
          googleShoppingAgeGroup: rowData['Google Shopping / Age Group'] || '',
          googleShoppingMpn: rowData['Google Shopping / MPN'] || '',
          googleShoppingCondition: rowData['Google Shopping / Condition'] || '',
          googleShoppingCustomProduct: rowData['Google Shopping / Custom Product'] || '',
          googleShoppingCustomLabel0: rowData['Google Shopping / Custom Label 0'] || '',
          googleShoppingCustomLabel1: rowData['Google Shopping / Custom Label 1'] || '',
          googleShoppingCustomLabel2: rowData['Google Shopping / Custom Label 2'] || '',
          googleShoppingCustomLabel3: rowData['Google Shopping / Custom Label 3'] || '',
          googleShoppingCustomLabel4: rowData['Google Shopping / Custom Label 4'] || '',
          variant1Position: Number(rowData['Variant Image']) || 0,
          variant2Position: Number(rowData['Variant Weight Unit']) || 0,
          variant3Position: Number(rowData['Variant Tax Code']) || 0,
          originalSize: rowData['Option1 Value'] || rowData['Option2 Value'] || '',
        };

        jsonData.push(productData);
      });

      setData(jsonData);
      
      // Extract unique categories for the dropdown
      const uniqueCategories = [...new Set(jsonData.map(item => item.type).filter(Boolean))];
      setCategories(uniqueCategories);
      
      setSuccess(`Successfully imported ${jsonData.length} products from Excel file`);
    } catch (err) {
      setError(`Error reading Excel file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxChange = (id: string) => {
    const newCheckedItems = new Set(checkedItems);
    if (newCheckedItems.has(id)) {
      newCheckedItems.delete(id);
    } else {
      newCheckedItems.add(id);
    }
    setCheckedItems(newCheckedItems);
  };

  const handleSelectAll = () => {
    if (checkedItems.size === data.length) {
      setCheckedItems(new Set());
    } else {
      setCheckedItems(new Set(data.map(item => item.id)));
    }
  };

  const handleCategoryAssignment = () => {
    if (!selectedCategory) {
      setError('Please select a category to assign');
      return;
    }

    const updatedData = [...data];
    let updatedCount = 0;
    const processedStyles = new Set<string>();

    // Process each checked item
    checkedItems.forEach(itemId => {
      const item = updatedData.find(d => d.id === itemId);
      if (!item) return;

      // Extract style name (everything before the first " - ")
      const styleName = item.title.split(' - ')[0].trim();
      
      if (processedStyles.has(styleName)) return;
      processedStyles.add(styleName);

      // Find all items with the same style name and update their category
      updatedData.forEach(dataItem => {
        const dataStyleName = dataItem.title.split(' - ')[0].trim();
        if (dataStyleName === styleName) {
          dataItem.category = selectedCategory;
          updatedCount++;
        }
      });
    });

    setData(updatedData);
    setSuccess(`Category "${selectedCategory}" assigned to ${updatedCount} items across ${processedStyles.size} styles`);
    setError('');
  };

  const handleStandardSizing = () => {
    const updatedData = [...data];
    let processedCount = 0;
    let skippedCount = 0;
    const sizeMapping = getSizeMapping(sizingCountry);
    const sizeMappingFilter = getSizeMappingFilter(sizingCountry);

    // Apply standard sizing to ALL items in the order
    updatedData.forEach(item => {
      // Skip items without categories
      if (!item.category) {
        skippedCount++;
        return;
      }

      const productType = getProductType(item.category);
      const originalSize = item.originalSize || item.option1Value || item.option2Value || '';
      
      let standardSize = originalSize;

      if (productType === 'shoes') {
        standardSize = convertShoeSize(originalSize);
      } else if (productType === 'jeans') {
        if (isDenimShorts(item.category)) {
          standardSize = sizeMappingFilter[originalSize] || originalSize;
        } else {
          // Keep original size for jeans
          standardSize = originalSize;
        }
      } else if (productType === 'clothing') {
        standardSize = sizeMapping[originalSize] || originalSize;
      }

      item.standardSize = standardSize;
      processedCount++;
    });

    setData(updatedData);
    
    let message = `Standard sizing applied to ${processedCount} items`;
    if (skippedCount > 0) {
      message += `. ${skippedCount} items skipped (no category assigned)`;
    }
    
    setSuccess(message);
    setError('');
  };

  const handleExport = async () => {
    if (data.length === 0) {
      setError('No data to export');
      return;
    }

    setIsLoading(true);
    try {
      const workbook = new XLSX.Workbook();
      const worksheet = workbook.addWorksheet('Purchase Order');

      // Define headers
      const headers = [
        'ID', 'Title', 'Handle', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published',
        'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value', 'Option3 Name', 'Option3 Value',
        'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty',
        'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price', 'Variant Compare At Price',
        'Variant Requires Shipping', 'Variant Taxable', 'Variant Barcode', 'Image Position', 'Image Alt Text',
        'Gift Card', 'SEO Title', 'SEO Description', 'Google Shopping / Google Product Category',
        'Google Shopping / Gender', 'Google Shopping / Age Group', 'Google Shopping / MPN',
        'Google Shopping / Condition', 'Google Shopping / Custom Product', 'Google Shopping / Custom Label 0',
        'Google Shopping / Custom Label 1', 'Google Shopping / Custom Label 2', 'Google Shopping / Custom Label 3',
        'Google Shopping / Custom Label 4', 'Variant Image', 'Variant Weight Unit', 'Variant Tax Code',
        'Category', 'Original Size', 'Standard Size'
      ];

      // Add headers
      worksheet.addRow(headers);

      // Add data
      data.forEach(item => {
        worksheet.addRow([
          item.id, item.title, item.handle, item.body, item.vendor, item.type, item.tags, item.published,
          item.option1Name, item.option1Value, item.option2Name, item.option2Value, item.option3Name, item.option3Value,
          item.variantSku, item.variantGrams, item.variantInventoryTracker, item.variantInventoryQty,
          item.variantInventoryPolicy, item.variantFulfillmentService, item.variantPrice, item.variantCompareAtPrice,
          item.variantRequiresShipping, item.variantTaxable, item.variantBarcode, item.imagePosition, item.imageAltText,
          item.giftCard, item.seoTitle, item.seoDescription, item.googleShoppingCategory,
          item.googleShoppingGender, item.googleShoppingAgeGroup, item.googleShoppingMpn,
          item.googleShoppingCondition, item.googleShoppingCustomProduct, item.googleShoppingCustomLabel0,
          item.googleShoppingCustomLabel1, item.googleShoppingCustomLabel2, item.googleShoppingCustomLabel3,
          item.googleShoppingCustomLabel4, item.variant1Position, item.variant2Position, item.variant3Position,
          item.category, item.originalSize, item.standardSize
        ]);
      });

      // Style the header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `purchase-order-${selectedSeason}-${selectedYear}-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      setSuccess('Purchase order exported successfully');
    } catch (err) {
      setError(`Error exporting file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Purchase Order Import">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Purchase Order Import</h1>
            <p className="text-slate-600 mt-1">Import and process purchase orders from Excel files</p>
          </div>
        </div>

        {/* Upload Section */}
        <Card>
          <div className="text-center">
            <FileSpreadsheet className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload Excel File</h3>
            <p className="text-slate-600 mb-6">Select an Excel file (.xlsx or .xls) to import purchase order data</p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="mb-4"
              disabled={isLoading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isLoading ? 'Processing...' : 'Choose File'}
            </Button>
            
            {file && (
              <p className="text-sm text-slate-600">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </Card>

        {/* Status Messages */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </Card>
        )}

        {success && (
          <Card className="border-green-200 bg-green-50">
            <div className="flex items-center space-x-2 text-green-700">
              <Check className="w-5 h-5" />
              <span>{success}</span>
            </div>
          </Card>
        )}

        {/* Configuration Section */}
        {data.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Order Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Season</label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {seasonOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {yearOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sizing Country</label>
                <select
                  value={sizingCountry}
                  onChange={(e) => setSizingCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {sizingOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Assignment */}
            <div className="flex flex-col sm:flex-row gap-4 items-end mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">Assign Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select a category...</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleCategoryAssignment}
                disabled={checkedItems.size === 0 || !selectedCategory}
                variant="secondary"
              >
                <Package className="w-4 h-4 mr-2" />
                Assign Category
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleStandardSizing}
                disabled={data.length === 0}
                variant="secondary"
              >
                <Settings className="w-4 h-4 mr-2" />
                Apply Standard Sizing
              </Button>
              
              <Button
                onClick={handleExport}
                disabled={data.length === 0 || isLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Purchase Order
              </Button>
            </div>
          </Card>
        )}

        {/* Data Table */}
        {data.length > 0 && (
          <Card padding="none">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Imported Products ({data.length} items)
                </h3>
                <Button
                  onClick={handleSelectAll}
                  variant="ghost"
                  size="sm"
                >
                  {checkedItems.size === data.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={checkedItems.size === data.length && data.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Standard Size</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {data.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={checkedItems.has(item.id)}
                          onChange={() => handleCheckboxChange(item.id)}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900 max-w-xs truncate" title={item.title}>
                          {item.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {item.vendor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {item.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {item.option1Value || item.option2Value || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        ${item.variantPrice?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.category ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {item.category}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {item.standardSize || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
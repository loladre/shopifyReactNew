import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ProductTable, { ProductTableColumn, Product } from '../components/ui/ProductTable';
import PaymentTable, { Payment, Credit } from '../components/ui/PaymentTable';
import ServerMessagePanel from '../components/ui/ServerMessagePanel';
import { 
  FileText, 
  Building2, 
  Calendar, 
  DollarSign, 
  Package,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Send,
  StickyNote
} from 'lucide-react';

interface DraftOrderDetail {
  purchaseOrderID: string;
  brand: string;
  purchaseOrderSeason: string;
  createdDate: string;
  startShipDate: string;
  completedDate: string;
  brandPoNumber: string;
  terms: string;
  depositPercent: number;
  onDeliverPercent: number;
  net30Percent: number;
  purchaseOrderNotes: string;
  purchaseOrderTotalItemsCost: number;
  purchaseOrderTotalPayments: number;
  purchaseOrderTotalCredits: number;
  purchaseOrderBalanceDue: number;
  products: Product[];
  purchaseOrderPayments: Payment[];
  purchaseOrderCredits: Credit[];
}

export default function DraftOrderDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState<DraftOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail(orderId);
    } else {
      setError('No order ID provided');
      setIsLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetail = async (purchaseOrderId: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('bridesbyldToken');
      
      if (!token) {
        navigate('/');
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://hushloladre.com';
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || '';
      
      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/getDraftOrderById/${purchaseOrderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Purchase order not found');
        } else {
          throw new Error('Failed to fetch order details');
        }
        return;
      }

      const data: DraftOrderDetail = await response.json();
      setOrder(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!order || !window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const token = localStorage.getItem('bridesbyldToken');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://hushloladre.com';
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || '';
      
      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/deleteDraftPurchaseOrderById/${order.purchaseOrderID}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      // Navigate back to draft orders list
      navigate('/draft-orders');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublishOrder = async () => {
    if (!order || !window.confirm('Are you sure you want to publish this order? This will create the items on Shopify.')) {
      return;
    }

    try {
      setIsPublishing(true);
      const token = localStorage.getItem('bridesbyldToken');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://hushloladre.com';
      const basePath = import.meta.env.VITE_SHOPIFY_BASE_PATH || '';
      
      const response = await fetch(`${apiBaseUrl}${basePath}/shopify/publishDraftOrderById/${order.purchaseOrderID}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to publish order');
      }

      // Navigate back to draft orders list
      navigate('/draft-orders');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish order');
    } finally {
      setIsPublishing(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
    }).format(value / 100);
  };

  // Product table columns
  const productColumns: ProductTableColumn[] = [
    {
      key: 'product.productName',
      header: 'Name',
      sortable: true,
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'variantColor',
      header: 'Color',
      sortable: true,
    },
    {
      key: 'variantSize',
      header: 'Size',
      sortable: true,
    },
    {
      key: 'variantQuantity',
      header: 'QTY',
      sortable: true,
      className: 'text-center',
    },
    {
      key: 'variantCost',
      header: 'Cost',
      sortable: true,
      render: (value) => formatCurrency(value),
      className: 'text-right',
    },
    {
      key: 'variantRetail',
      header: 'Retail',
      sortable: true,
      render: (value) => formatCurrency(value),
      className: 'text-right',
    },
    {
      key: 'variantSku',
      header: 'SKU',
      sortable: true,
    },
    {
      key: 'variantBarcode',
      header: 'Barcode',
      sortable: true,
    },
    {
      key: 'season',
      header: 'Season',
      render: () => '', // Empty as per original
    },
    {
      key: 'product.productType',
      header: 'P-Type',
      sortable: true,
    },
    {
      key: 'product.productTags',
      header: 'Tags',
      sortable: true,
    },
    {
      key: 'variantPreOrder',
      header: 'Preorder',
      render: (value) => (
        <span 
          className={`px-2 py-1 rounded text-xs font-medium ${
            value === 'true' 
              ? 'bg-red-100 text-red-800' 
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'margin',
      header: 'Margin',
      render: (_, variant) => {
        const margin = variant.variantRetail !== 0 
          ? (variant.variantRetail - variant.variantCost) / variant.variantRetail 
          : 0;
        return formatPercentage(margin * 100);
      },
      className: 'text-right',
    },
    {
      key: 'total',
      header: 'Total',
      render: (_, variant) => formatCurrency(variant.variantCost * variant.variantQuantity),
      className: 'text-right font-semibold',
    },
    {
      key: 'variantMetafieldShoeSize',
      header: 'S.S',
    },
    {
      key: 'variantMetafieldClothingSize',
      header: 'C.S',
    },
    {
      key: 'variantMetafieldJeansSize',
      header: 'J.S',
    },
    {
      key: 'variantMetafieldCategory',
      header: 'CAT',
    },
  ];

  if (isLoading) {
    return (
      <Layout title="Draft Order Detail">
        <div className="w-full px-6 py-6">
          <Card className="text-center py-12">
            <Package className="w-16 h-16 text-slate-400 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Order Details</h3>
            <p className="text-slate-600">Please wait while we fetch the order information...</p>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout title="Draft Order Detail">
        <div className="w-full px-6 py-6">
          <Card className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Order</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={() => navigate('/draft-orders')}>Back to Draft Orders</Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Draft Order #${order.purchaseOrderID}`}>
      <div className="w-full px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header */}
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-purple-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      Draft Order #{order.purchaseOrderID}
                    </h1>
                    <p className="text-slate-600">Status: Draft</p>
                  </div>
                </div>
                <Button onClick={() => navigate('/draft-orders')} variant="outline">
                  Back to List
                </Button>
              </div>
            </Card>

            {/* Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">Brand:</span>
                    <span className="text-slate-700">{order.brand}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">Season:</span>
                    <span className="text-slate-700">{order.purchaseOrderSeason}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">Terms:</span>
                    <span className="text-slate-700">{order.terms}</span>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">Created:</span>
                    <span className="text-slate-700">{formatDate(order.createdDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">Start Ship:</span>
                    <span className="text-slate-700">{formatDate(order.startShipDate)}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-900">Payment Terms:</span>
                    <p className="text-sm text-slate-700">
                      Deposit: {order.depositPercent}% - Delivery: {order.onDeliverPercent}% - Net30: {order.net30Percent}%
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">Cancel:</span>
                    <span className="text-slate-700">{formatDate(order.completedDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">Brand PO#:</span>
                    <span className="text-slate-700">{order.brandPoNumber}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Products Table */}
            <Card padding="none">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Order Items</h3>
              </div>
              <ProductTable
                columns={productColumns}
                products={order.products}
                emptyMessage="No products in this order"
                showAlternatingRows={true}
              />
            </Card>

            {/* Payments and Credits */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PaymentTable
                title="Credits"
                data={order.purchaseOrderCredits}
                type="credits"
              />
              <PaymentTable
                title="Payments"
                data={order.purchaseOrderPayments}
                type="payments"
              />
            </div>

            {/* Notes and Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <StickyNote className="w-5 h-5 text-slate-400" />
                    <h5 className="text-lg font-semibold text-slate-900">Notes</h5>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {order.purchaseOrderNotes || 'No notes available'}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={handleDeleteOrder}
                      variant="danger"
                      isLoading={isDeleting}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Order
                    </Button>
                    <Button
                      onClick={handlePublishOrder}
                      variant="primary"
                      isLoading={isPublishing}
                      className="flex-1"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Publish Order
                    </Button>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-900">Order Totals</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Sub-Total:</span>
                      <span className="font-semibold">{formatCurrency(order.purchaseOrderTotalItemsCost)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Payments:</span>
                      <span className="font-semibold">{formatCurrency(order.purchaseOrderTotalPayments)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Credits:</span>
                      <span className="font-semibold">{formatCurrency(order.purchaseOrderTotalCredits)}</span>
                    </div>
                    <hr className="border-slate-200" />
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold text-slate-900">Total Balance Due:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(order.purchaseOrderBalanceDue)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
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
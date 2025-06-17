import React from 'react';
import { Calendar, CreditCard, DollarSign, FileText } from 'lucide-react';

export interface Payment {
  paymentDate: string;
  paymentDescription: string;
  paymentMethod: string;
  paymentAmount: number;
}

export interface Credit {
  creditDate: string;
  creditDescription: string;
  creditMethod: string;
  creditAmount: number;
}

interface PaymentTableProps {
  title: string;
  data: Payment[] | Credit[];
  type: 'payments' | 'credits';
  className?: string;
}

export default function PaymentTable({ title, data, type, className = '' }: PaymentTableProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const getIcon = () => {
    return type === 'payments' ? (
      <CreditCard className="w-5 h-5 text-green-600" />
    ) : (
      <DollarSign className="w-5 h-5 text-blue-600" />
    );
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        {getIcon()}
        <h5 className="text-lg font-semibold text-slate-900">{title}</h5>
      </div>
      
      {data.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400" />
          <p>No {type} recorded</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 rounded-lg">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide rounded-tl-lg">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Method
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide rounded-tr-lg">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors duration-200">
                  <td className="px-4 py-3 text-sm text-slate-900">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{formatDate(type === 'payments' ? (item as Payment).paymentDate : (item as Credit).creditDate)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {type === 'payments' ? (item as Payment).paymentDescription : (item as Credit).creditDescription}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {type === 'payments' ? (item as Payment).paymentMethod : (item as Credit).creditMethod}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                    {formatCurrency(type === 'payments' ? (item as Payment).paymentAmount : (item as Credit).creditAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
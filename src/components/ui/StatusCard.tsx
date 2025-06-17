import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'slate';
  className?: string;
}

export default function StatusCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  className = '' 
}: StatusCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-gradient-to-r from-blue-50 to-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-600',
      textDark: 'text-blue-900',
      iconBg: 'bg-blue-500'
    },
    green: {
      bg: 'bg-gradient-to-r from-green-50 to-green-100',
      border: 'border-green-200',
      text: 'text-green-600',
      textDark: 'text-green-900',
      iconBg: 'bg-green-500'
    },
    purple: {
      bg: 'bg-gradient-to-r from-purple-50 to-purple-100',
      border: 'border-purple-200',
      text: 'text-purple-600',
      textDark: 'text-purple-900',
      iconBg: 'bg-purple-500'
    },
    orange: {
      bg: 'bg-gradient-to-r from-orange-50 to-orange-100',
      border: 'border-orange-200',
      text: 'text-orange-600',
      textDark: 'text-orange-900',
      iconBg: 'bg-orange-500'
    },
    red: {
      bg: 'bg-gradient-to-r from-red-50 to-red-100',
      border: 'border-red-200',
      text: 'text-red-600',
      textDark: 'text-red-900',
      iconBg: 'bg-red-500'
    },
    slate: {
      bg: 'bg-gradient-to-r from-slate-50 to-slate-100',
      border: 'border-slate-200',
      text: 'text-slate-600',
      textDark: 'text-slate-900',
      iconBg: 'bg-slate-500'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className={`w-full bg-white rounded-xl border p-6 ${colors.bg} ${colors.border} ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`${colors.text} text-sm font-medium`}>{title}</p>
          <p className={`text-2xl font-bold ${colors.textDark}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 ${colors.iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
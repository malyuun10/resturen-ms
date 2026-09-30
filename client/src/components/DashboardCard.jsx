import React from 'react';

const DashboardCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  colorScheme = 'maroon', // 'maroon', 'green', 'amber', 'blue', 'red'
  onClick,
  className = ''
}) => {
  const schemeStyles = {
    maroon: {
      border: 'hover:border-[#800020]/40',
      iconBg: 'bg-[#FDF2F4] text-[#800020]',
      badge: 'bg-[#FDF2F4] text-[#800020]'
    },
    green: {
      border: 'hover:border-emerald-400',
      iconBg: 'bg-emerald-50 text-emerald-600',
      badge: 'bg-emerald-50 text-emerald-700'
    },
    amber: {
      border: 'hover:border-amber-400',
      iconBg: 'bg-amber-50 text-amber-600',
      badge: 'bg-amber-50 text-amber-700'
    },
    blue: {
      border: 'hover:border-blue-400',
      iconBg: 'bg-blue-50 text-blue-600',
      badge: 'bg-blue-50 text-blue-700'
    },
    red: {
      border: 'hover:border-red-400',
      iconBg: 'bg-red-50 text-red-600',
      badge: 'bg-red-50 text-red-700'
    }
  };

  const currentScheme = schemeStyles[colorScheme] || schemeStyles.maroon;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-5 border border-gray-100 shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md ' + currentScheme.border : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#1F2937] tracking-tight">
              {value}
            </span>
            {badgeText && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${currentScheme.badge}`}
              >
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-[#6B7280]">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl shrink-0 ${currentScheme.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;

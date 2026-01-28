/**
 * Componente TableSkeleton - Skeleton loader para tablas
 * Mejora la percepción de velocidad durante la carga
 */
import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  isDarkMode?: boolean;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 7,
  isDarkMode = false
}) => {
  const skeletonBg = isDarkMode ? 'bg-gray-700' : 'bg-gray-200';
  const headerBg = isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  const rowBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`rounded-lg overflow-hidden border ${borderColor}`}>
      <table className="min-w-full">
        {/* Header skeleton */}
        <thead className={headerBg}>
          <tr>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <th key={colIndex} className="px-6 py-3">
                <div className={`h-4 ${skeletonBg} rounded animate-pulse`} style={{ width: `${60 + Math.random() * 30}%` }} />
              </th>
            ))}
          </tr>
        </thead>
        {/* Body skeleton */}
        <tbody className={`divide-y ${borderColor}`}>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className={rowBg}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className="space-y-2">
                    <div
                      className={`h-4 ${skeletonBg} rounded animate-pulse`}
                      style={{
                        width: `${50 + Math.random() * 40}%`,
                        animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`
                      }}
                    />
                    {/* Segunda línea en algunas columnas */}
                    {colIndex % 3 === 1 && (
                      <div
                        className={`h-3 ${skeletonBg} rounded animate-pulse opacity-60`}
                        style={{
                          width: `${30 + Math.random() * 30}%`,
                          animationDelay: `${(rowIndex * columns + colIndex) * 50 + 100}ms`
                        }}
                      />
                    )}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableSkeleton;

import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { withDensity, WithDensityProps } from './hoc/withDensity';
import { densityClasses } from './DensityStyles';

type TableAlign = 'left' | 'center' | 'right';

interface TableColumn<T> {
  header: ReactNode;
  accessor: keyof T | ((row: T) => ReactNode);
  align?: TableAlign;
  width?: string | number;
  className?: string;
}

interface TableBaseProps<T> extends WithDensityProps {
  data: T[];
  columns: TableColumn<T>[];
  className?: string;
  emptyMessage?: ReactNode;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;
  isLoading?: boolean;
  loadingRows?: number;
  rowKey?: keyof T | ((row: T) => string);
  sticky?: boolean;
  zebra?: boolean;
  bordered?: boolean;
  compact?: boolean; // Override density level with compact mode
}

/**
 * TableBase component
 * A density-aware table component that adapts its styling based on the density level
 */
function TableBase<T extends object>({
  data,
  columns,
  className = '',
  emptyMessage = 'No data available',
  onRowClick,
  rowClassName,
  isLoading = false,
  loadingRows = 5,
  rowKey,
  sticky = false,
  zebra = true,
  bordered = false,
  compact = false,
  densityLevel,
  densitySpacing
}: TableBaseProps<T>) {
  // Get row padding based on density level or compact override
  const getRowPadding = () => {
    if (compact) return 'py-1 px-2';
    
    switch (densityLevel) {
      case 'compact':
        return 'py-1.5 px-3';
      case 'comfortable':
        return 'py-4 px-6';
      default: // normal
        return 'py-2.5 px-4';
    }
  };

  // Get header padding based on density level or compact override
  const getHeaderPadding = () => {
    if (compact) return 'py-1.5 px-2';
    
    switch (densityLevel) {
      case 'compact':
        return 'py-2 px-3';
      case 'comfortable':
        return 'py-5 px-6';
      default: // normal
        return 'py-3 px-4';
    }
  };

  // Get text size based on density level or compact override
  const getTextSize = () => {
    if (compact) return 'text-xs';
    
    switch (densityLevel) {
      case 'compact':
        return 'text-sm';
      case 'comfortable':
        return 'text-base';
      default: // normal
        return 'text-sm';
    }
  };

  // Get alignment class
  const getAlignClass = (align: TableAlign = 'left') => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  // Get key for a row
  const getRowKey = (row: T, index: number) => {
    if (!rowKey) return `row-${index}`;
    
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    
    return String(row[rowKey]);
  };

  // Get cell content based on accessor
  const getCellContent = (row: T, accessor: keyof T | ((row: T) => ReactNode)) => {
    if (typeof accessor === 'function') {
      return accessor(row);
    }
    
    return row[accessor] as ReactNode;
  };

  // Classes
  const rowPadding = getRowPadding();
  const headerPadding = getHeaderPadding();
  const textSize = getTextSize();
  
  const tableClassName = cn(
    densityClasses.container,
    "w-full border-collapse",
    bordered && "border border-gray-200",
    textSize,
    className
  );
  
  const tableHeadClassName = cn(
    "bg-gray-50",
    bordered && "border-b border-gray-200",
    sticky && "sticky top-0 z-10"
  );
  
  const tableBodyClassName = cn(
    "divide-y divide-gray-200"
  );
  
  // Render loading skeleton
  const renderLoadingSkeleton = () => {
    return Array.from({ length: loadingRows }).map((_, rowIndex) => (
      <tr key={`loading-${rowIndex}`} className="animate-pulse">
        {columns.map((column, colIndex) => (
          <td 
            key={`loading-${rowIndex}-${colIndex}`}
            className={cn(
              rowPadding,
              getAlignClass(column.align),
              "border-b border-gray-100"
            )}
          >
            <div 
              className="h-4 bg-gray-200 rounded"
              style={{ 
                width: typeof column.width === 'number' ? `${column.width}px` : column.width || '100%',
              }}
            ></div>
          </td>
        ))}
      </tr>
    ));
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className={tableClassName} style={{ 
        borderSpacing: 0,
        gap: densitySpacing.gap 
      }}>
        <thead className={tableHeadClassName}>
          <tr>
            {columns.map((column, index) => (
              <th 
                key={`header-${index}`}
                className={cn(
                  headerPadding,
                  getAlignClass(column.align),
                  "font-medium text-gray-700",
                  column.className
                )}
                style={{ 
                  width: typeof column.width === 'number' ? `${column.width}px` : column.width 
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody className={tableBodyClassName}>
          {isLoading ? (
            renderLoadingSkeleton()
          ) : data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length} 
                className={cn(
                  rowPadding,
                  "text-center text-gray-500"
                )}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr 
                key={getRowKey(row, rowIndex)}
                className={cn(
                  onRowClick && "cursor-pointer hover:bg-gray-50",
                  zebra && rowIndex % 2 === 1 && "bg-gray-50",
                  rowClassName && rowClassName(row, rowIndex)
                )}
                onClick={() => onRowClick && onRowClick(row, rowIndex)}
              >
                {columns.map((column, colIndex) => (
                  <td 
                    key={`cell-${rowIndex}-${colIndex}`}
                    className={cn(
                      rowPadding,
                      getAlignClass(column.align),
                      bordered && "border-b border-gray-200",
                      !bordered && "border-b border-gray-100",
                      column.className
                    )}
                  >
                    {getCellContent(row, column.accessor)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Table component with density awareness
 * A flexible data table that adapts its styling based on the density level
 */
export const Table = withDensity(TableBase) as <T extends object>(
  props: Omit<TableBaseProps<T>, keyof WithDensityProps>
) => React.ReactElement;

export default Table;

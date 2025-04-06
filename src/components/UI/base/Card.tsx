import React from 'react';
import { useDensity } from '../../../contexts/ui/DensityContext';
import { densityClasses } from '../DensityStyles';
import { Box } from './Box';

/**
 * Props for the Card component
 */
export interface CardProps {
  children?: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  elevation?: 0 | 1 | 2 | 3;
  bordered?: boolean;
  hoverable?: boolean;
  headerActions?: React.ReactNode;
  as?: React.ElementType;
  densityClass?: keyof typeof densityClasses;
  style?: React.CSSProperties;
}

/**
 * A card component that adapts to density settings
 * Used for grouping related content
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  footer,
  elevation = 1,
  bordered = false,
  hoverable = false,
  headerActions,
  as,
  densityClass,
  style,
  ...rest
}) => {
  const { density } = useDensity();
  
  // Compute CSS classes based on props
  const elevationClass = `card-elevation-${elevation}`;
  const borderedClass = bordered ? 'card-bordered' : '';
  const hoverableClass = hoverable ? 'card-hoverable' : '';
  
  const classes = [
    elevationClass,
    borderedClass,
    hoverableClass,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <Box 
      className={classes} 
      densityClass="card"
      data-density={density}
      as={as}
      style={style}
      {...rest}
    >
      {title && (
        <div className="card-header">
          {typeof title === 'string' ? (
            <h3 className={densityClasses.heading}>{title}</h3>
          ) : (
            title
          )}
          {headerActions && (
            <div className="card-header-actions">
              {headerActions}
            </div>
          )}
        </div>
      )}
      
      <div className="card-content">
        {children}
      </div>
      
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </Box>
  );
};

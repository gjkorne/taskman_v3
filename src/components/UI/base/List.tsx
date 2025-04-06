import React from 'react';
import { useDensity } from '../../../contexts/ui/DensityContext';
import { densityClasses } from '../DensityStyles';

/**
 * Props for the List component
 */
export interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  children?: React.ReactNode;
  className?: string;
  bordered?: boolean;
  hoverable?: boolean;
  divided?: boolean;
}

/**
 * Props for the ListItem component
 */
export interface ListItemProps {
  children?: React.ReactNode;
  className?: string;
  active?: boolean;
  selected?: boolean;
  disabled?: boolean;
  actions?: React.ReactNode;
  prefix?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLLIElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLLIElement>;
  onFocus?: React.FocusEventHandler<HTMLLIElement>;
  onBlur?: React.FocusEventHandler<HTMLLIElement>;
  tabIndex?: number;
  role?: string;
  id?: string;
  style?: React.CSSProperties;
}

/**
 * A list component that adapts to density settings
 * Used for displaying collections of data
 */
export const List: React.FC<ListProps> = ({
  children,
  className = '',
  bordered = false,
  hoverable = false,
  divided = false,
  ...rest
}) => {
  const { density } = useDensity();
  
  // Compute CSS classes based on props
  const borderedClass = bordered ? 'list-bordered' : '';
  const hoverableClass = hoverable ? 'list-hoverable' : '';
  const dividedClass = divided ? 'list-divided' : '';
  
  const classes = [
    densityClasses.container,
    'list',
    borderedClass,
    hoverableClass,
    dividedClass,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <ul 
      className={classes} 
      data-density={density} 
      {...rest}
    >
      {children}
    </ul>
  );
};

/**
 * List item that adapts to density settings
 */
export const ListItem: React.FC<ListItemProps> = ({
  children,
  className = '',
  active = false,
  selected = false,
  disabled = false,
  actions,
  prefix,
  ...rest
}) => {
  const { density } = useDensity();
  
  // Compute CSS classes based on props
  const activeClass = active ? 'list-item-active' : '';
  const selectedClass = selected ? 'list-item-selected' : '';
  const disabledClass = disabled ? 'list-item-disabled' : '';
  
  const classes = [
    densityClasses.listItem,
    'list-item',
    activeClass,
    selectedClass,
    disabledClass,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <li 
      className={classes} 
      data-density={density}
      {...rest}
    >
      {prefix && <div className="list-item-prefix">{prefix}</div>}
      <div className="list-item-content">{children}</div>
      {actions && <div className="list-item-actions">{actions}</div>}
    </li>
  );
};

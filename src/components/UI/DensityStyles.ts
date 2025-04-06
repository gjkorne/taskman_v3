import { DensityLevel } from '../../contexts/ui/DensityContext';

/**
 * Type definitions for spacing values based on density
 */
export interface DensitySpacing {
  padding: string;
  margin: string;
  gap: string;
  borderRadius: string;
  fontSize: string;
  lineHeight: string;
  minHeight: string;
}

/**
 * Default spacing values for different density levels
 */
const densitySpacingMap: Record<DensityLevel, DensitySpacing> = {
  [DensityLevel.COMPACT]: {
    padding: '4px 8px',
    margin: '4px',
    gap: '4px',
    borderRadius: '3px',
    fontSize: '0.875rem',
    lineHeight: '1.25',
    minHeight: '28px'
  },
  [DensityLevel.NORMAL]: {
    padding: '8px 12px',
    margin: '8px',
    gap: '8px',
    borderRadius: '4px',
    fontSize: '1rem',
    lineHeight: '1.5',
    minHeight: '36px'
  },
  [DensityLevel.COMFORTABLE]: {
    padding: '12px 16px',
    margin: '12px',
    gap: '12px',
    borderRadius: '6px',
    fontSize: '1.125rem',
    lineHeight: '1.75',
    minHeight: '44px'
  }
};

/**
 * Get spacing values based on density level
 */
export const getDensitySpacing = (density: DensityLevel): DensitySpacing => {
  return densitySpacingMap[density] || densitySpacingMap[DensityLevel.NORMAL];
};

/**
 * CSS classes for different density levels
 */
export const densityClasses = {
  container: 'density-container',
  item: 'density-item',
  listItem: 'density-list-item',
  button: 'density-button',
  input: 'density-input',
  card: 'density-card',
  heading: 'density-heading'
};

/**
 * Generate CSS for density classes
 * This is used to create a global stylesheet
 */
export const generateDensityCss = (): string => {
  let css = '';
  
  // Generate CSS for each density level
  Object.values(DensityLevel).forEach(level => {
    const spacing = getDensitySpacing(level as DensityLevel);
    const prefix = `.density-${level}`;
    
    // Container styles
    css += `
      ${prefix} .${densityClasses.container} {
        padding: ${spacing.padding};
        gap: ${spacing.gap};
      }
      
      ${prefix} .${densityClasses.item} {
        margin: ${spacing.margin};
        padding: ${spacing.padding};
        border-radius: ${spacing.borderRadius};
        font-size: ${spacing.fontSize};
        line-height: ${spacing.lineHeight};
      }
      
      ${prefix} .${densityClasses.listItem} {
        min-height: ${spacing.minHeight};
        padding: ${spacing.padding};
        gap: ${spacing.gap};
        margin-bottom: ${spacing.margin.split(' ')[0]};
      }
      
      ${prefix} .${densityClasses.button} {
        min-height: ${spacing.minHeight};
        padding: ${spacing.padding};
        border-radius: ${spacing.borderRadius};
        font-size: ${spacing.fontSize};
      }
      
      ${prefix} .${densityClasses.input} {
        padding: ${spacing.padding};
        border-radius: ${spacing.borderRadius};
        font-size: ${spacing.fontSize};
        min-height: ${spacing.minHeight};
      }
      
      ${prefix} .${densityClasses.card} {
        padding: ${spacing.padding};
        margin: ${spacing.margin};
        border-radius: ${spacing.borderRadius};
        gap: ${spacing.gap};
      }
      
      ${prefix} .${densityClasses.heading} {
        margin-bottom: ${spacing.margin.split(' ')[0]};
        font-size: calc(${spacing.fontSize} * 1.25);
      }
    `;
  });
  
  return css;
};

/**
 * Returns a CSS module string with all density classes
 * This can be injected into the DOM to apply density styles globally
 */
export const densityCssModule = generateDensityCss();

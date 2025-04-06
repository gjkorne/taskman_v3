import React from 'react';
import { useDensity, DensityLevel } from '../../contexts/ui/DensityContext';
import { Button } from './base/Button';
import { Box } from './base/Box';
import { Card } from './base/Card';

interface DensitySelectorProps {
  title?: string;
  showLabels?: boolean;
  className?: string;
}

/**
 * A component that allows users to select their preferred UI density
 */
export const DensitySelector: React.FC<DensitySelectorProps> = ({
  title = 'UI Density',
  showLabels = true,
  className = '',
}) => {
  const { density, setDensity } = useDensity();
  
  const handleSelectDensity = (level: DensityLevel) => {
    setDensity(level);
  };
  
  return (
    <Card 
      title={title}
      className={`density-selector ${className}`}
      data-density={density}
    >
      <Box className="density-options">
        <Button
          variant={density === DensityLevel.COMPACT ? 'primary' : 'secondary'}
          onClick={() => handleSelectDensity(DensityLevel.COMPACT)}
          className="density-option-compact"
        >
          {showLabels ? 'Compact' : null}
          <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
            <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
          </svg>
        </Button>
        
        <Button
          variant={density === DensityLevel.NORMAL ? 'primary' : 'secondary'}
          onClick={() => handleSelectDensity(DensityLevel.NORMAL)}
          className="density-option-normal"
        >
          {showLabels ? 'Normal' : null}
          <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
            <path d="M4 5h16v3H4zm0 5.5h16v3H4zm0 5.5h16v3H4z" />
          </svg>
        </Button>
        
        <Button
          variant={density === DensityLevel.COMFORTABLE ? 'primary' : 'secondary'}
          onClick={() => handleSelectDensity(DensityLevel.COMFORTABLE)}
          className="density-option-comfortable"
        >
          {showLabels ? 'Comfortable' : null}
          <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
            <path d="M4 4h16v4H4zm0 6h16v4H4zm0 6h16v4H4z" />
          </svg>
        </Button>
      </Box>
      
      {showLabels && (
        <p className="density-description">
          {density === DensityLevel.COMPACT && 'Compact view: Maximizes information density.'}
          {density === DensityLevel.NORMAL && 'Normal view: Balanced for most users.'}
          {density === DensityLevel.COMFORTABLE && 'Comfortable view: More space between elements.'}
        </p>
      )}
    </Card>
  );
};

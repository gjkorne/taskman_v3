# Density-Aware UI System

## Overview

The density-aware UI system is a flexible framework that allows components to adapt their appearance based on user density preferences. This system enables:

- **Consistent UI density** across all components
- **User preference control** for display density
- **Component adaptation** without duplicating code
- **Centralized density management** via context

## Architecture

### Core Components

1. **DensityContext** (`src/contexts/ui/DensityContext.tsx`)
   - Manages the global density state
   - Provides density levels: `COMPACT`, `NORMAL`, and `COMFORTABLE`
   - Includes persistence via local storage
   - Offers toggle and set methods to change density

2. **DensityStyleInjector** (`src/components/UI/DensityStyleInjector.tsx`)
   - Injects dynamic CSS for density-specific styling
   - Adds `data-density` attribute to the document body
   - Updates styles automatically when density changes

3. **DensityStyles** (`src/components/UI/DensityStyles.ts` & `.css`)
   - Defines spacing values for each density level
   - Generates CSS variables for consistent usage
   - Provides utility classes for density variants

4. **withDensity HOC** (`src/components/UI/hoc/withDensity.tsx`)
   - Higher-order component to make any component density-aware
   - Provides density level and spacing props to wrapped components
   - Abstracts density context consumption

5. **DensitySelector** (`src/components/UI/DensitySelector.tsx`)
   - UI component for users to select their preferred density
   - Shows visual representation of each density option
   - Persists selections automatically

### Base Components

The following base components are density-aware and can be used to build complex UI:

1. **Box** (`src/components/UI/base/Box.tsx`)
   - Basic container element
   - Can render as different HTML elements
   - Accepts density class prop

2. **Button** (`src/components/UI/base/Button.tsx`)
   - Adaptive button component
   - Sizing adjusts based on density
   - Multiple variants (primary, secondary, etc.)

3. **Card** (`src/components/UI/base/Card.tsx`)
   - Container for grouped content
   - Header, content, and footer sections
   - Adjusts padding and spacing based on density

4. **List/ListItem** (`src/components/UI/base/List.tsx`)
   - Components for displaying collections
   - Adaptive spacing between items
   - Support for hover, active states

5. **Input** (`src/components/UI/base/Input.tsx`)
   - Form input components
   - Sizing and padding adapts to density
   - Support for validation states

## Usage Guide

### Basic Setup

The density system is enabled by wrapping your application with the `DensityProvider` and adding the `DensityStyleInjector`:

```tsx
import { DensityProvider } from './contexts/ui/DensityContext';
import { DensityStyleInjector } from './components/UI/DensityStyleInjector';

function App() {
  return (
    <DensityProvider>
      <DensityStyleInjector />
      <YourAppContent />
    </DensityProvider>
  );
}
```

### Using Base Components

Using the density-aware base components is straightforward:

```tsx
import { Box } from './components/UI/base/Box';
import { Button } from './components/UI/base/Button';
import { Card } from './components/UI/base/Card';

function TaskComponent() {
  return (
    <Card title="Task Details">
      <Box className="task-content">
        Task content goes here
      </Box>
      <Button variant="primary">Save Task</Button>
    </Card>
  );
}
```

### Creating Custom Density-Aware Components

To make a custom component density-aware, use the `withDensity` HOC:

```tsx
import React from 'react';
import { withDensity, WithDensityProps } from './components/UI/hoc/withDensity';

interface MyComponentProps extends WithDensityProps {
  title: string;
}

const MyComponentBase: React.FC<MyComponentProps> = ({ 
  title, 
  densityLevel,
  densitySpacing 
}) => {
  return (
    <div 
      style={{ 
        padding: densitySpacing.padding,
        fontSize: densitySpacing.fontSize 
      }}
    >
      <h2>{title}</h2>
    </div>
  );
};

export const MyComponent = withDensity(MyComponentBase);
```

### Accessing Density Context Directly

For more complex scenarios, you can access the density context directly:

```tsx
import { useDensity } from './contexts/ui/DensityContext';

function MyComponent() {
  const { density, setDensity, toggleDensity } = useDensity();
  
  return (
    <div>
      Current density: {density}
      <button onClick={() => toggleDensity()}>Toggle Density</button>
    </div>
  );
}
```

### Adding the Density Selector to Settings

To give users control over density, include the `DensitySelector` component:

```tsx
import { DensitySelector } from './components/UI/DensitySelector';

function SettingsPage() {
  return (
    <div>
      <h2>User Interface Settings</h2>
      <DensitySelector />
    </div>
  );
}
```

## CSS Classes

### Global Classes

These classes are applied to the body and are available globally:

- `density-compact` - Applied when using compact density
- `density-normal` - Applied when using normal density
- `density-comfortable` - Applied when using comfortable density

### Component-Specific Classes

Each component has density-specific classes:

- `density-button` - For buttons
- `density-card` - For cards
- `density-list-item` - For list items
- `density-input` - For input fields

## Density Values

The system includes three density levels with corresponding spacing values:

| Level | Padding | Margin | Font Size |
|-------|---------|--------|-----------|
| COMPACT | 4px | 4px | 0.875rem |
| NORMAL | 8px | 8px | 1rem |
| COMFORTABLE | 12px | 12px | 1.125rem |

## Integration with Legacy Code

While migrating to the new density system, we maintain compatibility with the legacy UI settings:

- The Settings page includes both the new DensitySelector and the legacy UI density setting
- Components can check both the DensityContext and legacy settings for backward compatibility

## Future Improvements

1. **Create comprehensive design tokens** for spacing, typography, and other values
2. **Add more base components** to expand the component library
3. **Enhance responsive behavior** for different screen sizes
4. **Add animation support** for density transitions
5. **Integrate with theme system** for comprehensive design control

## Testing

Density-aware components should be tested in all three density modes to ensure proper adaptation. Test cases should verify:

1. **Visual rendering** in each density
2. **Proper spacing** between and within components
3. **Text readability** especially in compact mode
4. **Touch targets** remain accessible in all modes
5. **Responsive behavior** on different screen sizes

## References

- [Design System Spacing](https://material.io/design/layout/spacing-methods.html)
- [UI Density Best Practices](https://www.nngroup.com/articles/spacing-ui-components/)
- [React Context API](https://reactjs.org/docs/context.html)
- [Higher-Order Components](https://reactjs.org/docs/higher-order-components.html)

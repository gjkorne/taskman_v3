# TaskMan v3

TaskMan is a modern task management application built with React and TypeScript, designed to help users organize and track their tasks efficiently.

## Features

- Create, edit, and manage tasks with ease
- Smart task filtering and sorting
- Offline-second architecture for working without an internet connection
- Real-time synchronization between devices
- Responsive design for desktop and mobile
- Customizable UI density to match your workflow

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/taskman_v3.git
cd taskman_v3
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the development server
```bash
npm start
# or
yarn start
```

## Architecture

### Density-Aware UI System

TaskMan v3 includes a comprehensive density-aware UI system that allows components to adapt based on user preferences. This feature enhances user experience by providing flexibility in how the interface is displayed.

#### Key Components

- **DensityContext**: A React context that provides global density state management
- **DensityProvider**: Wraps the application and maintains the current density level
- **DensityStyleInjector**: Injects global CSS variables based on the current density
- **withDensity**: Higher-order component (HOC) for making any component density-aware

#### Density Levels

- **Compact**: Maximizes information density for power users
- **Normal**: Default balanced view
- **Comfortable**: More spacious layout for improved readability

#### Usage

Components can access the current density through the `useDensity` hook:

```tsx
import { useDensity } from '../contexts/ui/DensityContext';

const MyComponent = () => {
  const { density, setDensity } = useDensity();
  
  return (
    <div>Current density: {density}</div>
  );
};
```

The `DensitySelector` component allows users to change their preferred density:

```tsx
import { DensitySelector } from '../components/UI/DensitySelector';

const SettingsPage = () => {
  return (
    <div>
      <h1>Settings</h1>
      <DensitySelector showLabels={true} />
    </div>
  );
};
```

For more detailed information, see [the density-aware UI documentation](./docs/Architecture/density-aware-ui.md).

### Base Components

The following density-aware base components are available:

- **Box**: Basic container with density awareness
- **Button**: Adaptive button with multiple variants
- **Card**: Content container with header/body/footer
- **List/ListItem**: For collections of content
- **Input**: Form controls with density adaptation

## Development

### Testing

Run tests with:

```bash
npm test
# or
yarn test
```

### Building for Production

```bash
npm run build
# or
yarn build
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

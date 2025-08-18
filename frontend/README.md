# EasyVideo Frontend

The frontend module of EasyVideo is a modern React-based web application that provides an intuitive user interface for AI-powered video creation. Built with TypeScript, Vite, and Tailwind CSS, it offers a responsive and feature-rich experience for content creators.

## Overview

The frontend serves as the primary user interface for EasyVideo, enabling users to:
- Generate images from text descriptions
- Convert images to videos
- Create and manage storyboards
- Configure system settings
- Manage projects and workflows
- Monitor system status and generation progress

## Architecture

### Technology Stack
- **Framework**: React 17 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: Zustand for lightweight state management
- **Routing**: React Router DOM for client-side navigation
- **HTTP Client**: Axios for API communication
- **UI Components**: Custom components with Lucide React icons
- **Animations**: Framer Motion for smooth transitions
- **Notifications**: React Hot Toast for user feedback

### Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── common/         # Generic components
│   │   ├── forms/          # Form-specific components
│   │   ├── media/          # Media-related components
│   │   ├── ErrorBoundary.tsx
│   │   ├── Header.tsx
│   │   ├── Layout.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── Modal.tsx
│   │   ├── Sidebar.tsx
│   │   └── StatusIndicator.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useApi.ts
│   │   ├── useAsync.ts
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   ├── pages/              # Page components
│   │   ├── ConfigPage.tsx
│   │   ├── ImageToVideoPage.tsx
│   │   ├── ProjectPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── StartupPage.tsx
│   │   ├── StoryboardPage.tsx
│   │   └── TextToImagePage.tsx
│   ├── services/           # API service layer
│   │   ├── api.ts
│   │   ├── apiClient.ts
│   │   ├── configService.ts
│   │   ├── generationService.ts
│   │   └── projectService.ts
│   ├── store/              # State management
│   │   └── useAppStore.ts
│   ├── styles/             # Global styles
│   │   └── globals.css
│   ├── types/              # TypeScript type definitions
│   │   ├── config.ts
│   │   ├── generation.ts
│   │   ├── index.ts
│   │   └── project.ts
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   └── vite-env.d.ts       # Vite environment types
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── postcss.config.js       # PostCSS configuration
```

## Core Components

### Layout System
- **Layout.tsx**: Main layout wrapper with header, sidebar, and content area
- **Header.tsx**: Top navigation bar with theme toggle, system status, and user controls
- **Sidebar.tsx**: Navigation sidebar with collapsible menu items

### Page Components
- **StartupPage.tsx**: Dashboard with quick actions and system overview
- **TextToImagePage.tsx**: Interface for text-to-image generation
- **ImageToVideoPage.tsx**: Interface for image-to-video conversion
- **StoryboardPage.tsx**: Storyboard creation and management
- **ProjectPage.tsx**: Individual project management
- **ProjectsPage.tsx**: Project listing and organization
- **ConfigPage.tsx**: System configuration interface

### State Management

#### App Store (Zustand)
The application uses Zustand for centralized state management:

```typescript
interface AppState {
  // System state
  systemStatus: SystemStatus | null;
  config: Config | null;
  user: User | null;
  
  // UI state
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
  loading: LoadingState;
  error: ErrorState;
  
  // Notifications and modals
  toasts: Toast[];
  modals: Modal[];
  
  // Application settings
  settings: {
    autoSave: boolean;
    notifications: boolean;
    language: 'zh-CN' | 'en-US';
  };
}
```

#### Key Features
- **Persistent Storage**: Theme and user preferences persist across sessions
- **Real-time Updates**: System status and generation progress updates
- **Error Handling**: Centralized error state management
- **Loading States**: Global loading indicators with progress tracking

### Service Layer

#### API Client
- **apiClient.ts**: Axios-based HTTP client with interceptors
- **Request/Response Interceptors**: Authentication, logging, and error handling
- **File Upload Support**: Progress tracking for media uploads
- **Download Support**: File download with progress indication

#### Service Modules
- **configService.ts**: System configuration management
- **generationService.ts**: AI generation tasks (text-to-image, image-to-video)
- **projectService.ts**: Project CRUD operations

### Custom Hooks

#### Utility Hooks
- **useApi.ts**: Simplified API calling with loading and error states
- **useAsync.ts**: Generic async operation handling
- **useDebounce.ts**: Input debouncing for search and filters
- **useLocalStorage.ts**: Persistent local storage management

### Type System

Comprehensive TypeScript definitions for:
- **API Responses**: Standardized response formats
- **Generation Tasks**: Image and video generation parameters
- **Project Management**: Project structure and metadata
- **Configuration**: System and model configurations
- **UI Components**: Props and state interfaces

## Features

### Core Functionality
1. **Text-to-Image Generation**
   - Prompt input with optimization suggestions
   - Advanced parameter controls (size, steps, guidance)
   - Batch generation support
   - Real-time progress tracking

2. **Image-to-Video Conversion**
   - Image upload and preview
   - Video generation parameters
   - Progress monitoring with SSE
   - Result preview and download

3. **Storyboard Creation**
   - Script generation from themes
   - Scene-by-scene breakdown
   - Visual storyboard creation
   - Export capabilities

4. **Project Management**
   - Project creation and organization
   - File management and versioning
   - Export and sharing options
   - Project templates

### UI/UX Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Theme**: System preference detection with manual override
- **Real-time Notifications**: Toast notifications for user feedback
- **Progress Indicators**: Visual progress bars for long-running tasks
- **Error Boundaries**: Graceful error handling and recovery
- **Accessibility**: ARIA labels and keyboard navigation support

## Installation

### Prerequisites
- Node.js 16+ and npm/yarn
- Backend service running on port 3002

### Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Configuration**
   Create `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:3002
   ```

3. **Development Server**
   ```bash
   npm run dev
   ```
   Access at: http://localhost:5173

4. **Production Build**
   ```bash
   npm run build
   npm run preview
   ```

## Configuration

### Vite Configuration
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
});
```

### Tailwind Configuration
- Custom color palette for brand consistency
- Dark mode support with class-based strategy
- Custom component utilities
- Responsive breakpoints

## Usage Examples

### Text-to-Image Generation
```typescript
import { GenerationService } from '@/services/generationService';

const generateImage = async () => {
  const request: TextToImageRequest = {
    prompt: "A beautiful sunset over mountains",
    width: 512,
    height: 512,
    steps: 20,
    cfg_scale: 7.5,
    batch_size: 1
  };
  
  const result = await GenerationService.generateTextToImage(request);
  return result.data;
};
```

### State Management
```typescript
import { useAppStore, useAppActions } from '@/store/useAppStore';

const MyComponent = () => {
  const { theme, loading } = useAppStore();
  const { setTheme, setLoading } = useAppActions();
  
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };
  
  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      {/* Component content */}
    </div>
  );
};
```

## Development Guidelines

### Code Style
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Configured for React and TypeScript best practices
- **Prettier**: Consistent code formatting
- **Component Structure**: Functional components with hooks

### Best Practices
1. **Component Design**
   - Single responsibility principle
   - Props interface definitions
   - Error boundary implementation
   - Accessibility considerations

2. **State Management**
   - Centralized global state in Zustand store
   - Local state for component-specific data
   - Derived state using selectors

3. **API Integration**
   - Service layer abstraction
   - Error handling and retry logic
   - Loading state management
   - Response caching where appropriate

4. **Performance**
   - Code splitting with React.lazy
   - Image optimization and lazy loading
   - Debounced user inputs
   - Memoization for expensive calculations

### Testing
```bash
# Type checking
npm run check

# Linting
npm run lint

# Build verification
npm run build
```

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Verify backend service is running on port 3002
   - Check CORS configuration
   - Validate API base URL in environment variables

2. **Build Failures**
   - Clear node_modules and reinstall dependencies
   - Check TypeScript configuration
   - Verify all imports and exports

3. **Theme Issues**
   - Clear localStorage to reset theme preferences
   - Check Tailwind CSS configuration
   - Verify dark mode class application

4. **Performance Issues**
   - Enable React DevTools Profiler
   - Check for unnecessary re-renders
   - Optimize large lists with virtualization

### Debug Mode
Enable debug logging:
```typescript
// In development
if (import.meta.env.DEV) {
  console.log('Debug info:', data);
}
```

### Browser Compatibility
- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- ES2020 features support required
- CSS Grid and Flexbox support

## Contributing

When contributing to the frontend:
1. Follow the established code style and patterns
2. Add TypeScript types for new features
3. Update component documentation
4. Test across different browsers and screen sizes
5. Ensure accessibility compliance

The frontend is designed to be maintainable, scalable, and user-friendly, providing a solid foundation for the EasyVideo AI platform's user interface.
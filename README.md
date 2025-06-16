# Lola Dré Order System

A beautiful, production-ready login system built with React, TypeScript, and Tailwind CSS.

## Features

- Modern glassmorphism design with animated background
- Real-time email validation
- Secure password handling with show/hide toggle
- Loading states and error handling
- Responsive design for all devices
- Environment-specific configurations

## NPM Scripts

- `npm run dev` - Runs in Bolt environment
- `npm run dev:local` - Runs with your development configuration
- `npm run build:dev` - Builds for development environment
- `npm run build` - Builds for production
- `npm run lint` - Runs ESLint
- `npm run preview` - Preview production build

## Environment Configuration

The application supports multiple environments:

- **Bolt Environment**: Uses `.env.bolt` for development in Bolt
- **Local Development**: Uses `.env.dev` for your local development setup

### Environment Variables

Create a `.env.dev` file for your local development with the following variables:

```env
VITE_API_BASE_URL=https://your-api-domain.com
VITE_SHOPIFY_BASE_PATH=/your-base-path
VITE_APP_TITLE=Your App Title
VITE_ENVIRONMENT=development
```

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. For Bolt environment:
   ```bash
   npm run dev
   ```

3. For local development:
   ```bash
   npm run dev:local
   ```

## Build

- Development build: `npm run build:dev`
- Production build: `npm run build`

## Technology Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **Lucide React** - Beautiful icons
- **ESLint** - Code linting and formatting

## Design Features

- Glassmorphism UI with backdrop blur effects
- Animated gradient backgrounds
- Smooth transitions and hover states
- Responsive design with mobile-first approach
- Accessible form controls with proper labeling
- Loading states and error handling
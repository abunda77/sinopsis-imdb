# Movie Synopsis Finder - Source Code Structure

## Directory Structure

```
src/
├── components/     # React UI components
├── services/       # Business logic services (LLM, Database, Validation)
├── types/          # TypeScript type definitions and interfaces
├── hooks/          # Custom React hooks
├── context/        # React Context providers for state management
├── lib/            # Utility functions and helpers
├── test/           # Test setup and utilities
└── assets/         # Static assets (images, icons)
```

## Technology Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **shadcn/ui** for UI components
- **better-sqlite3** for local database
- **Vitest** for unit testing
- **fast-check** for property-based testing

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run lint` - Run ESLint

## Testing

The project uses Vitest for testing with the following setup:
- Test files should be placed next to the code they test with `.test.ts` or `.test.tsx` extension
- Property-based tests use fast-check library
- React component tests use @testing-library/react
- Test setup is in `src/test/setup.ts`

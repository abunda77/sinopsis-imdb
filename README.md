# Movie Synopsis Finder

Movie Synopsis Finder adalah aplikasi web berbasis React TypeScript yang memungkinkan pengguna mencari informasi film (sinopsis dan skor IMDb) menggunakan Large Language Model (LLM) yang kompatibel dengan OpenAI API. Aplikasi ini menyediakan fitur penyimpanan hasil pencarian ke database SQLite lokal dan kemampuan untuk mengelola riwayat pencarian.

## Features

- 🔍 Search movie information using LLM (synopsis and IMDb score)
- 💾 Save search results to local SQLite database
- 📋 View search history in sidebar
- 🔄 Retry searches to get updated information
- 🗑️ Delete saved results with confirmation
- 🎨 Modern UI with TailwindCSS and shadcn/ui
- ⚡ Fast and responsive interface
- 🔒 Secure API key management via environment variables

## Technology Stack

- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS + shadcn/ui
- **Database**: better-sqlite3
- **Testing**: Vitest + fast-check (property-based testing)
- **State Management**: React Context API

## Prerequisites

- Node.js 18+ and npm
- An API key for an OpenAI-compatible LLM service (OpenAI, Perplexity, Anthropic, etc.)

**Note**: For production deployment, the app includes a Node.js Express server to handle CORS issues with LLM APIs. See [DEPLOYMENT.md](./DEPLOYMENT.md) for details.

## Installation

### Step-by-Step Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd movie-synopsis-finder
```

2. **Install dependencies:**
```bash
npm install
```

This will install all required packages including:
- React and TypeScript
- Vite build tool
- TailwindCSS and shadcn/ui components
- better-sqlite3 for database operations
- Vitest and fast-check for testing

3. **Configure environment variables:**

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and add your API credentials (see Configuration section below for details)

4. **Verify installation:**

Run the tests to ensure everything is set up correctly:
```bash
npm test
```

5. **Start the development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

**For production deployment**, see the [Running the Application](#running-the-application) section and [DEPLOYMENT.md](./DEPLOYMENT.md) for instructions on using the production server.

## Configuration

### Environment Variables

The application requires the following environment variables to connect to the LLM API. These must be configured before running the application.

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and fill in your actual values:

```env
# Your API key for the LLM service (required)
VITE_API_KEY=your-api-key-here

# The model name to use for LLM requests (required)
VITE_MODEL_NAME=gpt-4

# Base URL for the API endpoint (optional)
VITE_API_BASE_URL=https://api.openai.com/v1
```

### Environment Variable Details

| Variable | Required | Description | Example Values |
|----------|----------|-------------|----------------|
| `VITE_API_KEY` | Yes | Your API key for the LLM service | `sk-...` (OpenAI), `pplx-...` (Perplexity) |
| `VITE_MODEL_NAME` | Yes | The model name to use for requests | `gpt-4`, `gpt-3.5-turbo`, `sonar`, `claude-3-opus` |
| `VITE_API_BASE_URL` | No | Base URL for the API endpoint | `https://api.openai.com/v1` (default), `https://api.perplexity.ai`, `https://api.anthropic.com/v1` |

### Supported LLM Providers

The application works with any OpenAI-compatible API. Here are some examples:

**OpenAI:**
```env
VITE_API_KEY=sk-your-openai-key
VITE_MODEL_NAME=gpt-4
VITE_API_BASE_URL=https://api.openai.com/v1
```

**Perplexity AI:**
```env
VITE_API_KEY=pplx-your-perplexity-key
VITE_MODEL_NAME=sonar
VITE_API_BASE_URL=https://api.perplexity.ai
```

**Anthropic Claude (via OpenAI-compatible endpoint):**
```env
VITE_API_KEY=sk-ant-your-anthropic-key
VITE_MODEL_NAME=claude-3-opus-20240229
VITE_API_BASE_URL=https://api.anthropic.com/v1
```

### Configuration Errors

If the API key or model name is missing, the application will display a configuration error message on startup. Make sure all required environment variables are set before running the application.

## Running the Application

### Development Mode

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

In development mode, Vite's built-in proxy handles API requests to avoid CORS issues.

### Production Build

Build the application for production:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

**Important**: In production, the app uses a Node.js Express server (`server.js`) that:
- Serves the built static files from the `dist` folder
- Proxies API requests to avoid CORS issues with the Perplexity API
- Handles SPA routing for client-side navigation

### CORS Handling

The application handles CORS differently in development and production:

**Development Mode:**
- Vite's dev server proxies `/api` requests to the LLM API
- Configured in `vite.config.ts`
- No CORS issues because the proxy server makes the actual API calls

**Production Mode:**
- Express server (`server.js`) proxies `/api` requests
- Frontend always calls `/api/chat/completions` (relative path)
- The proxy server adds proper headers and forwards requests to the LLM API
- No CORS issues because requests come from the server, not the browser

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Running Tests

The project includes both unit tests and property-based tests using Vitest and fast-check.

### Test Commands

Run all tests once:
```bash
npm test
```

Run tests in watch mode (automatically re-runs on file changes):
```bash
npm run test:watch
```

Run tests with UI interface:
```bash
npm run test:ui
```

### Test Structure

The project uses two complementary testing approaches:

1. **Unit Tests**: Verify specific examples, edge cases, and component behavior
   - Located alongside source files with `.test.ts` or `.test.tsx` extension
   - Test specific scenarios and integration points

2. **Property-Based Tests**: Verify universal properties across many random inputs
   - Use fast-check library to generate test data
   - Each property test runs 100+ iterations with random inputs
   - Tagged with property numbers from the design document
   - Validate correctness properties like round-trip consistency, invariants, and error handling

### Running Specific Tests

Run tests for a specific file:
```bash
npm test -- src/services/database.test.ts
```

Run tests matching a pattern:
```bash
npm test -- --grep "Property"
```

## Project Structure

```
movie-synopsis-finder/
├── src/
│   ├── components/        # React components
│   │   ├── SearchForm.tsx
│   │   ├── ResultDisplay.tsx
│   │   ├── Sidebar.tsx
│   │   └── ui/           # shadcn/ui components
│   ├── context/          # React Context providers
│   │   ├── AppContext.tsx
│   │   ├── DatabaseContext.tsx
│   │   └── ConfigContext.tsx
│   ├── services/         # Business logic
│   │   ├── llm.ts       # LLM API integration
│   │   ├── database.ts  # SQLite operations
│   │   └── validation.ts
│   ├── types/           # TypeScript interfaces
│   │   ├── models.ts
│   │   ├── api.ts
│   │   └── validation.ts
│   ├── lib/             # Utilities
│   │   ├── config.ts    # Environment configuration
│   │   └── utils.ts
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment variables template
└── README.md
```

## Screenshots

> **Note**: Screenshots will be added in a future update. The application features a clean, modern interface with:
> - A search bar at the top for entering movie titles
> - Main content area displaying movie synopsis and IMDb score
> - Sidebar showing saved search history
> - Action buttons (Save, Retry, Delete) with loading states
> - Responsive layout that adapts to different screen sizes

## Usage

### Quick Start Guide

1. **Search for a movie**: Enter a movie title in the search box and click Search or press Enter
2. **View results**: The synopsis and IMDb score will be displayed
3. **Save results**: Click the Save button to store the result in the database
4. **View history**: Saved results appear in the sidebar
5. **Retry search**: Click Retry to get updated information for the same movie
6. **Delete results**: Click Delete on any sidebar entry (confirmation required)

## Features in Detail

### Search
- Enter any movie title to search
- Empty or whitespace-only titles are rejected
- Loading indicator shown during search
- Error messages displayed if search fails
- Results include movie synopsis (in Indonesian) and IMDb score

### Save
- Save search results to local SQLite database
- Duplicate prevention (same movie title cannot be saved twice)
- Confirmation message on successful save
- Sidebar automatically updates with new entry
- Database file (`movie-synopsis.db`) is created automatically in the project root

### Retry
- Get fresh information for the same movie
- Works whether result is saved or not
- Replaces current display with new result
- Useful for getting updated information or different LLM responses

### Sidebar
- Shows all saved movie results
- Click any entry to view full details
- Empty state message when no results
- Delete button with confirmation dialog
- Results sorted by save date (newest first)

### Database
- SQLite database stored locally as `movie-synopsis.db`
- Automatic schema creation on first run
- Stores: movie title, synopsis, IMDb score, timestamps
- Duplicate prevention by movie title
- No external database server required

## Troubleshooting

### Configuration Error on Startup
**Problem**: Application shows "Configuration error" message

**Solution**: 
- Make sure `.env` file exists in the project root
- Verify it contains valid `VITE_API_KEY` and `VITE_MODEL_NAME` values
- Restart the development server after changing `.env`
- Check that variable names start with `VITE_` prefix (required by Vite)

### Authentication Error
**Problem**: "Authentication failed" or "Invalid API key" error

**Solution**: 
- Verify your API key is correct and has not expired
- Check that you're using the correct base URL for your provider
- Ensure there are no extra spaces in the API key
- Test your API key with a curl command to verify it works

### Database Errors
**Problem**: "Failed to save" or "Failed to delete" errors

**Solution**: 
- Check file system permissions (application needs write access)
- Ensure the project directory is not read-only
- Try deleting `movie-synopsis.db` and restarting (will lose saved data)
- Check disk space availability

### Network Errors
**Problem**: "Network error" or "Request timeout"

**Solution**: 
- Check your internet connection
- Verify the API base URL is correct and the service is accessible
- Check if your firewall or antivirus is blocking the connection
- Try a different network or disable VPN if applicable

### CORS Errors in Production
**Problem**: "Access to fetch has been blocked by CORS policy" error

**Solution**: 
- Make sure you're using the production server (`npm start`) instead of `npm run preview`
- The Express server in `server.js` handles CORS by proxying requests
- Verify `server.js` is running and serving the app
- Check that API requests are going to `/api/chat/completions` (relative path)
- For custom deployments, ensure your server proxies `/api` requests correctly

### Build Errors
**Problem**: Build fails with TypeScript or dependency errors

**Solution**:
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Clear Vite cache: `rm -rf node_modules/.vite`
- Ensure you're using Node.js 18 or higher: `node --version`
- Update dependencies: `npm update`

## FAQ

### Q: Can I use this with other LLM providers besides OpenAI?
**A**: Yes! The application works with any OpenAI-compatible API. Just set the appropriate `VITE_API_BASE_URL` and use the provider's API key and model name.

### Q: Where is the database stored?
**A**: The SQLite database file (`movie-synopsis.db`) is stored in the project root directory. You can back it up or delete it as needed.

### Q: Can I change the language of the synopsis?
**A**: Currently, the application is configured to return synopses in Indonesian. To change this, modify the system prompt in `src/services/llm.ts`.

### Q: How many movies can I save?
**A**: There's no hard limit. The SQLite database can handle thousands of entries efficiently.

### Q: Does this work offline?
**A**: No, an internet connection is required to query the LLM API. However, saved results can be viewed offline.

### Q: Can I export my saved movies?
**A**: Currently, there's no export feature, but you can directly access the SQLite database file using any SQLite browser tool.

### Q: Why do I get different results when I retry?
**A**: LLMs can produce different responses for the same query. This is normal behavior and can be useful for getting alternative perspectives or updated information.

## Architecture

The application follows a clean architecture with clear separation of concerns:

### Layers

1. **UI Layer** (`src/components/`)
   - React components for user interface
   - Uses TailwindCSS and shadcn/ui for styling
   - Manages local component state and user interactions

2. **Business Logic Layer** (`src/services/`)
   - `llm.ts`: LLM API integration and response parsing
   - `database.ts`: SQLite operations (CRUD)
   - `validation.ts`: Input validation and data integrity

3. **State Management** (`src/context/`)
   - React Context API for global state
   - `AppContext`: Current result, loading, errors
   - `DatabaseContext`: Saved results and database operations
   - `ConfigContext`: API configuration

4. **Data Layer**
   - SQLite database for persistence
   - TypeScript interfaces for type safety (`src/types/`)

### Design Principles

- **Type Safety**: Full TypeScript coverage with strict mode
- **Separation of Concerns**: Clear boundaries between UI, logic, and data
- **Error Handling**: Comprehensive error handling at all layers
- **Testability**: Services designed for easy testing with mocks
- **Accessibility**: Keyboard navigation and ARIA labels
- **Responsiveness**: Mobile-first design with TailwindCSS

## Development

### Adding New Components

Components should be placed in `src/components/` and follow the existing patterns:
- Use TypeScript for type safety
- Use TailwindCSS for styling
- Use shadcn/ui components where appropriate
- Include prop interfaces
- Add corresponding test files (`.test.tsx`)

### Testing Guidelines

- Write unit tests for specific examples and edge cases
- Write property-based tests for universal properties
- Mock external dependencies (LLM API, database) in tests
- Aim for high coverage of business logic
- Each property test should run at least 100 iterations
- Tag property tests with design document references

### Code Style

- Use functional components with hooks
- Prefer composition over inheritance
- Keep components small and focused
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Follow ESLint rules (run `npm run lint`)

## Property-Based Testing

This project uses property-based testing (PBT) with fast-check to ensure correctness. Unlike traditional unit tests that check specific examples, property tests verify that certain properties hold true across many randomly generated inputs.

### Why Property-Based Testing?

- **Broader Coverage**: Tests hundreds of random inputs automatically
- **Edge Case Discovery**: Finds edge cases you might not think of
- **Specification Validation**: Ensures code matches the formal specification
- **Regression Prevention**: Random testing catches subtle bugs

### Example Properties Tested

1. **Round-trip consistency**: Saving and loading data preserves all fields
2. **Duplicate prevention**: Same movie title cannot be saved twice
3. **Error handling**: Invalid inputs are properly rejected
4. **State preservation**: Errors don't corrupt application state
5. **UI consistency**: Loading states are shown during operations

Each property test runs 100+ iterations with randomly generated data to ensure robustness.

## Contributing

Contributions are welcome! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Run linter: `npm run lint`
6. Commit your changes: `git commit -m "Add your feature"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

### Contribution Guidelines

- Follow the existing code style and architecture
- Add tests for new features (both unit and property tests)
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Write clear commit messages
- Keep PRs focused on a single feature or fix

### Areas for Contribution

- Additional LLM provider integrations
- Export/import functionality for saved movies
- Advanced search and filtering in sidebar
- Batch operations (delete multiple, export selected)
- UI themes and customization
- Performance optimizations
- Additional language support

## License

MIT License - feel free to use this project for learning or as a base for your own applications.

## Acknowledgments

- Built with [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Property-based testing with [fast-check](https://fast-check.dev/)
- Database powered by [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)

## Support

If you encounter any issues or have questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [FAQ](#faq)
3. Open an issue on GitHub with detailed information about your problem

---

**Note**: This application is designed for educational and personal use. Make sure to comply with your LLM provider's terms of service and usage limits.

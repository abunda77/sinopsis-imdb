# Design Document - Movie Synopsis Finder

## Overview

Movie Synopsis Finder adalah aplikasi Single Page Application (SPA) yang dibangun dengan React dan TypeScript. Aplikasi ini mengintegrasikan LLM (Large Language Model) yang kompatibel dengan OpenAI API untuk menghasilkan sinopsis film dan skor IMDb berdasarkan input judul film dari user. Data hasil pencarian disimpan dalam SQLite database lokal dan ditampilkan dalam sidebar untuk akses cepat.

Arsitektur aplikasi mengikuti prinsip separation of concerns dengan memisahkan layer presentasi (UI components), business logic (services), dan data persistence (database operations). Aplikasi menggunakan React hooks untuk state management dan TailwindCSS + shadcn/ui untuk styling yang konsisten dan modern.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              UI Layer (Components)                     │  │
│  │  - SearchForm                                          │  │
│  │  - ResultDisplay                                       │  │
│  │  - Sidebar                                             │  │
│  │  - ActionButtons (Save, Retry, Delete)                │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↕                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Business Logic Layer (Services)              │  │
│  │  - LLMService (OpenAI API integration)                │  │
│  │  - DatabaseService (SQLite operations)                │  │
│  │  - ValidationService                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↕                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Data Layer                                │  │
│  │  - SQLite Database (local storage)                    │  │
│  │  - Environment Configuration                           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↕
              ┌───────────────────────┐
              │   External LLM API    │
              │  (OpenAI-compatible)  │
              └───────────────────────┘
```

### Technology Stack

- **Frontend Framework**: React 18+ with TypeScript
- **Build Tool**: Vite (for fast development and optimized builds)
- **Styling**: TailwindCSS + shadcn/ui components
- **Database**: better-sqlite3 (synchronous SQLite for Node.js/Electron) or sql.js (for browser-based SQLite)
- **HTTP Client**: fetch API or axios for LLM API calls
- **State Management**: React hooks (useState, useEffect, useContext)
- **Type System**: TypeScript 5+

### Deployment Architecture

Given the requirement for SQLite database, the application will need to run in an environment that supports file system access:

**Option 1: Electron App** (Recommended)
- Desktop application with full file system access
- Uses better-sqlite3 for native SQLite performance
- Can be packaged for Windows, macOS, and Linux

**Option 2: Browser with sql.js**
- Pure web application using sql.js (SQLite compiled to WebAssembly)
- Database stored in browser's IndexedDB or localStorage
- No installation required but limited to browser storage

For this design, we'll target **Electron** as it provides the best SQLite integration and user experience.

## Components and Interfaces

### UI Components

#### 1. App Component
Main application container that manages global state and layout.

```typescript
interface AppState {
  currentResult: MovieResult | null;
  savedResults: MovieResult[];
  isLoading: boolean;
  error: string | null;
  config: AppConfig;
}
```

#### 2. SearchForm Component
Handles movie title input and search submission.

```typescript
interface SearchFormProps {
  onSearch: (title: string) => Promise<void>;
  isLoading: boolean;
}
```

#### 3. ResultDisplay Component
Displays the current search result with action buttons.

```typescript
interface ResultDisplayProps {
  result: MovieResult | null;
  isLoading: boolean;
  onSave: () => Promise<void>;
  onRetry: () => Promise<void>;
  isSaved: boolean;
}
```

#### 4. Sidebar Component
Lists all saved movie results with delete functionality.

```typescript
interface SidebarProps {
  results: MovieResult[];
  onSelect: (result: MovieResult) => void;
  onDelete: (id: string) => Promise<void>;
  selectedId: string | null;
}
```

#### 5. ActionButtons Component
Reusable button components with consistent styling.

```typescript
interface ActionButtonProps {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}
```

### Service Layer

#### 1. LLMService
Handles communication with OpenAI-compatible LLM API.

```typescript
interface LLMService {
  searchMovie(title: string): Promise<MovieInfo>;
  configure(apiKey: string, model: string, baseUrl?: string): void;
}

interface LLMRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

interface LLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}
```

#### 2. DatabaseService
Manages SQLite database operations.

```typescript
interface DatabaseService {
  initialize(): Promise<void>;
  saveResult(result: MovieResult): Promise<void>;
  getAllResults(): Promise<MovieResult[]>;
  getResultById(id: string): Promise<MovieResult | null>;
  deleteResult(id: string): Promise<void>;
  resultExists(title: string): Promise<boolean>;
}
```

#### 3. ValidationService
Validates user input and data integrity.

```typescript
interface ValidationService {
  validateMovieTitle(title: string): ValidationResult;
  validateMovieInfo(info: MovieInfo): ValidationResult;
  validateConfig(config: AppConfig): ValidationResult;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
```

## Data Models

### MovieResult
Represents a complete movie search result stored in the database.

```typescript
interface MovieResult {
  id: string;              // UUID
  title: string;           // Movie title
  synopsis: string;        // Movie synopsis from LLM
  imdbScore: number;       // IMDb score (0-10)
  searchedAt: Date;        // Timestamp of search
  savedAt: Date | null;    // Timestamp when saved (null if not saved)
}
```

### MovieInfo
Represents the parsed information from LLM response.

```typescript
interface MovieInfo {
  synopsis: string;
  imdbScore: number;
}
```

### AppConfig
Application configuration from environment variables.

```typescript
interface AppConfig {
  apiKey: string;
  modelName: string;
  apiBaseUrl: string;      // Default: https://api.openai.com/v1
}
```

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS movie_results (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  synopsis TEXT NOT NULL,
  imdb_score REAL NOT NULL,
  searched_at TEXT NOT NULL,
  saved_at TEXT NOT NULL,
  CHECK (imdb_score >= 0 AND imdb_score <= 10)
);

CREATE INDEX IF NOT EXISTS idx_title ON movie_results(title);
CREATE INDEX IF NOT EXISTS idx_saved_at ON movie_results(saved_at DESC);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing all testable properties from the prework analysis, several opportunities for consolidation emerge:

**Consolidations:**
- Properties 1.3 and 3.3 (loading indicators) can be combined into one property about loading state display
- Properties 2.1 and 2.5 (save operation and sidebar update) can be combined into one comprehensive save property
- Properties 5.1 and 5.2 (delete from database and sidebar) can be combined into one comprehensive delete property
- Properties 1.2 can be enhanced to include round-trip validation for LLM response parsing

**Redundancies Eliminated:**
- Property 2.4 (confirmation message) is subsumed by property 2.1 (successful save behavior)
- Property 3.2 (result replacement) is implied by property 3.1 (retry initiates new search)

### Search and LLM Integration Properties

**Property 1: Search request contains movie title**
*For any* non-empty movie title, when a user submits a search, the LLM request should contain that exact movie title in the prompt.
**Validates: Requirements 1.1**

**Property 2: LLM response parsing extracts all fields**
*For any* valid LLM response containing synopsis and IMDb score, parsing that response should correctly extract both the synopsis text and numeric IMDb score.
**Validates: Requirements 1.2**

**Property 3: Empty title validation**
*For any* string composed entirely of whitespace or empty string, attempting to search should be rejected and no LLM request should be initiated.
**Validates: Requirements 1.5**

**Property 4: Loading state visibility**
*For any* search or retry operation in progress, the UI should display a loading indicator until the operation completes.
**Validates: Requirements 1.3, 3.3**

**Property 5: Error display on LLM failure**
*For any* LLM request that fails (network error, invalid response, timeout), an error message should be displayed to the user.
**Validates: Requirements 1.4**

### Database Persistence Properties

**Property 6: Save operation persists all fields**
*For any* valid movie result, when saved to the database, querying by title should return a result with identical title, synopsis, IMDb score, and a valid timestamp.
**Validates: Requirements 2.1**

**Property 7: Duplicate prevention**
*For any* movie title already saved in the database, attempting to save another result with the same title should be rejected.
**Validates: Requirements 2.2**

**Property 8: Save updates sidebar**
*For any* movie result that is successfully saved, the sidebar should immediately include an entry for that movie without requiring a page refresh.
**Validates: Requirements 2.5**

**Property 9: Save error preserves state**
*For any* save operation that fails due to database error, the current display state should remain unchanged and an error message should be shown.
**Validates: Requirements 2.3**

### Retry Operation Properties

**Property 10: Retry uses same title**
*For any* movie result currently displayed, clicking retry should initiate a new LLM request with the same movie title as the original search.
**Validates: Requirements 3.1**

**Property 11: Retry works regardless of save status**
*For any* movie result (whether saved or unsaved), the retry button should be enabled and functional.
**Validates: Requirements 3.4**

### Sidebar and Navigation Properties

**Property 12: Initial load displays all saved results**
*For any* set of movie results in the database, when the application loads, all results should appear in the sidebar.
**Validates: Requirements 4.1**

**Property 13: Sidebar click displays details**
*For any* saved entry in the sidebar, clicking that entry should display its complete details (title, synopsis, IMDb score) in the main content area.
**Validates: Requirements 4.2**

**Property 14: Sidebar entry shows title and preview**
*For any* saved movie result displayed in the sidebar, the entry should contain the movie title and a preview of the synopsis.
**Validates: Requirements 4.3**

### Delete Operation Properties

**Property 15: Delete removes from database and sidebar**
*For any* saved movie result, when deleted, that result should be removed from both the SQLite database and the sidebar display.
**Validates: Requirements 5.1, 5.2**

**Property 16: Delete requires confirmation**
*For any* delete operation initiated by the user, a confirmation dialog should appear before the deletion is executed.
**Validates: Requirements 5.5**

**Property 17: Delete error preserves state**
*For any* delete operation that fails due to database error, the sidebar should remain unchanged and an error message should be displayed.
**Validates: Requirements 5.3**

**Property 18: Deleting active result clears display**
*For any* movie result currently displayed in the main content area, if that result is deleted, the main content area should be cleared or show a default empty state.
**Validates: Requirements 5.4**

### Configuration Properties

**Property 19: Missing configuration shows error**
*For any* missing required configuration value (API key or model name), the application should display a configuration error message on initialization.
**Validates: Requirements 6.3**

**Property 20: LLM requests use configured values**
*For any* LLM request made by the application, the request should use the API key and model name from the application configuration.
**Validates: Requirements 6.4**

**Property 21: Authentication error shows clear message**
*For any* LLM API response with authentication error status, the application should display an error message indicating invalid credentials.
**Validates: Requirements 6.5**

### UI Responsiveness Properties

**Property 22: Responsive layout adaptation**
*For any* viewport width (mobile, tablet, desktop), the application layout should adapt appropriately with sidebar and main content remaining accessible.
**Validates: Requirements 7.3**

**Property 23: Interactive element feedback**
*For any* interactive element (button, link, input), hovering or focusing that element should trigger a visible style change.
**Validates: Requirements 7.5**

## Error Handling

### Error Categories

1. **Network Errors**
   - LLM API unreachable
   - Timeout during API calls
   - Network connectivity issues
   
   **Handling**: Display user-friendly error message, allow retry, log technical details for debugging

2. **API Errors**
   - Authentication failures (401)
   - Rate limiting (429)
   - Invalid requests (400)
   - Server errors (500)
   
   **Handling**: Parse error response, display specific error message, suggest corrective actions

3. **Database Errors**
   - Database initialization failure
   - Write operation failures
   - Constraint violations (duplicates)
   - Disk space issues
   
   **Handling**: Display error message, preserve current state, log error details, attempt recovery

4. **Validation Errors**
   - Empty movie title
   - Invalid LLM response format
   - Missing configuration
   
   **Handling**: Display validation message inline, prevent invalid operations, guide user to correct input

5. **Parsing Errors**
   - Malformed LLM response
   - Missing required fields
   - Invalid data types
   
   **Handling**: Display error message, log raw response for debugging, allow retry

### Error Recovery Strategies

- **Automatic Retry**: For transient network errors, implement exponential backoff
- **State Preservation**: Always maintain UI state during error conditions
- **User Guidance**: Provide actionable error messages with suggested next steps
- **Graceful Degradation**: If database fails, allow search functionality to continue without persistence
- **Error Logging**: Log all errors with context for debugging and monitoring

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Component Tests**
   - SearchForm renders correctly and handles input
   - ResultDisplay shows correct data format
   - Sidebar renders empty state when no results
   - Action buttons are disabled/enabled appropriately

2. **Service Tests**
   - LLMService formats requests correctly
   - DatabaseService handles SQL operations
   - ValidationService catches invalid inputs

3. **Integration Tests**
   - Search flow from input to display
   - Save flow from result to database to sidebar
   - Delete flow with confirmation

4. **Edge Cases**
   - Empty database on first load (4.4)
   - Very long movie titles
   - Special characters in titles
   - IMDb scores at boundaries (0, 10)

### Property-Based Testing

Property-based testing will verify universal properties across all inputs using **fast-check** library for TypeScript/JavaScript.

**Configuration:**
- Each property test MUST run a minimum of 100 iterations
- Each test MUST be tagged with a comment referencing the design document property
- Tag format: `**Feature: movie-synopsis-finder, Property {number}: {property_text}**`
- Each correctness property MUST be implemented by a SINGLE property-based test

**Test Categories:**

1. **Search Properties** (Properties 1, 2, 3, 4, 5)
   - Generate random movie titles and verify search behavior
   - Generate random LLM responses and verify parsing
   - Generate invalid inputs and verify rejection

2. **Database Properties** (Properties 6, 7, 8, 9)
   - Generate random movie results and verify persistence
   - Test duplicate detection across various titles
   - Verify sidebar synchronization

3. **Retry Properties** (Properties 10, 11)
   - Generate random results and verify retry behavior
   - Test retry in various states

4. **Navigation Properties** (Properties 12, 13, 14)
   - Generate random sets of saved results
   - Verify sidebar display and navigation

5. **Delete Properties** (Properties 15, 16, 17, 18)
   - Generate random results to delete
   - Verify deletion behavior and UI updates

6. **Configuration Properties** (Properties 19, 20, 21)
   - Generate various configuration scenarios
   - Verify error handling and usage

7. **UI Properties** (Properties 22, 23)
   - Test responsive behavior at various viewport sizes
   - Verify interactive feedback

**Property Test Implementation Requirements:**
- Use fast-check's `fc.property()` for defining properties
- Use appropriate generators: `fc.string()`, `fc.integer()`, `fc.record()`, etc.
- Configure minimum 100 runs: `fc.assert(fc.property(...), { numRuns: 100 })`
- Tag each test with the property number from this design document
- Mock external dependencies (LLM API) for deterministic testing
- Use in-memory SQLite for database tests

## Implementation Notes

### LLM Prompt Engineering

The prompt sent to the LLM should be structured to reliably extract synopsis and IMDb score:

```
System: You are a movie information assistant. When given a movie title, respond with a JSON object containing the movie's synopsis and IMDb score. And translate to Indonesian language.

User: {movie_title}

Expected Response Format:
{
  "synopsis": "Brief movie synopsis here",
  "imdbScore": 7.5
}
```

### Database Connection Management

- Initialize database on application startup
- Use connection pooling for better performance
- Implement proper error handling for database operations
- Close connections gracefully on application shutdown

### State Management

Use React Context API for global state:
- `AppContext`: Current result, loading state, error state
- `DatabaseContext`: Saved results, database operations
- `ConfigContext`: API configuration

### Performance Considerations

- Debounce search input to prevent excessive API calls
- Cache LLM responses to avoid duplicate requests
- Use virtual scrolling for large sidebar lists
- Lazy load movie details when sidebar item is clicked

### Security Considerations

- Store API keys securely (environment variables, never in code)
- Validate and sanitize all user inputs
- Implement rate limiting for API calls
- Use HTTPS for all external API communications
- Sanitize LLM responses before rendering to prevent XSS

### Accessibility

- Implement keyboard navigation for all interactive elements
- Use semantic HTML elements
- Provide ARIA labels for screen readers
- Ensure sufficient color contrast
- Support focus indicators
- Provide loading announcements for screen readers

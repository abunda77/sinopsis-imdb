# Requirements Document

## Introduction

Movie Synopsis Finder adalah aplikasi web berbasis React TypeScript yang memungkinkan pengguna mencari informasi film (sinopsis dan skor IMDb) menggunakan Large Language Model (LLM) yang kompatibel dengan OpenAI API. Aplikasi ini menyediakan fitur penyimpanan hasil pencarian ke database SQLite lokal, menampilkan riwayat pencarian di sidebar, dan kemampuan untuk mengelola (retry dan delete) hasil pencarian. Interface pengguna dibangun menggunakan TailwindCSS dan shadcn/ui untuk pengalaman yang modern dan responsif.

## Glossary

- **Movie Synopsis Finder**: Sistem aplikasi web yang menjadi subjek dari dokumen requirements ini
- **LLM (Large Language Model)**: Model AI yang digunakan untuk menghasilkan sinopsis film dan informasi IMDb
- **OpenAI-compatible API**: Interface API yang mengikuti format OpenAI untuk komunikasi dengan LLM
- **SQLite Database**: Database lokal berbasis file untuk menyimpan riwayat pencarian
- **Sidebar**: Panel samping pada interface yang menampilkan daftar riwayat pencarian
- **Search Result**: Objek data yang berisi judul film, sinopsis, dan skor IMDb
- **User**: Pengguna akhir dari aplikasi Movie Synopsis Finder

## Requirements

### Requirement 1

**User Story:** Sebagai user, saya ingin mencari informasi film berdasarkan judul, sehingga saya dapat mengetahui sinopsis dan skor IMDb film tersebut.

#### Acceptance Criteria

1. WHEN a user enters a movie title and submits the search, THEN the Movie Synopsis Finder SHALL send a request to the LLM with the movie title
2. WHEN the LLM returns a response, THEN the Movie Synopsis Finder SHALL extract and display the movie synopsis and IMDb score
3. WHEN the search is in progress, THEN the Movie Synopsis Finder SHALL display a loading indicator to the user
4. WHEN the LLM fails to return valid data, THEN the Movie Synopsis Finder SHALL display an error message to the user
5. THE Movie Synopsis Finder SHALL validate that the movie title input is not empty before initiating a search

### Requirement 2

**User Story:** Sebagai user, saya ingin menyimpan hasil pencarian film ke database, sehingga saya dapat mengakses informasi tersebut di kemudian hari tanpa perlu mencari ulang.

#### Acceptance Criteria

1. WHEN a user clicks the Save button after a successful search, THEN the Movie Synopsis Finder SHALL store the search result in the SQLite Database with movie title, synopsis, IMDb score, and timestamp
2. WHEN a search result is already saved in the database, THEN the Movie Synopsis Finder SHALL prevent duplicate entries for the same movie title
3. WHEN the save operation fails, THEN the Movie Synopsis Finder SHALL display an error message and maintain the current display state
4. WHEN a search result is successfully saved, THEN the Movie Synopsis Finder SHALL display a confirmation message to the user
5. WHEN a search result is saved, THEN the Movie Synopsis Finder SHALL update the sidebar to include the newly saved entry

### Requirement 3

**User Story:** Sebagai user, saya ingin melakukan pencarian ulang untuk film yang sama, sehingga saya dapat mendapatkan informasi terbaru atau hasil yang berbeda dari LLM.

#### Acceptance Criteria

1. WHEN a user clicks the Retry button, THEN the Movie Synopsis Finder SHALL initiate a new search request with the same movie title
2. WHEN the retry operation completes successfully, THEN the Movie Synopsis Finder SHALL replace the current displayed result with the new result
3. WHEN the retry operation is in progress, THEN the Movie Synopsis Finder SHALL display a loading indicator
4. THE Movie Synopsis Finder SHALL allow retry operations regardless of whether the current result is saved or not

### Requirement 4

**User Story:** Sebagai user, saya ingin melihat riwayat pencarian film yang telah saya simpan di sidebar, sehingga saya dapat dengan mudah mengakses kembali informasi film yang pernah saya cari.

#### Acceptance Criteria

1. WHEN the application loads, THEN the Movie Synopsis Finder SHALL retrieve all saved search results from the SQLite Database and display them in the sidebar
2. WHEN a user clicks on a saved entry in the sidebar, THEN the Movie Synopsis Finder SHALL display the full details of that search result in the main content area
3. WHEN the sidebar contains saved entries, THEN the Movie Synopsis Finder SHALL display each entry with the movie title and a preview of information
4. WHEN the database is empty, THEN the Movie Synopsis Finder SHALL display an empty state message in the sidebar
5. WHEN a new search result is saved, THEN the Movie Synopsis Finder SHALL automatically update the sidebar list without requiring a page refresh

### Requirement 5

**User Story:** Sebagai user, saya ingin menghapus riwayat pencarian film dari database, sehingga saya dapat mengelola dan membersihkan data yang tidak lagi saya perlukan.

#### Acceptance Criteria

1. WHEN a user clicks the Delete button on a sidebar entry, THEN the Movie Synopsis Finder SHALL remove that entry from the SQLite Database
2. WHEN a delete operation completes successfully, THEN the Movie Synopsis Finder SHALL remove the entry from the sidebar display
3. WHEN a delete operation fails, THEN the Movie Synopsis Finder SHALL display an error message and maintain the current sidebar state
4. WHEN the currently displayed search result is deleted, THEN the Movie Synopsis Finder SHALL clear the main content area or display a default state
5. WHEN a user initiates a delete operation, THEN the Movie Synopsis Finder SHALL request confirmation before proceeding with the deletion

### Requirement 6

**User Story:** Sebagai user, saya ingin aplikasi terhubung dengan LLM menggunakan konfigurasi yang fleksibel, sehingga saya dapat menggunakan berbagai provider LLM yang kompatibel dengan OpenAI API.

#### Acceptance Criteria

1. WHEN the application initializes, THEN the Movie Synopsis Finder SHALL read the API key from environment variables
2. WHEN the application initializes, THEN the Movie Synopsis Finder SHALL read the model name from environment variables
3. WHEN the API key or model name is missing, THEN the Movie Synopsis Finder SHALL display a configuration error message to the user
4. THE Movie Synopsis Finder SHALL use the configured API key and model for all LLM requests
5. WHEN the LLM API returns an authentication error, THEN the Movie Synopsis Finder SHALL display a clear error message indicating invalid credentials

### Requirement 7

**User Story:** Sebagai user, saya ingin interface aplikasi yang menarik dan responsif, sehingga saya dapat menggunakan aplikasi dengan nyaman di berbagai ukuran layar.

#### Acceptance Criteria

1. THE Movie Synopsis Finder SHALL implement all UI components using TailwindCSS for styling
2. THE Movie Synopsis Finder SHALL use shadcn/ui components for consistent design patterns
3. WHEN the application is viewed on different screen sizes, THEN the Movie Synopsis Finder SHALL adapt the layout responsively
4. THE Movie Synopsis Finder SHALL display the sidebar and main content area in a clear and organized layout
5. WHEN interactive elements are hovered or focused, THEN the Movie Synopsis Finder SHALL provide visual feedback to the user

### Requirement 8

**User Story:** Sebagai developer, saya ingin aplikasi dibangun dengan TypeScript dan React, sehingga kode lebih maintainable dan type-safe.

#### Acceptance Criteria

1. THE Movie Synopsis Finder SHALL be implemented using React framework with TypeScript
2. THE Movie Synopsis Finder SHALL define TypeScript interfaces for all data models including search results and database entries
3. THE Movie Synopsis Finder SHALL use proper TypeScript typing for all component props and function parameters
4. THE Movie Synopsis Finder SHALL handle type checking at compile time to prevent runtime type errors
5. THE Movie Synopsis Finder SHALL organize code into reusable React components with clear responsibilities

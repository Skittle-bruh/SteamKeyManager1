# Steam Inventory Parser

## Overview

A Steam inventory tracking application that monitors CS2 case inventories across multiple Steam accounts and provides real-time market pricing analysis. The application enables users to manage Steam accounts, parse inventories for Counter-Strike 2 cases, fetch current market prices, and calculate total values across all tracked accounts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: React Context API for global app state, React Query for server state
- **Routing**: Client-side routing with section-based navigation (dashboard, accounts, settings, logs)
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Type Safety**: TypeScript throughout with shared schema definitions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **API Design**: RESTful endpoints with proper error handling and validation
- **File Structure**: Modular separation with server, client, and shared directories

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless with connection pooling
- **ORM**: Drizzle ORM with automatic migrations and type generation
- **Schema**: Normalized tables for accounts, cases, settings, logs, and users
- **Data Types**: Proper typing for Steam IDs, market data, and pricing information

### Authentication and Authorization
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **Steam Integration**: Steam Web API for account resolution and inventory access
- **Rate Limiting**: Intelligent request management to comply with Steam API limits
- **User Agent Rotation**: Multiple user agents to appear more human-like

### Core Business Logic
- **Steam Parser**: Handles Steam ID resolution, inventory fetching, and case filtering
- **Market Price Service**: Fetches real-time pricing from Steam Community Market
- **Request Manager**: Implements rate limiting with random delays (2-5 seconds) and Steam 2025 inventory limits
- **Caching Strategy**: 2-hour cache for inventory data, 24-hour cache for market prices
- **Data Processing**: Filters inventory items to identify only CS2 cases, excluding keys and other items

## External Dependencies

### Third-Party Services
- **Steam Web API**: Official Steam API for account data and inventory access
- **Steam Community Market**: Price fetching for market items
- **Neon Database**: Serverless PostgreSQL hosting

### Key Libraries and Frameworks
- **Frontend**: React, Vite, Tailwind CSS, Radix UI, React Query, React Hook Form
- **Backend**: Express.js, Drizzle ORM, Zod validation
- **Database**: @neondatabase/serverless, drizzle-orm
- **Utilities**: date-fns for date handling, clsx for conditional classes

### Steam API Integration
- **Rate Limits**: Respects Steam 2025 inventory limits (5 requests per 30 minutes)
- **Error Handling**: Graceful handling of private profiles, API failures, and network issues
- **Data Validation**: Comprehensive validation of Steam IDs and inventory data
- **Caching**: Intelligent caching to minimize API calls and improve performance
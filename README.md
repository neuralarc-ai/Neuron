# Neuron HRMS

HR Management System for NeuralArc Inc - Internal tool for managing employees, leave tracking, and payment processing.

## Features

- **Employee Management**: Comprehensive employee database with profiles, designations, and agreement references
- **Leave Tracking**: CSV-style bulk leave entry with quota monitoring and automatic deduction calculations
- **Payment Processing**: Generate professional payment advices with TDS calculations and PDF export
- **Accounting Module**: Full double-entry bookkeeping system with transaction management, revenue tracking, and financial reporting
- **User Management**: Role-based access control with admin and user roles
- **Dashboard**: Real-time overview of employee statistics and payroll

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, shadcn/ui
- **Backend**: Node.js, Express, tRPC
- **Database**: PostgreSQL (Supabase) with Drizzle ORM
- **Authentication**: Custom session-based auth with bcrypt
- **PDF Generation**: jsPDF

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- Supabase account and PostgreSQL database

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
# Create .env file with:
# DATABASE_URL=postgresql://user:password@host:port/database
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_KEY=your-service-role-key
# JWT_SECRET=your-secret-key

# Run database migrations
# 1. Open Supabase SQL Editor
# 2. Run the migration file: migrations/001_create_accounting_tables.sql
# This creates the accounting schema with all required tables and functions

# Push Drizzle schema (for existing tables)
pnpm db:push

# Start development server
pnpm dev
```

### Accounting Module Setup

1. **Run SQL Migration**: Execute `migrations/001_create_accounting_tables.sql` in your Supabase SQL Editor
   - This creates the `accounting` schema
   - Sets up tables: `accounts`, `categories`, `vendors`, `transactions`, `entries`, `attachments`
   - Creates the `create_transaction` RPC function for atomic transaction creation
   - Seeds default categories and accounts

2. **Environment Variables**: Ensure you have:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`: Service role key (not anon key) for server-side operations

3. **Access Revenue Tab**: Once migration is complete, the Revenue tab will be available in the sidebar
   - Dashboard: View monthly summaries and top categories
   - Create Transaction: Add new accounting transactions with double-entry validation

### Default Credentials

- Username: `admin`
- Password: `admin`

## Project Structure

```
client/              # React frontend
  src/
    pages/          # Page components
    components/     # Reusable UI components
    lib/            # Utilities and tRPC client
server/              # Express backend
  routers.ts        # tRPC API routes
  db.ts             # Database queries
  authDb.ts         # Authentication queries
drizzle/            # Database schema
shared/             # Shared types and constants
```

## Company Information

**NeuralArc Inc**  
Website: [neuralarc.ai](https://neuralarc.ai)  
India Office: AMPVC Consulting LLP, Trimurti HoneyGold, Range Hills Road, Pune 411 007

## License

Private - Internal use only

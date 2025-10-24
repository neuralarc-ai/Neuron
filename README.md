# Neuron HRMS

HR Management System for NeuralArc Inc - Internal tool for managing employees, leave tracking, and payment processing.

## Features

- **Employee Management**: Comprehensive employee database with profiles, designations, and agreement references
- **Leave Tracking**: CSV-style bulk leave entry with quota monitoring and automatic deduction calculations
- **Payment Processing**: Generate professional payment advices with TDS calculations and PDF export
- **User Management**: Role-based access control with admin and user roles
- **Dashboard**: Real-time overview of employee statistics and payroll

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, shadcn/ui
- **Backend**: Node.js, Express, tRPC
- **Database**: MySQL with Drizzle ORM
- **Authentication**: Custom session-based auth with bcrypt
- **PDF Generation**: jsPDF

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- MySQL database

### Installation

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

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

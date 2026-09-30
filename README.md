# Reputation OS

Customer feedback and Google review growth platform for local businesses.

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm 10+

### Setup

```bash
# Install dependencies
npm install
cd client && npm install
cd ../server && npm install
cd ..

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Create database
createdb reputation_os

# Push schema to database
npm run db:push

# Start development servers
npm run dev
```

### Development

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health check:** http://localhost:3000/api/v1/health

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend |
| `npm run build` | Build for production |
| `npm run lint` | Run linting |
| `npm run test` | Run tests |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run typecheck` | TypeScript type checking |

## Architecture

See `.planning/ARCHITECTURE.md` for full details.

## License

Proprietary

# SIH2025

## Getting Started

```bash
# Install dependencies
pnpm install

# Start Docker services
mise run docker:up

# Push database schema then seed data
mise run db:push
mise run db:seed

# Run dev servers
pnpm dev
```

## Commands

```bash
mise run dev              # Start all services
mise run docker:up        # Start Docker
mise run db:seed          # Seed database
```

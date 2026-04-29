# Frontend - Open-Source OCPP CMS Dashboard

This directory contains the Next.js 15 based administrative dashboard for the Open-Source OCPP 1.6 CMS. It provides a real-time, intuitive interface for operators to monitor and manage their charging stations, chargers, users, and transactions.

## Features

- **Dashboard Overview**: Real-time summary of system metrics, active sessions, and connector status distributions.
- **Station & Charger Management**: Create, view, update, and delete charging stations and chargers.
- **Remote Operations**: Start/stop charging sessions remotely, reset chargers, unlock connectors, and trigger messages.
- **RFID Tag Management**: Manage authorized RFID tags for initiating charging sessions.
- **Transaction History**: View past and active charging sessions with energy metrics and post-paid billing calculations.
- **Live OCPP Log Viewer**: Real-time WebSocket-based viewer for inspecting raw OCPP messages for debugging.

## Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/icons/)
- **State Management**: React Hooks & Context API
- **Charts**: Recharts

## Prerequisites

- Node.js 18 or higher

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```
   The dashboard will be available at [http://localhost:3002](http://localhost:3002) (Note: Port may vary based on your environment or if 3000 is occupied by the backend).

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Start production server:**
   ```bash
   npm run start
   ```

## Environment Variables

Currently, the frontend interacts directly with the backend API. If you need to configure base URLs for the API and WebSockets, you can create a `.env.local` file.

Example configuration (check `lib/api.ts` or similar files for actual env keys used):
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_OCPP_LOGS_WS_URL=ws://localhost:3001
```
*(Note: Refer to the actual frontend implementation to see if it reads these directly or uses hardcoded values in development)*

## Adding Components

This project uses `shadcn/ui`. To add new components:

```bash
npx shadcn-ui@latest add [component-name]
```
For example, to add a button component:
```bash
npx shadcn-ui@latest add button
```

Components will be placed in the `components/ui` directory.

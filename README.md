# Uni-LIFT

A minimalist wireframe rideshare web application built with React, TypeScript, and Tailwind CSS.

## Features

- **User Authentication** - Sign up and login with role-based access (Rider, Driver, Admin)
- **Dashboard** - View available rides, request rides, or offer rides
- **Ride Details** - Detailed view of ride information including driver details, route, and available seats
- **Admin Panel** - Comprehensive admin dashboard for managing users and rides
- **SOS Emergency Button** - Quick access emergency feature
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Wireframe Aesthetic** - Clean, minimalist black and white design with monospace fonts

## Design Philosophy

This application follows a strict "Minimalist Wireframe" aesthetic:
- Pure black (#000000) and white (#FFFFFF) color scheme
- Geist Mono monospace font throughout
- No rounded corners (border-radius: 0)
- 1px solid borders on all interactive elements
- No shadows or gradients

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Wouter** - Lightweight React router
- **Zustand** - State management
- **Radix UI** - Headless UI components
- **React Query** - Data fetching and caching
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a root `.env` file with your Supabase project credentials:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
uni-lift/
├── src/
│   ├── components/
│   │   ├── ui/           # Reusable UI components
│   │   ├── Navigation.tsx
│   │   └── ProtectedRoute.tsx
│   ├── hooks/
│   │   └── use-auth.ts   # Authentication hook
│   ├── lib/
│   │   ├── queryClient.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── RideDetail.tsx
│   │   ├── Admin.tsx
│   │   └── NotFound.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## User Roles

- **Rider** - Can request rides and view available rides
- **Driver** - Can offer rides and manage their ride offerings  
- **Admin** - Can manage users, rides, and view system analytics

## Authentication Notes

- Authentication uses Supabase Auth (`signUp`, `signInWithPassword`, `signOut`)
- User profile rows are synced to `public.users`
- Email addresses containing `admin` are still interpreted as admin in local role normalization fallback

## License

MIT

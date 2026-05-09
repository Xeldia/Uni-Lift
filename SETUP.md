# Uni-LIFT – Project Setup Instructions

## Prerequisites

Make sure you have the following installed before running the project:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v20 or higher | https://nodejs.org |
| npm | v9 or higher (comes with Node.js) | — |
| Git | Any recent version | https://git-scm.com |

---

## 1. Clone the Repository

```bash
git clone https://github.com/Xeldia/Uni-Lift.git
cd Uni-Lift
```

---

## 2. Running the Frontend (Main App)

> The main application lives in the `Frontend/` directory.

### Step 1 – Install dependencies

```bash
cd Frontend
npm install
```

### Step 2 – Start the development server

```bash
npm run dev
```

### Step 3 – Open in the browser

```
http://localhost:5173/
```

You will land directly on the **Login Page** (`/`).

---

## 3. Environment Variables

The `Frontend/.env` file is already included in the repository and pre-configured with the project's Supabase credentials:

```
VITE_SUPABASE_URL=https://xglaagdzaiabwbptnref.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_API_BASE_URL=http://localhost:3001
```

> ⚠️ If you ever need to change the Supabase project, update the values in `Frontend/.env` and restart the dev server.

---

## 4. Application Routes

| URL | Page |
|-----|------|
| `/` | Login / Sign-up |
| `/home` | Rider/Driver Home Dashboard |
| `/messages` | Messages |
| `/profile` | User Profile |
| `/settings` | Settings |
| `/admin` | Admin Dashboard |
| `/admin/verifications` | Verifications |
| `/admin/users` | Users Management |
| `/admin/rides` | Rides Management |
| `/admin/sos` | SOS Alerts |

---

## 5. User Roles

| Role | Access |
|------|--------|
| **Rider** | Home, Messages, Profile, Settings |
| **Driver** | Home (Driver mode), Messages, Profile, Settings |
| **Admin** | All pages including the full Admin panel |

---

## 6. Building for Production

```bash
cd Frontend
npm run build
```

Built files will be output to `Frontend/dist/`.

---

## 7. Tech Stack Summary

- **React 19** – UI framework
- **Vite 6** – Build tool and dev server
- **TypeScript** – Type safety
- **Tailwind CSS v4** – Styling
- **React Router v7** – Client-side routing
- **Supabase** – Authentication and database
- **Radix UI** – Headless UI components

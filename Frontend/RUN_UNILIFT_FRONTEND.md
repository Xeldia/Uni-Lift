# UniLift Frontend Run Guide (Official Login)

This is the official frontend with the black-and-white login page.

Official URL after start:
- http://localhost:5173/

## Project Path

- `C:/Users/andre/OneDrive/Documents/Uni_LIFT/Frontend`

## Requirements

- Node.js 18+ (Node 20 recommended)
- npm

## Start Dev Server

From PowerShell:

```powershell
cd C:/Users/andre/OneDrive/Documents/Uni_LIFT/Frontend
npm install
npm run dev
```

When Vite starts, open:

- http://localhost:5173/

## One-Liner Start Command

From any folder:

```powershell
npm --prefix "C:/Users/andre/OneDrive/Documents/Uni_LIFT/Frontend" run dev
```

## If Port 5173 Is Busy

Vite may move to another port automatically. Check terminal output for the exact `Local:` URL.

## Important

Do not use the old forum app (`REACT/forum-app`) as the UniLift login source. The official login page is in `Uni_LIFT/Frontend`.

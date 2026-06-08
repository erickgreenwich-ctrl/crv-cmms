# CR-V CMMS — 2018 Honda CR-V AWD 1.5T

Personal Computerized Maintenance Management System.

## Deploy to Vercel (5 minutes)

### Step 1 — GitHub
1. Go to github.com → New repository → name it `crv-cmms` → Create
2. Upload all these files (drag and drop the whole folder)

### Step 2 — Vercel
1. Go to vercel.com → Sign up with your GitHub account
2. Click "Add New Project" → Import your `crv-cmms` repo
3. Leave all settings as default → click "Deploy"
4. Done — Vercel gives you a URL like `https://crv-cmms.vercel.app`

### Step 3 — Add to phone home screen
**iPhone:** Open the URL in Safari → Share button → "Add to Home Screen"
**Android:** Open in Chrome → three-dot menu → "Add to Home Screen"

The app installs like a native app with its own icon.

## Google Drive sync
The app automatically tries to sync to Google Drive via the Anthropic API.
If Drive is not connected it falls back to browser localStorage.

## Tech stack
- React 18 + Vite
- IBM Plex Mono font
- Anthropic API (AI assistant + Drive sync)
- PWA manifest (installable on phone)

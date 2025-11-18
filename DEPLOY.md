# Deployment Guide for Solheimshytta

## Forberedelser

1. **Sjekk at `.env` filen er korrekt konfigurert** med alle Firebase-credentials
2. **Bygg applikasjonen lokalt først** for å teste at alt fungerer:
   ```bash
   npm run build
   npm run preview
   ```

## Alternativ 1: Firebase Hosting (Anbefalt)

### Steg 1: Installer Firebase CLI
```bash
npm install -g firebase-tools
```

### Steg 2: Logg inn på Firebase
```bash
firebase login
```

### Steg 3: Initialiser Firebase Hosting
```bash
firebase init hosting
```

Velg:
- Existing project (velg ditt Firebase-prosjekt)
- Public directory: `.output/public`
- Configure as a single-page app: **No** (Nuxt håndterer routing)
- Set up automatic builds: **No** (vi bygger manuelt)

### Steg 4: Opprett `firebase.json`
Filen skal se slik ut:
```json
{
  "hosting": {
    "public": ".output/public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Steg 5: Bygg og deploy
```bash
# Bygg applikasjonen
npm run build

# Deploy til Firebase Hosting
firebase deploy --only hosting
```

### Steg 6: Sett opp environment variables i Firebase Hosting
Firebase Hosting støtter ikke direkte environment variables, så du må:
- Enten bruke Firebase Functions for å serve appen
- Eller bygge med environment variables før deploy

**Løsning: Bygg med env vars før deploy**
```bash
# Sørg for at .env filen er satt opp
npm run build
firebase deploy --only hosting
```

## Alternativ 2: Vercel (Enklest)

### Steg 1: Installer Vercel CLI
```bash
npm install -g vercel
```

### Steg 2: Deploy
```bash
vercel
```

Følg instruksjonene og legg til environment variables i Vercel dashboard.

### Steg 3: Sett opp Environment Variables i Vercel Dashboard
Gå til Project Settings → Environment Variables og legg til:
- `NUXT_PUBLIC_FIREBASE_API_KEY`
- `NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NUXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NUXT_PUBLIC_FIREBASE_APP_ID`

## Alternativ 3: Netlify

### Steg 1: Installer Netlify CLI
```bash
npm install -g netlify-cli
```

### Steg 2: Opprett `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = ".output/public"

[build.environment]
  NODE_VERSION = "18"
```

### Steg 3: Deploy
```bash
netlify deploy --prod
```

## Viktige notater

1. **Environment Variables**: Sørg for at alle Firebase-credentials er satt opp i hosting-plattformen
2. **Firestore Rules**: Husk å sjekke at Firestore Security Rules er korrekt konfigurert for produksjon
3. **Firebase Auth Domains**: Legg til ditt domene i Firebase Console → Authentication → Settings → Authorized domains
4. **CORS**: Hvis du får CORS-feil, sjekk Firebase Console settings

## Kontinuerlig Deployment (CI/CD)

### GitHub Actions eksempel (for Firebase Hosting)
Opprett `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```


# Solheimshytta Pilot App

This repository contains the new merged web app for **Solheimshytta**:

> `https://nye.solheimshytta.no`

Three existing webapps are being merged into one, built as a **Nuxt 4** app with:

- **Nuxt 4** (SSR)
- **Sanity** (content & data backend)
- **Firebase Auth** (authentication)
- **OpenAI API** (assistant / AI features, via Nuxt server routes)
- **Vercel** (hosting & deployment)

Initially the app is **behind authentication** so a small group of pilot users can test before a public release.

---

## 1. Project Goals

- Consolidate multiple existing Solheimshytta apps into **one** modern app.
- Use a stack that is:
  - easy to iterate on (Nuxt 4)
  - content-driven (Sanity)
  - simple but powerful for auth (Firebase Auth)
  - ready for future “smart”/AI features (OpenAI).
- Host everything on **Vercel**, and map the domain `nye.solheimshytta.no` from Uniweb.

---

## 2. Tech Stack Overview

### Frontend / App

- **Nuxt 4** (TypeScript, Vue 3, SSR)
- Optional UI libraries (Vuetify / Tailwind, etc., depending on design)

### Content & Data

- **Sanity**:
  - Project ID & dataset configured via env vars.
  - Used for:
    - site content (pages, texts, images)
    - structured data about cabins, areas, etc.

### Authentication

- **Firebase Auth** (one shared Firebase project):
  - Email/password login for a **small set of pilot users**.
  - Users are created manually in the Firebase Console.
  - App is protected by global route middleware in Nuxt.

### AI / Assistant

- **OpenAI Chat Completions API** (`https://api.openai.com/v1/chat/completions`)
- Called from Nuxt **server routes** (e.g. `/api/ask-ai`) to:
  - keep API keys secret on the server
  - support features like:
    - text generation
    - explanation/assistance
    - content suggestions.

### Hosting

- **Vercel**:
  - CI/CD via GitHub repository.
  - Nuxt build & deploy handled automatically.
  - Custom domain `nye.solheimshytta.no` mapped via DNS at Uniweb.

---

## 3. Environment Variables

The app expects environment variables both locally (`.env.local`) and in Vercel’s project settings.

### Sanity

```bash
SANITY_PROJECT_ID=xxxx
SANITY_DATASET=production
```

### Firebase Auth

From the Firebase Web app config:

```bash
VITE_FB_API_KEY=...
VITE_FB_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FB_PROJECT_ID=your-project-id
VITE_FB_APP_ID=1:xxxx:web:yyyy
```

These are used by the client-side Firebase SDK in Nuxt composables.

### OpenAI

```bash
OPENAI_API_KEY=sk-...
```

This key is used **only on the server** (Nuxt server routes).

---

## 4. Sanity Client in Nuxt

Simple composable to create a Sanity client:

```ts
// composables/useSanity.ts
import { createClient } from "@sanity/client";

let client: ReturnType<typeof createClient>;

export function useSanity() {
  if (!client) {
    client = createClient({
      projectId: process.env.SANITY_PROJECT_ID!,
      dataset: process.env.SANITY_DATASET!,
      apiVersion: "2025-01-01",
      useCdn: true,
    });
  }
  return client;
}
```

Make sure in Sanity project settings that allowed origins include:

- `http://localhost:3000`
- `https://<vercel-app>.vercel.app`
- `https://nye.solheimshytta.no`

---

## 5. Firebase Auth Integration (Client-Side)

Minimal pattern:

### Firebase client

```ts
// composables/useFirebaseClient.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

let app;
let auth;

export function useFirebaseClient() {
  if (process.server) {
    throw new Error("Firebase client only on client");
  }

  if (!app) {
    const config = {
      apiKey: import.meta.env.VITE_FB_API_KEY,
      authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FB_PROJECT_ID,
      appId: import.meta.env.VITE_FB_APP_ID,
    };

    if (!getApps().length) {
      app = initializeApp(config);
    }
    auth = getAuth();
  }

  return { app, auth };
}
```

### Auth composable

```ts
// composables/useFirebaseAuth.ts
import { ref } from "vue";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useFirebaseClient } from "./useFirebaseClient";

const userRef = ref<any | null>(null);
const initialized = ref(false);

export function useFirebaseAuth() {
  if (process.client && !initialized.value) {
    const { auth } = useFirebaseClient();
    onAuthStateChanged(auth, (user) => {
      userRef.value = user;
      initialized.value = true;
    });
  }

  async function login(email: string, password: string) {
    const { auth } = useFirebaseClient();
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    const { auth } = useFirebaseClient();
    await signOut(auth);
  }

  return { user: userRef, initialized, login, logout };
}
```

---

## 6. Route Protection (Pilot Phase)

Global middleware to require login for all routes except `/login`:

```ts
// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  // Allow login page without auth
  if (to.path === "/login") return;

  if (process.client) {
    const { user, initialized } = useFirebaseAuth();

    if (!initialized.value) {
      // Let Nuxt render; composable will update state when ready
      return;
    }

    if (!user.value) {
      return navigateTo("/login?redirect=" + encodeURIComponent(to.fullPath));
    }
  }
});
```

### Simple login page

```vue
<!-- pages/login.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "#imports";
import { useFirebaseAuth } from "~/composables/useFirebaseAuth";

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const route = useRoute();
const router = useRouter();
const { login, user, initialized } = useFirebaseAuth();

const redirectTo = computed(
  () => (route.query.redirect as string) || "/"
);

async function onSubmit() {
  error.value = "";
  loading.value = true;
  try {
    await login(email.value, password.value);
    await router.push(redirectTo.value);
  } catch (e: any) {
    error.value = e?.message || "Login failed";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div style="max-width: 400px; margin: 4rem auto; font-family: system-ui;">
    <h1>Logg inn</h1>

    <p v-if="!initialized">Sjekker innlogging…</p>

    <div v-else-if="user">
      <p>Allerede innlogget som {{ user.email }}</p>
      <NuxtLink :to="redirectTo">Gå videre</NuxtLink>
    </div>

    <form v-else @submit.prevent="onSubmit">
      <label>
        E-post<br />
        <input v-model="email" type="email" required />
      </label>
      <br /><br />
      <label>
        Passord<br />
        <input v-model="password" type="password" required />
      </label>
      <br /><br />
      <button type="submit" :disabled="loading">
        {{ loading ? "Logger inn..." : "Logg inn" }}
      </button>
      <p v-if="error" style="color: red; margin-top: 1rem;">{{ error }}</p>
    </form>
  </div>
</template>
```

With this in place:

- Entire site is behind Firebase Auth.
- Only predefined pilot users (created in Firebase Console) can access the app.

---

## 7. OpenAI API Integration (Nuxt Server Route)

To call the OpenAI Chat Completions API from the server:

```ts
// server/api/ask-ai.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody<{ question: string }>(event);

  if (!body?.question) {
    throw createError({ statusCode: 400, statusMessage: "Missing question" });
  }

  const res = await $fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: {
      model: "gpt-5.1",
      messages: [
        {
          role: "user",
          content: body.question,
        },
      ],
      stream: false,
    },
  });

  return res;
});
```

On the frontend, you can call:

```ts
const answer = await $fetch("/api/ask-ai", {
  method: "POST",
  body: {
    question: "Help me describe Solheimshytta in winter.",
  },
});
```

This keeps the OpenAI key secure on the server.

---

## 8. Vercel Deployment

1. Push this repository to **GitHub**.
2. In **Vercel**:
   - “Add New Project” → import the GitHub repo.
   - Vercel should auto-detect **Nuxt**.
3. Configure environment variables in Vercel:
   - `SANITY_PROJECT_ID`
   - `SANITY_DATASET`
   - `VITE_FB_API_KEY`
   - `VITE_FB_AUTH_DOMAIN`
   - `VITE_FB_PROJECT_ID`
   - `VITE_FB_APP_ID`
   - `OPENAI_API_KEY`
4. Deploy the project.

---

## 9. Domain Setup: `nye.solheimshytta.no`

1. In **Vercel** → Project → **Domains**:
   - Add `nye.solheimshytta.no`.
2. Vercel will show required DNS settings:
   - typically a **CNAME** from `nye.solheimshytta.no` to a `cname.vercel-dns.com` value.
3. In **Uniweb**:
   - open DNS management for `solheimshytta.no`.
   - add/update the CNAME for `nye`.
4. After DNS propagation, the app will be available at:

> `https://nye.solheimshytta.no`

---

## 10. Pilot Phase & Next Steps

During the pilot:

- Only whitelisted Firebase Auth users can log in.
- The team can:
  - test content flows (via Sanity)
  - validate navigation and UX
  - experiment with OpenAI-backed helper features.

When ready for public launch:

- You can:
  - remove or relax the global auth middleware (e.g. make only admin routes protected),
  - or keep a split between:
    - public marketing pages
    - authenticated “customer area” for cabin owners / internal tools.

This README serves as the high-level blueprint for the new Solheimshytta pilot app, its stack, and deployment model.

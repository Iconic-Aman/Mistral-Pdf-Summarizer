# Google OAuth — Plug & Play Integration Guide

A complete, drop-in Google authentication system for any Next.js (App Router) project.
No backend or database required. All credentials come from `.env.local`.

---

## Prerequisites
- Next.js 14+ (App Router)
- A Google Cloud Project with OAuth 2.0 credentials

---

## Step 1: Install the Package

```bash
npm install next-auth
```

---

## Step 2: Create `.env.local` in your project root

```bash
GOOGLE_CLIENT_ID=           # From Google Cloud Console → Credentials
GOOGLE_CLIENT_SECRET=       # From Google Cloud Console → Credentials
NEXTAUTH_SECRET=            # Any random 32-char string (run: openssl rand -base64 32)
NEXTAUTH_URL=               # Your site URL e.g. http://localhost:3000 or https://yoursite.com
```

> Never prefix these with `NEXT_PUBLIC_` — they must stay server-side only.

---

## Step 3: Create the NextAuth Route Handler

**File path:** `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            // Persist the id_token to send to your backend (optional)
            if (account?.id_token) token.idToken = account.id_token;
            return token;
        },
        async session({ session, token }) {
            // Expose the id_token on the session (optional)
            (session as any).idToken = token.idToken;
            return session;
        },
    },
});

export { handler as GET, handler as POST };
```

---

## Step 4: Create the Session Provider Wrapper

**File path:** `src/app/providers.tsx`

```typescript
"use client";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
    return <SessionProvider>{children}</SessionProvider>;
}
```

---

## Step 5: Wrap Your App with the Provider

**File path:** `src/app/layout.tsx`
Add these two lines:

```typescript
import { Providers } from "./providers";

// Inside the return, wrap {children}:
<Providers>{children}</Providers>
```

---

## Step 6: Create the Reusable `useAuth` Hook

**File path:** `src/lib/useAuth.ts`

```typescript
import { useSession, signIn, signOut } from "next-auth/react";

export interface AuthUser {
    name: string;
    email: string;
    avatar: string;
    idToken?: string;
}

export function useAuth() {
    const { data: session, status } = useSession();

    const user: AuthUser | null = session?.user
        ? {
            name: session.user.name ?? "",
            email: session.user.email ?? "",
            avatar: session.user.image ?? "",
            idToken: (session as any).idToken,
        }
        : null;

    return {
        user,
        isLoading: status === "loading",
        isAuthenticated: !!user,
        login: () => signIn("google", { callbackUrl: "/" }),
        logout: () => signOut({ callbackUrl: "/" }),
    };
}
```

---

## Step 7: Use It in Any Page or Component

```typescript
import { useAuth } from "@/lib/useAuth";

export default function MyPage() {
    const { user, isLoading, login, logout } = useAuth();

    if (isLoading) return <p>Loading...</p>;

    return user ? (
        <div>
            <img src={user.avatar} alt={user.name} />
            <p>Welcome, {user.name}!</p>
            <button onClick={logout}>Sign Out</button>
        </div>
    ) : (
        <button onClick={login}>Sign in with Google</button>
    );
}
```

---

## Step 8: Register Your Site in Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Navigate to **APIs & Services → Credentials** → Select your OAuth Client.
3. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/api/auth/callback/google` (for local dev)
   - `https://your-site.com/api/auth/callback/google` (for production)

---

## File Structure Summary

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts       ← Step 3
│   ├── providers.tsx              ← Step 4
│   └── layout.tsx                 ← Step 5 (modified)
└── lib/
    └── useAuth.ts                 ← Step 6 (the reusable hook)
.env.local                         ← Step 2
```

---

## Optional: Sending `idToken` to a FastAPI Backend

If you have a backend, pass the token like this from any component:

```typescript
const { user } = useAuth();

const response = await fetch("https://api.yoursite.com/api/v1/me", {
    headers: {
        Authorization: `Bearer ${user?.idToken}`,
    },
});
```

The backend's `get_current_user()` middleware will verify this token automatically.

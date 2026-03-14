"use client";
import { useSession, signIn, signOut } from "next-auth/react";

export interface AuthUser {
    name: string;
    email: string;
    avatar: string;
    idToken?: string;
}

/**
 * A reusable hook to manage Google OAuth sessions.
 * Can be used in any component to get user info, login, or logout.
 */
interface CustomSession {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
    idToken?: string;
}

export function useAuth() {
    const { data, status } = useSession();
    const session = data as CustomSession;

    const user: AuthUser | null = session?.user
        ? {
            name: session.user.name ?? "",
            email: session.user.email ?? "",
            avatar: session.user.image ?? "",
            idToken: session.idToken,
        }
        : null;

    const isLoading = status === "loading";


    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        /**
         * Trigger Google OAuth sign-in popup.
         */
        login: () => signIn("google", { callbackUrl: "/" }),
        /**
         * Sign out and clear the session.
         */
        logout: () => signOut({ callbackUrl: "/" }),
    };
}

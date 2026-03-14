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
            // Persist the id_token to send to your backend
            if (account?.id_token) token.idToken = account.id_token;
            return token;
        },
        async session({ session, token }) {
            // Expose the id_token on the session object
            (session as any).idToken = token.idToken;
            return session;
        },
    },
    // Required for Next.js 14+ on some providers
    secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };

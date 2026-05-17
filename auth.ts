import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        password: {},
      },
      async authorize(credentials) {
        const hash = process.env.ADMIN_PASSWORD_HASH
        if (!hash || typeof credentials?.password !== "string") return null
        const ok = await bcrypt.compare(credentials.password, hash)
        if (!ok) return null
        return { id: "1", name: "admin" }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
})

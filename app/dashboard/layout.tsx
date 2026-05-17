import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { logout } from "@/lib/actions"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#1a1a1a] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-white">IvanBeet Status</span>
          <nav className="flex gap-4 text-xs text-[#555]">
            <a href="/dashboard" className="hover:text-white transition-colors">
              Overview
            </a>
            <a href="/" className="hover:text-white transition-colors">
              Public page ↗
            </a>
          </nav>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-xs text-[#444] hover:text-white transition-colors"
          >
            Sign out
          </button>
        </form>
      </header>
      <div className="px-6 py-8">{children}</div>
    </div>
  )
}

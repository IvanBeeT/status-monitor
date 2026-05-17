"use client"

import { useActionState } from "react"
import { login } from "@/lib/actions"

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form action={action} className="w-full max-w-sm space-y-4">
        <h1 className="text-lg font-semibold text-white mb-6">Dashboard</h1>

        <div>
          <label className="block text-xs text-[#555] mb-1.5">Password</label>
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="w-full bg-[#111] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#444]"
            placeholder="••••••••"
          />
        </div>

        {state?.error && (
          <p className="text-xs text-[#ff4455]">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-white text-sm py-2 rounded transition-colors disabled:opacity-50"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  )
}

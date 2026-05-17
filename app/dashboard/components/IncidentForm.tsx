"use client"

import { useState } from "react"
import { createIncident } from "@/lib/actions"

type Service = { id: number; name: string }

export default function IncidentForm({ services }: { services: Service[] }) {
  const [open, setOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    await createIncident(formData)
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-[#ff4455] hover:text-[#ff6677] transition-colors"
      >
        + Post incident
      </button>
    )
  }

  return (
    <form action={handleSubmit} className="border border-[#331111] rounded-lg p-4 bg-[#110a0a] space-y-3">
      <p className="text-xs text-[#555] mb-1">New incident</p>

      <div>
        <label className="block text-[10px] text-[#444] mb-1">Service</label>
        <select
          name="serviceId"
          required
          className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#444]"
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[10px] text-[#444] mb-1">Title</label>
        <input
          name="title"
          required
          placeholder="Elevated error rates"
          className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-xs text-white placeholder-[#333] focus:outline-none focus:border-[#444]"
        />
      </div>

      <div>
        <label className="block text-[10px] text-[#444] mb-1">Message</label>
        <textarea
          name="message"
          required
          rows={3}
          placeholder="We're investigating an issue..."
          className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-xs text-white placeholder-[#333] focus:outline-none focus:border-[#444] resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="text-xs bg-[#1a0a0a] hover:bg-[#220a0a] border border-[#331111] text-[#ff4455] px-3 py-1.5 rounded transition-colors"
        >
          Post
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-[#444] hover:text-white transition-colors px-2"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

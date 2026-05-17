"use client"

import { useRef, useState } from "react"
import { createService } from "@/lib/actions"

export default function AddServiceForm() {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    await createService(formData)
    formRef.current?.reset()
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-[#00b4d8] hover:text-[#00c8f0] transition-colors"
      >
        + Add service
      </button>
    )
  }

  return (
    <form ref={formRef} action={handleSubmit} className="border border-[#222] rounded-lg p-4 bg-[#111] space-y-3">
      <p className="text-xs text-[#555] mb-1">New service</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-[#444] mb-1">Name</label>
          <input
            name="name"
            required
            placeholder="Portfolio"
            className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-xs text-white placeholder-[#333] focus:outline-none focus:border-[#444]"
          />
        </div>
        <div>
          <label className="block text-[10px] text-[#444] mb-1">URL</label>
          <input
            name="url"
            type="url"
            required
            placeholder="https://ivanbeet.com"
            className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-xs text-white placeholder-[#333] focus:outline-none focus:border-[#444]"
          />
        </div>
        <div>
          <label className="block text-[10px] text-[#444] mb-1">Check interval (min)</label>
          <input
            name="intervalMinutes"
            type="number"
            defaultValue={5}
            min={1}
            max={60}
            className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#444]"
          />
        </div>
        <div>
          <label className="block text-[10px] text-[#444] mb-1">Expected status</label>
          <input
            name="expectedStatus"
            type="number"
            defaultValue={200}
            className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#444]"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="text-xs bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-white px-3 py-1.5 rounded transition-colors"
        >
          Add
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

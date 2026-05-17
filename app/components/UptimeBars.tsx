"use client"

type DailyStats = {
  day: string
  ratio: number | null
}

export default function UptimeBars({ stats }: { stats: DailyStats[] }) {
  const today = new Date()
  const days: { day: string; ratio: number | null }[] = []

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split("T")[0]
    const found = stats.find((s) => s.day === key)
    days.push({ day: key, ratio: found?.ratio ?? null })
  }

  return (
    <div className="flex gap-[2px] h-7">
      {days.map(({ day, ratio }) => {
        let bg = "bg-[#222]"
        if (ratio !== null) {
          if (ratio >= 0.95) bg = "bg-[#00c87a]"
          else if (ratio >= 0.7) bg = "bg-yellow-500"
          else bg = "bg-[#ff4455]"
        }
        const label =
          ratio !== null
            ? `${day} — ${(ratio * 100).toFixed(1)}%`
            : `${day} — no data`
        return (
          <div
            key={day}
            title={label}
            className={`flex-1 rounded-[1px] ${bg} cursor-default transition-opacity hover:opacity-70`}
          />
        )
      })}
    </div>
  )
}

import { prisma } from "@/lib/prisma"
import UptimeBars from "./components/UptimeBars"

export const dynamic = "force-dynamic"

async function getServices() {
  const services = await prisma.service.findMany({
    include: {
      checks: { orderBy: { checkedAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "asc" },
  })

  return Promise.all(
    services.map(async (svc) => {
      const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const since90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

      const [total, up, avgLatency, dailyStats] = await Promise.all([
        prisma.check.count({ where: { serviceId: svc.id, checkedAt: { gte: since30d } } }),
        prisma.check.count({ where: { serviceId: svc.id, up: true, checkedAt: { gte: since30d } } }),
        prisma.check.aggregate({
          where: {
            serviceId: svc.id,
            up: true,
            checkedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          _avg: { latencyMs: true },
        }),
        prisma.$queryRaw<{ day: string; ratio: number }[]>`
          SELECT
            DATE("checkedAt")::text AS day,
            COUNT(*) FILTER (WHERE "up" = true)::float / NULLIF(COUNT(*), 0) AS ratio
          FROM "Check"
          WHERE "serviceId" = ${svc.id} AND "checkedAt" >= ${since90d}
          GROUP BY DATE("checkedAt")
          ORDER BY day ASC
        `,
      ])

      return {
        ...svc,
        currentUp: svc.checks[0]?.up ?? null,
        uptime: total > 0 ? ((up / total) * 100).toFixed(2) : null,
        avgLatencyMs: avgLatency._avg.latencyMs,
        dailyStats,
      }
    })
  )
}

async function getIncidents() {
  return prisma.incident.findMany({
    include: { service: { select: { name: true } } },
    orderBy: { startedAt: "desc" },
    take: 15,
  })
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export default async function StatusPage() {
  const [services, incidents] = await Promise.all([getServices(), getIncidents()])

  const anyDown = services.some((s) => s.currentUp === false)
  const allUp = services.every((s) => s.currentUp === true)

  const activeIncidents = incidents.filter((i) => !i.resolvedAt)
  const pastIncidents = incidents.filter((i) => i.resolvedAt)

  return (
    <main className="max-w-2xl mx-auto px-5 py-14">
      <div className="mb-10">
        <h1 className="text-xl font-semibold text-white tracking-tight">IvanBeet Status</h1>
        <p
          className={`mt-1 text-sm ${
            anyDown ? "text-[#ff4455]" : allUp ? "text-[#00c87a]" : "text-[#555]"
          }`}
        >
          {anyDown
            ? "Some services are down."
            : allUp
              ? "All systems operational."
              : "No monitoring data yet."}
        </p>
      </div>

      {activeIncidents.length > 0 && (
        <div className="mb-8 border border-yellow-800 bg-yellow-950/30 rounded p-4 space-y-2">
          {activeIncidents.map((inc) => (
            <div key={inc.id}>
              <p className="text-yellow-400 text-sm font-medium">
                {inc.service.name} — {inc.title}
              </p>
              <p className="text-[#888] text-xs mt-0.5">{inc.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {services.map((svc) => (
          <div key={svc.id} className="border border-[#222] rounded-lg p-4 bg-[#111]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    svc.currentUp === true
                      ? "bg-[#00c87a]"
                      : svc.currentUp === false
                        ? "bg-[#ff4455]"
                        : "bg-[#444]"
                  }`}
                />
                <span className="text-sm text-white font-medium">{svc.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#555]">
                {svc.avgLatencyMs != null && (
                  <span>{Math.round(svc.avgLatencyMs)}ms avg</span>
                )}
                {svc.uptime != null && <span className="text-[#888]">{svc.uptime}%</span>}
              </div>
            </div>

            <UptimeBars stats={svc.dailyStats} />

            <div className="flex justify-between mt-2 text-[10px] text-[#444]">
              <span>90 days ago</span>
              <span>today</span>
            </div>
          </div>
        ))}

        {services.length === 0 && (
          <p className="text-[#444] text-sm">No services configured yet.</p>
        )}
      </div>

      {pastIncidents.length > 0 && (
        <div className="mt-14">
          <h2 className="text-xs uppercase tracking-widest text-[#444] mb-4">Past Incidents</h2>
          <div className="space-y-4">
            {pastIncidents.map((inc) => (
              <div key={inc.id} className="border-l-2 border-[#333] pl-4">
                <p className="text-sm text-[#aaa]">
                  {inc.service.name} — {inc.title}
                </p>
                <p className="text-xs text-[#555] mt-0.5">{inc.message}</p>
                <div className="flex gap-4 mt-1 text-[10px] text-[#444]">
                  <span>Started: {formatDate(inc.startedAt)}</span>
                  {inc.resolvedAt && <span>Resolved: {formatDate(inc.resolvedAt)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-16 text-[10px] text-[#2a2a2a]">Checks run every 5 min</p>
    </main>
  )
}

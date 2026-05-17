import { prisma } from "@/lib/prisma"
import { deleteService, resolveIncident, deleteIncident } from "@/lib/actions"
import AddServiceForm from "./components/AddServiceForm"
import IncidentForm from "./components/IncidentForm"

async function getDashboardData() {
  const services = await prisma.service.findMany({
    include: {
      checks: { orderBy: { checkedAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "asc" },
  })

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const enriched = await Promise.all(
    services.map(async (svc) => {
      const [total, up, checksToday, totalToday, avgLatency] = await Promise.all([
        prisma.check.count({ where: { serviceId: svc.id, checkedAt: { gte: since30d } } }),
        prisma.check.count({ where: { serviceId: svc.id, up: true, checkedAt: { gte: since30d } } }),
        prisma.check.count({ where: { serviceId: svc.id, up: true, checkedAt: { gte: since24h } } }),
        prisma.check.count({ where: { serviceId: svc.id, checkedAt: { gte: since24h } } }),
        prisma.check.aggregate({
          where: { serviceId: svc.id, up: true, checkedAt: { gte: since24h } },
          _avg: { latencyMs: true },
        }),
      ])

      const last = svc.checks[0]

      return {
        ...svc,
        currentUp: last?.up ?? null,
        latencyMs: last?.latencyMs ?? null,
        uptime30d: total > 0 ? ((up / total) * 100).toFixed(1) : null,
        checksToday: `${checksToday}/${totalToday}`,
        avgLatency: avgLatency._avg.latencyMs,
        lastChecked: last?.checkedAt ?? null,
      }
    })
  )

  const incidents = await prisma.incident.findMany({
    include: { service: { select: { name: true } } },
    orderBy: { startedAt: "desc" },
    take: 20,
  })

  return { services: enriched, incidents }
}

function timeSince(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

export default async function DashboardPage() {
  const { services, incidents } = await getDashboardData()

  const activeIncidents = incidents.filter((i) => !i.resolvedAt)
  const pastIncidents = incidents.filter((i) => i.resolvedAt).slice(0, 8)

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-widest text-[#444]">Services</h2>
          <AddServiceForm />
        </div>

        <div className="border border-[#1a1a1a] rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1a1a1a] text-[#444]">
                <th className="text-left px-4 py-2.5 font-normal">Service</th>
                <th className="text-left px-4 py-2.5 font-normal">Status</th>
                <th className="text-left px-4 py-2.5 font-normal">Latency</th>
                <th className="text-left px-4 py-2.5 font-normal">Uptime 30d</th>
                <th className="text-left px-4 py-2.5 font-normal">Checks 24h</th>
                <th className="text-left px-4 py-2.5 font-normal">Last check</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc, i) => (
                <tr
                  key={svc.id}
                  className={`${i > 0 ? "border-t border-[#161616]" : ""} hover:bg-[#141414] transition-colors`}
                >
                  <td className="px-4 py-3 text-white">
                    <a
                      href={svc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#00b4d8] transition-colors"
                    >
                      {svc.name}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {svc.currentUp === true && (
                      <span className="text-[#00c87a]">● UP</span>
                    )}
                    {svc.currentUp === false && (
                      <span className="text-[#ff4455]">● DOWN</span>
                    )}
                    {svc.currentUp === null && (
                      <span className="text-[#444]">— pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#888]">
                    {svc.latencyMs != null ? `${svc.latencyMs}ms` : "—"}
                  </td>
                  <td className="px-4 py-3 text-[#888]">
                    {svc.uptime30d != null ? `${svc.uptime30d}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-[#555]">{svc.checksToday}</td>
                  <td className="px-4 py-3 text-[#444]">
                    {svc.lastChecked ? timeSince(svc.lastChecked) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form
                      action={async () => {
                        "use server"
                        await deleteService(svc.id)
                      }}
                    >
                      <button
                        type="submit"
                        className="text-[#333] hover:text-[#ff4455] transition-colors"
                      >
                        remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}

              {services.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-[#444] text-center">
                    No services yet. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-widest text-[#444]">Incidents</h2>
          <IncidentForm services={services.map((s) => ({ id: s.id, name: s.name }))} />
        </div>

        {activeIncidents.length > 0 && (
          <div className="space-y-2 mb-4">
            {activeIncidents.map((inc) => (
              <div
                key={inc.id}
                className="border border-yellow-900/50 bg-yellow-950/20 rounded-lg px-4 py-3 flex items-start justify-between gap-4"
              >
                <div>
                  <p className="text-yellow-400 text-xs font-medium">
                    {inc.service.name} — {inc.title}
                  </p>
                  <p className="text-[#666] text-xs mt-0.5">{inc.message}</p>
                </div>
                <form
                  action={async () => {
                    "use server"
                    await resolveIncident(inc.id)
                  }}
                >
                  <button
                    type="submit"
                    className="text-xs text-[#444] hover:text-[#00c87a] transition-colors whitespace-nowrap"
                  >
                    resolve
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        {pastIncidents.length > 0 ? (
          <div className="border border-[#1a1a1a] rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1a1a1a] text-[#444]">
                  <th className="text-left px-4 py-2.5 font-normal">Service</th>
                  <th className="text-left px-4 py-2.5 font-normal">Title</th>
                  <th className="text-left px-4 py-2.5 font-normal">Started</th>
                  <th className="text-left px-4 py-2.5 font-normal">Resolved</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {pastIncidents.map((inc, i) => (
                  <tr
                    key={inc.id}
                    className={`${i > 0 ? "border-t border-[#161616]" : ""} hover:bg-[#141414] transition-colors`}
                  >
                    <td className="px-4 py-3 text-[#888]">{inc.service.name}</td>
                    <td className="px-4 py-3 text-[#aaa]">{inc.title}</td>
                    <td className="px-4 py-3 text-[#555]">{timeSince(inc.startedAt)}</td>
                    <td className="px-4 py-3 text-[#555]">
                      {inc.resolvedAt ? timeSince(inc.resolvedAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form
                        action={async () => {
                          "use server"
                          await deleteIncident(inc.id)
                        }}
                      >
                        <button
                          type="submit"
                          className="text-[#333] hover:text-[#ff4455] transition-colors"
                        >
                          delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[#444] text-xs">No past incidents.</p>
        )}
      </div>
    </div>
  )
}

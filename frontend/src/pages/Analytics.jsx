import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { getClaimStats, getClaims } from '../services/api'
import styles from './Analytics.module.css'

const STATUS_COLORS = {
  pending:   '#BA7517',
  approved:  '#1D9E75',
  rejected:  '#A32D2D',
  in_review: '#378ADD',
}

const STATUS_LABELS = {
  pending:   'Pendente',
  approved:  'Aprovado',
  rejected:  'Rejeitado',
  in_review: 'Em Revisão',
}

const TYPE_COLORS = ['#1D9E75', '#378ADD', '#7F77DD']

const fmtCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v ?? 0)

const fmtK = (v) => (v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`)

export default function Analytics() {
  const [stats, setStats]     = useState(null)
  const [typeData, setTypeData] = useState([])
  const [monthData, setMonthData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, autoRes, homeRes, healthRes, allRes] = await Promise.all([
          getClaimStats(),
          getClaims({ claim_type: 'auto',   limit: 1 }),
          getClaims({ claim_type: 'home',   limit: 1 }),
          getClaims({ claim_type: 'health', limit: 1 }),
          getClaims({ limit: 200 }),
        ])

        setStats(statsRes.data)

        setTypeData([
          { name: 'Auto',   value: autoRes.data.total },
          { name: 'Home',   value: homeRes.data.total },
          { name: 'Health', value: healthRes.data.total },
        ])

        // Group all claims by month for the trend chart
        const byMonth = {}
        for (const c of allRes.data.items) {
          const d   = new Date(c.created_at)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          if (!byMonth[key]) byMonth[key] = { month: key, Sinistros: 0, 'Total R$': 0 }
          byMonth[key].Sinistros   += 1
          byMonth[key]['Total R$'] += c.amount_claimed
        }
        const sorted = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month))
        setMonthData(sorted)
      } catch {
        // backend unavailable
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className={styles.loading}>Carregando analytics…</div>

  const byStatus = stats?.by_status ?? []

  const statusBarData = byStatus.map((r) => ({
    name:       STATUS_LABELS[r.status] ?? r.status,
    Quantidade: r.count,
    Solicitado: Math.round(r.total_claimed),
    color:      STATUS_COLORS[r.status] ?? '#999',
  }))

  const totalClaims    = byStatus.reduce((a, r) => a + r.count, 0)
  const totalClaimed   = byStatus.reduce((a, r) => a + r.total_claimed, 0)
  const approvedRow    = byStatus.find((r) => r.status === 'approved')
  const approvalRate   = totalClaims
    ? ((approvedRow?.count ?? 0) / totalClaims * 100).toFixed(1)
    : '0'

  return (
    <div>
      {/* ── Summary stat cards ── */}
      <div className={styles.statGrid}>
        {byStatus.map((r) => (
          <div key={r.status} className={styles.statCard}>
            <div className={styles.statLabel}>{STATUS_LABELS[r.status] ?? r.status}</div>
            <div className={styles.statValue}>{r.count}</div>
            <div className={styles.statSub}>{fmtCurrency(r.total_claimed)} solicitado</div>
            <div
              className={styles.statBar}
              style={{ background: STATUS_COLORS[r.status] ?? '#999' }}
            />
          </div>
        ))}
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Taxa de Aprovação</div>
          <div className={styles.statValue}>{approvalRate}%</div>
          <div className={styles.statSub}>{fmtCurrency(totalClaimed)} total solicitado</div>
          <div className={styles.statBar} style={{ background: '#1D9E75' }} />
        </div>
      </div>

      <div className={styles.grid2}>
        {/* ── Bar: count by status ── */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Sinistros por Status</div>
          {statusBarData.length === 0 ? (
            <p className={styles.empty}>Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusBarData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}
                />
                <Bar dataKey="Quantidade" radius={[4, 4, 0, 0]}>
                  {statusBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Pie: by type ── */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Distribuição por Tipo de Apólice</div>
          {typeData.every((d) => d.value === 0) ? (
            <p className={styles.empty}>Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {typeData.map((_, i) => (
                    <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Bar: total claimed by status ── */}
      <div className={styles.card} style={{ marginBottom: 14 }}>
        <div className={styles.cardTitle}>Valor Total Solicitado por Status (R$)</div>
        {statusBarData.length === 0 ? (
          <p className={styles.empty}>Sem dados.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusBarData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtK} />
              <Tooltip
                formatter={(v) => fmtCurrency(v)}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}
              />
              <Bar dataKey="Solicitado" radius={[4, 4, 0, 0]}>
                {statusBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Line: monthly trend ── */}
      {monthData.length > 1 && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Tendência Mensal de Sinistros</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}
              />
              <Bar dataKey="Sinistros" fill="var(--c-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

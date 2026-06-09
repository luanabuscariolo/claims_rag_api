import { useEffect, useState } from 'react'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import { getClaimStats, getClaims } from '../services/api'
import styles from './Overview.module.css'

const TYPE_COLORS = {
  auto:   '#1D9E75',
  home:   '#378ADD',
  health: '#7F77DD',
}

const STATUS_COLORS = {
  pending:   '#BA7517',
  approved:  '#1D9E75',
  rejected:  '#A32D2D',
  in_review: '#378ADD',
}

const fmtCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

const fmtDate = (s) =>
  new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

export default function Overview() {
  const [stats, setStats]     = useState(null)
  const [recent, setRecent]   = useState([])
  const [typeData, setTypeData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, claimsRes, autoRes, homeRes, healthRes] = await Promise.all([
          getClaimStats(),
          getClaims({ limit: 6 }),
          getClaims({ claim_type: 'auto',   limit: 1 }),
          getClaims({ claim_type: 'home',   limit: 1 }),
          getClaims({ claim_type: 'health', limit: 1 }),
        ])
        setStats(statsRes.data)
        setRecent(claimsRes.data.items)
        setTypeData([
          { label: 'Auto',   count: autoRes.data.total,   color: TYPE_COLORS.auto   },
          { label: 'Home',   count: homeRes.data.total,   color: TYPE_COLORS.home   },
          { label: 'Health', count: healthRes.data.total, color: TYPE_COLORS.health },
        ])
      } catch {
        // silently handle — backend may be offline
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className={styles.loading}>Carregando dashboard…</div>

  const byStatus  = stats?.by_status ?? []
  const get       = (s) => byStatus.find((r) => r.status === s) ?? { count: 0, total_claimed: 0, avg_claimed: 0 }
  const total     = byStatus.reduce((a, r) => a + r.count, 0)
  const approved  = get('approved')
  const pending   = get('pending')
  const typeTotal = typeData.reduce((a, d) => a + d.count, 0)

  return (
    <div>
      {/* ── KPI Cards ── */}
      <div className={styles.kpiGrid}>
        <StatCard icon="📋" label="Total de Sinistros"  value={total} />
        <StatCard
          icon="✅"
          label="Aprovados"
          value={approved.count}
          sub={total ? `${((approved.count / total) * 100).toFixed(0)}% do total` : undefined}
          subType="up"
        />
        <StatCard icon="⏳" label="Pendentes" value={pending.count} />
        <StatCard
          icon="💰"
          label="Ticket Médio Aprovado"
          value={fmtCurrency(approved.avg_claimed)}
        />
      </div>

      <div className={styles.grid2}>
        {/* ── Funnel ── */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Funil de Processamento</div>
          {byStatus.length === 0 ? (
            <p className={styles.empty}>Nenhum dado disponível.</p>
          ) : (
            <div className={styles.funnel}>
              {byStatus.map((s) => {
                const pct = total ? Math.round((s.count / total) * 100) : 0
                return (
                  <div key={s.status} className={styles.funnelRow}>
                    <span className={styles.funnelLabel}>
                      <Badge status={s.status} />
                    </span>
                    <div className={styles.funnelBarBg}>
                      <div
                        className={styles.funnelBar}
                        style={{
                          width: `${pct}%`,
                          background: STATUS_COLORS[s.status] ?? '#999',
                        }}
                      >
                        <span>{s.count}</span>
                      </div>
                    </div>
                    <span className={styles.funnelPct}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Recent Activity ── */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Sinistros Recentes</div>
          {recent.length === 0 ? (
            <p className={styles.empty}>Nenhum sinistro registrado ainda.</p>
          ) : (
            <div className={styles.timeline}>
              {recent.map((c) => (
                <div key={c.id} className={styles.timelineRow}>
                  <div className={styles.timelineDot} style={{ background: STATUS_COLORS[c.status] }} />
                  <div className={styles.timelineInfo}>
                    <span className={styles.timelineId}>#{c.id}</span>
                    <span className={styles.timelineName}>{c.claimant_name}</span>
                  </div>
                  <Badge status={c.status} />
                  <span className={styles.timelineAmt}>{fmtCurrency(c.amount_claimed)}</span>
                  <span className={styles.timelineDate}>{fmtDate(c.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Type Distribution ── */}
      {typeData.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Distribuição por Tipo de Apólice</div>
          <div className={styles.typeGrid}>
            {typeData.map((d) => (
              <div key={d.label} className={styles.typeChip}>
                <div className={styles.typeChipLabel}>{d.label}</div>
                <div className={styles.typeChipValue} style={{ color: d.color }}>
                  {d.count}
                </div>
                <div className={styles.typeChipPct}>
                  {typeTotal ? `${((d.count / typeTotal) * 100).toFixed(1)}%` : '—'}
                </div>
                <div
                  className={styles.typeChipBar}
                  style={{
                    width: typeTotal ? `${(d.count / typeTotal) * 100}%` : '0%',
                    background: d.color,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

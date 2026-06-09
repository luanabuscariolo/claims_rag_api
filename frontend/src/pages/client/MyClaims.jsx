import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getClaims } from '../../services/api'
import styles from './MyClaims.module.css'

const STATUS_MAP = {
  pending:   { label: 'Pendente',    cls: styles.badgePending,  icon: '⏳' },
  approved:  { label: 'Aprovado',    cls: styles.badgeApproved, icon: '✅' },
  rejected:  { label: 'Rejeitado',   cls: styles.badgeRejected, icon: '❌' },
  in_review: { label: 'Em Revisão',  cls: styles.badgeInReview, icon: '🔍' },
}

const fmtCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

const fmtDate = (s) =>
  new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

export default function MyClaims() {
  const [query,   setQuery]   = useState('')
  const [claims,  setClaims]  = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSearch(e) {
    e?.preventDefault()
    const policyNum = query.trim()
    if (!policyNum) return
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const res = await getClaims({ policy_number: policyNum, limit: 50 })
      setClaims(res.data.items ?? res.data.claims ?? [])
    } catch {
      setError('Erro ao buscar. Verifique o número da apólice e tente novamente.')
      setClaims([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Meus Sinistros</h1>
      <p className={styles.pageSubtitle}>
        Informe seu número de apólice para consultar os sinistros
      </p>

      {/* Search */}
      <div className={styles.searchCard}>
        <div className={styles.searchLabel}>Número da Apólice</div>
        <form className={styles.searchRow} onSubmit={handleSearch}>
          <input
            className={styles.searchInput}
            placeholder="Ex: POL-2024-001"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className={styles.searchBtn}
            disabled={loading || !query.trim()}
          >
            {loading ? 'Buscando…' : '🔍 Buscar'}
          </button>
        </form>
        {error && (
          <p style={{ fontSize: 12, color: '#A32D2D', marginTop: 10 }}>{error}</p>
        )}
      </div>

      {/* Results */}
      {!searched ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📋</div>
          <p>Informe o número da sua apólice para ver seus sinistros</p>
        </div>
      ) : loading ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>⏳</div>
          <p>Buscando seus sinistros…</p>
        </div>
      ) : claims.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔎</div>
          <p>Nenhum sinistro encontrado para esta apólice.</p>
        </div>
      ) : (
        <div className={styles.claimList}>
          {claims.map((c) => {
            const s = STATUS_MAP[c.status] ?? { label: c.status, cls: '', icon: '•' }
            return (
              <Link
                key={c.id}
                to={`/client/claims/${c.id}`}
                className={styles.claimCard}
              >
                <div className={styles.claimLeft}>
                  <div className={styles.claimId}>#{c.id} · {c.policy_number}</div>
                  <div className={styles.claimTitle}>{c.description}</div>
                  <div className={styles.claimMeta}>
                    {c.claimant_name} · {c.claim_type} · {fmtDate(c.created_at)}
                  </div>
                </div>
                <div className={styles.claimRight}>
                  <div className={styles.claimValue}>{fmtCurrency(c.amount_claimed)}</div>
                  <span className={`${styles.badge} ${s.cls}`}>
                    {s.icon} {s.label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

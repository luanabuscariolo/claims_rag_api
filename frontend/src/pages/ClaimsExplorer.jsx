import { useEffect, useState, useCallback } from 'react'
import Badge from '../components/Badge'
import { getClaims, deleteClaim } from '../services/api'
import styles from './ClaimsExplorer.module.css'

const PER_PAGE = 12

const TYPE_CHIP_COLORS = {
  auto:   { bg: '#EAF3DE', color: '#3B6D11' },
  home:   { bg: '#E6F1FB', color: '#185FA5' },
  health: { bg: '#F3F0FD', color: '#4B3DA8' },
}

const fmtCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

const fmtDate = (s) =>
  new Date(s).toLocaleDateString('pt-BR')

export default function ClaimsExplorer() {
  const [allClaims, setAllClaims] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [typeFilter, setTypeFilter]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  // Fetch whenever server-side filters change
  const fetchClaims = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: 200, skip: 0 }
      if (typeFilter)   params.claim_type = typeFilter
      if (statusFilter) params.status     = statusFilter
      const res = await getClaims(params)
      setAllClaims(res.data.items)
    } catch {
      setAllClaims([])
    } finally {
      setLoading(false)
    }
  }, [typeFilter, statusFilter])

  useEffect(() => {
    fetchClaims()
    setPage(1)
  }, [fetchClaims])

  // Client-side text search
  const filtered = allClaims.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.claimant_name.toLowerCase().includes(q) ||
      c.policy_number.toLowerCase().includes(q) ||
      String(c.id).includes(q)
    )
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const start      = (page - 1) * PER_PAGE
  const pageItems  = filtered.slice(start, start + PER_PAGE)

  async function handleDelete(id) {
    if (!window.confirm(`Remover sinistro #${id}? Essa ação não pode ser desfeita.`)) return
    try {
      await deleteClaim(id)
      setAllClaims((prev) => prev.filter((c) => c.id !== id))
    } catch {
      alert('Erro ao remover sinistro.')
    }
  }

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder="Buscar por nome, apólice ou ID…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
        <select
          className={styles.select}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          <option value="auto">Auto</option>
          <option value="home">Home</option>
          <option value="health">Health</option>
        </select>
        <select
          className={styles.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="in_review">Em Revisão</option>
          <option value="approved">Aprovado</option>
          <option value="rejected">Rejeitado</option>
        </select>
        <span className={styles.count}>{filtered.length} resultado(s)</span>
      </div>

      {/* ── Table ── */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colId}>ID</th>
              <th>Nome</th>
              <th className={styles.colType}>Tipo</th>
              <th>Apólice</th>
              <th className={styles.colAmt}>Solicitado</th>
              <th className={styles.colAmt}>Aprovado</th>
              <th className={styles.colStatus}>Status</th>
              <th className={styles.colDate}>Data</th>
              <th className={styles.colAction}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className={styles.stateCell}>Carregando…</td>
              </tr>
            ) : pageItems.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.stateCell}>Nenhum sinistro encontrado.</td>
              </tr>
            ) : (
              pageItems.map((c) => {
                const typeStyle = TYPE_CHIP_COLORS[c.claim_type] ?? {}
                return (
                  <tr key={c.id} className={styles.row}>
                    <td className={styles.idCell}>#{c.id}</td>
                    <td className={styles.nameCell}>{c.claimant_name}</td>
                    <td>
                      <span
                        className={styles.typeChip}
                        style={{ background: typeStyle.bg, color: typeStyle.color }}
                      >
                        {c.claim_type}
                      </span>
                    </td>
                    <td className={styles.mono}>{c.policy_number}</td>
                    <td className={styles.amtCell}>{fmtCurrency(c.amount_claimed)}</td>
                    <td className={styles.amtCell}>
                      {c.amount_approved != null ? fmtCurrency(c.amount_approved) : '—'}
                    </td>
                    <td><Badge status={c.status} /></td>
                    <td className={styles.dateCell}>{fmtDate(c.created_at)}</td>
                    <td>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(c.id)}
                        title="Remover sinistro"
                        aria-label={`Remover sinistro #${c.id}`}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className={styles.pagination}>
        <span className={styles.paginationInfo}>
          {filtered.length === 0
            ? 'Sem resultados'
            : `Mostrando ${start + 1}–${Math.min(start + PER_PAGE, filtered.length)} de ${filtered.length}`}
        </span>
        <div className={styles.paginationBtns}>
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ← Anterior
          </button>
          <span className={styles.pageNum}>{page} / {totalPages || 1}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Próximo →
          </button>
        </div>
      </div>
    </div>
  )
}

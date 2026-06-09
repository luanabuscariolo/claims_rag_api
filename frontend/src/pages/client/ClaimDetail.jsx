import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getClaimById } from '../../services/api'
import styles from './ClaimDetail.module.css'

const fmtCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

const fmtDate = (s) =>
  new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

const STATUS_MAP = {
  pending:   { label: 'Pendente',   cls: styles.badgePending,   icon: '⏳' },
  approved:  { label: 'Aprovado',   cls: styles.badgeApproved,  icon: '✅' },
  rejected:  { label: 'Rejeitado',  cls: styles.badgeRejected,  icon: '❌' },
  in_review: { label: 'Em Revisão', cls: styles.badgeInReview,  icon: '🔍' },
}

const TYPE_LABELS = { auto: '🚗 Auto', home: '🏠 Residencial', health: '🏥 Saúde' }

// Timeline steps in order
const STEPS = [
  {
    id: 'pending',
    name: 'Sinistro Registrado',
    desc: 'Seu sinistro foi recebido e aguarda análise.',
  },
  {
    id: 'in_review',
    name: 'Em Análise',
    desc: 'Nossa equipe está avaliando a documentação.',
  },
  {
    id: 'approved',
    name: 'Aprovado',
    desc: 'Sinistro aprovado. O pagamento será processado em breve.',
  },
]

const REJECTION_STEP = {
  id: 'rejected',
  name: 'Rejeitado',
  desc: 'Infelizmente o sinistro não atende os critérios de cobertura da apólice.',
}

function getStepState(stepId, currentStatus) {
  const order = ['pending', 'in_review', 'approved']
  const currentIdx = order.indexOf(currentStatus)
  const stepIdx    = order.indexOf(stepId)
  if (currentStatus === 'rejected') {
    if (stepId === 'pending')   return 'done'
    if (stepId === 'in_review') return 'done'
    return 'pending'
  }
  if (stepIdx < currentIdx)  return 'done'
  if (stepIdx === currentIdx) return 'active'
  return 'pending'
}

export default function ClaimDetail() {
  const { id }    = useParams()
  const [claim,   setClaim]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getClaimById(id)
      .then((res) => setClaim(res.data))
      .catch(() => setClaim(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className={styles.loading}>⏳ Carregando sinistro…</div>
  if (!claim)  return <div className={styles.loading}>Sinistro não encontrado.</div>

  const s = STATUS_MAP[claim.status] ?? { label: claim.status, cls: '', icon: '•' }
  const steps = claim.status === 'rejected'
    ? [...STEPS.slice(0, 2), REJECTION_STEP]
    : STEPS

  return (
    <div className={styles.page}>
      <Link to="/client/my-claims" className={styles.backLink}>← Voltar para Meus Sinistros</Link>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.claimTitle}>{claim.description}</div>
            <div className={styles.claimId}>Sinistro #{claim.id} · {claim.policy_number}</div>
          </div>
          <span className={`${styles.badge} ${s.cls}`}>{s.icon} {s.label}</span>
        </div>
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Segurado</div>
            <div className={styles.metaValue}>{claim.claimant_name}</div>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Tipo</div>
            <div className={styles.metaValue}>{TYPE_LABELS[claim.claim_type] ?? claim.claim_type}</div>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Abertura</div>
            <div className={styles.metaValue}>{fmtDate(claim.created_at)}</div>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Última Atualização</div>
            <div className={styles.metaValue}>{fmtDate(claim.updated_at)}</div>
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className={styles.timelineCard}>
        <div className={styles.timelineTitle}>Andamento do Sinistro</div>
        <div className={styles.timeline}>
          {steps.map((step, i) => {
            const state = step.id === 'rejected' && claim.status === 'rejected'
              ? 'active'
              : getStepState(step.id, claim.status)
            const isLast = i === steps.length - 1

            const dotCls = state === 'done'
              ? styles.stepDotDone
              : state === 'active' && step.id === 'rejected'
              ? styles.stepDotRejected
              : state === 'active'
              ? styles.stepDotActive
              : styles.stepDotPending

            const lineCls = state === 'done'
              ? styles.stepConnectorDone
              : state === 'active'
              ? styles.stepConnectorActive
              : styles.stepConnectorPending

            const icon = state === 'done' ? '✓'
              : step.id === 'rejected' ? '✕'
              : state === 'active' ? '●'
              : `${i + 1}`

            return (
              <div key={step.id} className={styles.step}>
                <div className={styles.stepLine}>
                  <div className={`${styles.stepDot} ${dotCls}`}>{icon}</div>
                  {!isLast && (
                    <div className={`${styles.stepConnector} ${lineCls}`} />
                  )}
                </div>
                <div className={styles.stepContent}>
                  <div className={styles.stepName}>{step.name}</div>
                  <div className={styles.stepDesc}>{step.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Values ── */}
      <div className={styles.valuesCard}>
        <div className={styles.valuesTitle}>Valores</div>
        <div className={styles.valueRow}>
          <span className={styles.valueLabel}>Valor Solicitado</span>
          <span className={styles.valueAmount}>{fmtCurrency(claim.amount_claimed)}</span>
        </div>
        <div className={styles.valueRow}>
          <span className={styles.valueLabel}>Valor Aprovado</span>
          <span className={`${styles.valueAmount} ${claim.amount_approved ? styles.valueAmountApproved : ''}`}>
            {claim.amount_approved ? fmtCurrency(claim.amount_approved) : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}

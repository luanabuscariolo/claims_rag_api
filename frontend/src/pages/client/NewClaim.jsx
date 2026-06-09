import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createClaim } from '../../services/api'
import styles from './NewClaim.module.css'

const CLAIM_TYPES = [
  { value: 'auto',   icon: '🚗', label: 'Auto'        },
  { value: 'home',   icon: '🏠', label: 'Residencial' },
  { value: 'health', icon: '🏥', label: 'Saúde'       },
]

const INITIAL = {
  policy_number:  '',
  claimant_name:  '',
  claim_type:     'auto',
  description:    '',
  amount_claimed: '',
}

export default function ClientNewClaim() {
  const [form,    setForm]    = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const navigate = useNavigate()

  function change(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createClaim({
        ...form,
        amount_claimed: parseFloat(form.amount_claimed),
      })
      navigate('/client/my-claims')
    } catch (err) {
      setError(err?.response?.data?.detail ?? 'Erro ao abrir sinistro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Abrir Sinistro</h1>
      <p className={styles.pageSubtitle}>
        Preencha os dados abaixo para registrar sua ocorrência
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <div className={styles.errorBox}>⚠️ {error}</div>}

        {/* Tipo */}
        <div className={styles.fieldGroup}>
          <span className={styles.label}>Tipo de Sinistro <span className={styles.required}>*</span></span>
          <div className={styles.typeGrid}>
            {CLAIM_TYPES.map((t) => (
              <div
                key={t.value}
                className={`${styles.typeOption} ${form.claim_type === t.value ? styles.typeOptionSelected : ''}`}
                onClick={() => change('claim_type', t.value)}
              >
                <div className={styles.typeIcon}>{t.icon}</div>
                <div className={styles.typeLabel}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Apólice */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Número da Apólice <span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            placeholder="Ex: POL-2024-001"
            value={form.policy_number}
            onChange={(e) => change('policy_number', e.target.value)}
            required
          />
        </div>

        {/* Nome */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Seu Nome Completo <span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            placeholder="Nome como consta na apólice"
            value={form.claimant_name}
            onChange={(e) => change('claimant_name', e.target.value)}
            required
          />
        </div>

        {/* Valor */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Valor Estimado do Prejuízo (R$) <span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0,00"
            value={form.amount_claimed}
            onChange={(e) => change('amount_claimed', e.target.value)}
            required
          />
          <div className={styles.hint}>Valor aproximado — pode ser ajustado pela seguradora</div>
        </div>

        {/* Descrição */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Descrição da Ocorrência <span className={styles.required}>*</span>
          </label>
          <textarea
            className={styles.textarea}
            placeholder="Descreva o que aconteceu, quando e onde…"
            value={form.description}
            onChange={(e) => change('description', e.target.value)}
            required
            minLength={10}
          />
          <div className={styles.hint}>Mínimo 10 caracteres · {form.description.length}/255</div>
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? '⏳ Enviando…' : '📨 Enviar Sinistro'}
          </button>
          <Link to="/client/my-claims" className={styles.cancelBtn}>Cancelar</Link>
        </div>
      </form>
    </div>
  )
}

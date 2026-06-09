import { useState } from 'react'
import { createClaim } from '../services/api'
import styles from './NewClaim.module.css'

const INITIAL_FORM = {
  policy_number:  '',
  claimant_name:  '',
  claim_type:     'auto',
  description:    '',
  amount_claimed: '',
}

export default function NewClaim({ onSuccess }) {
  const [form, setForm]       = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(null)

    try {
      const res = await createClaim({
        ...form,
        amount_claimed: parseFloat(form.amount_claimed),
      })
      setSuccess(res.data)
      setForm(INITIAL_FORM)
    } catch (err) {
      setError(err?.response?.data?.detail ?? 'Erro ao criar sinistro. Verifique os dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setForm(INITIAL_FORM)
    setError('')
    setSuccess(null)
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Novo Sinistro</h1>
        <p className={styles.subtitle}>
          Preencha os dados abaixo para registrar um novo sinistro no sistema.
        </p>
      </div>

      {/* ── Banner de sucesso ── */}
      {success && (
        <div className={styles.successBanner}>
          <span className={styles.successIcon}>✓</span>
          <div className={styles.successText}>
            <strong>Sinistro #{success.id} criado com sucesso!</strong>
            <p>
              {success.claimant_name} — {success.claim_type} —{' '}
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                success.amount_claimed
              )}
            </p>
          </div>
          <div className={styles.successActions}>
            <button className={styles.btnSecondary} onClick={handleReset}>
              Criar outro
            </button>
            <button className={styles.btnPrimary} onClick={() => onSuccess?.()}>
              Ver sinistros
            </button>
          </div>
        </div>
      )}

      {/* ── Formulário ── */}
      {!success && (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error && (
            <div className={styles.errorBanner}>
              <span>⚠️</span> {error}
            </div>
          )}

          <div className={styles.fieldGrid}>
            {/* Número da apólice */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="policy_number">
                Número da Apólice <span className={styles.required}>*</span>
              </label>
              <input
                id="policy_number"
                name="policy_number"
                className={styles.input}
                value={form.policy_number}
                onChange={handleChange}
                required
                maxLength={50}
                placeholder="ex: APL-2024-001"
                autoComplete="off"
              />
            </div>

            {/* Nome do segurado */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="claimant_name">
                Nome do Segurado <span className={styles.required}>*</span>
              </label>
              <input
                id="claimant_name"
                name="claimant_name"
                className={styles.input}
                value={form.claimant_name}
                onChange={handleChange}
                required
                maxLength={50}
                placeholder="Nome completo"
              />
            </div>

            {/* Tipo de sinistro */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="claim_type">
                Tipo de Apólice <span className={styles.required}>*</span>
              </label>
              <select
                id="claim_type"
                name="claim_type"
                className={styles.select}
                value={form.claim_type}
                onChange={handleChange}
              >
                <option value="auto">🚗  Auto</option>
                <option value="home">🏠  Residencial</option>
                <option value="health">🏥  Saúde</option>
              </select>
            </div>

            {/* Valor solicitado */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="amount_claimed">
                Valor Solicitado (R$) <span className={styles.required}>*</span>
              </label>
              <input
                id="amount_claimed"
                name="amount_claimed"
                type="number"
                min="0.01"
                step="0.01"
                className={styles.input}
                value={form.amount_claimed}
                onChange={handleChange}
                required
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Descrição */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="description">
              Descrição do Sinistro <span className={styles.required}>*</span>
            </label>
            <textarea
              id="description"
              name="description"
              className={styles.textarea}
              value={form.description}
              onChange={handleChange}
              required
              minLength={10}
              maxLength={255}
              rows={4}
              placeholder="Descreva o que aconteceu com o máximo de detalhes possível…"
            />
            <span className={styles.charCount}>
              {form.description.length}/255
            </span>
          </div>

          {/* Ações */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleReset}
              disabled={loading}
            >
              Limpar
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? 'Salvando…' : 'Criar Sinistro'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

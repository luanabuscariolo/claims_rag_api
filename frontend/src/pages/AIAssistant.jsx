import { useState } from 'react'
import { askQuestion } from '../services/api'
import styles from './AIAssistant.module.css'

const SUGGESTIONS = [
  'Qual o prazo para acionar o seguro auto após um sinistro?',
  'O seguro residencial cobre danos por enchente?',
  'Quais documentos preciso para acionar o seguro saúde?',
  'Quais são as exclusões do seguro auto?',
  'Como acionar o reembolso do plano de saúde?',
]

export default function AIAssistant() {
  const [question, setQuestion]   = useState('')
  const [policyType, setPolicyType] = useState('')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState(null)

  async function handleSubmit() {
    const q = question.trim()
    if (!q) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await askQuestion(q, policyType || null)
      setResult(res.data)
    } catch (e) {
      const msg = e?.response?.data?.detail
      setError(
        msg ??
        'Erro ao consultar a IA. Verifique se o backend está ativo e a OPENAI_API_KEY está configurada.'
      )
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className={styles.header}>
        <h2 className={styles.title}>Assistente RAG</h2>
        <p className={styles.subtitle}>
          Faça perguntas em linguagem natural sobre as apólices indexadas no ChromaDB.
          O sistema recupera os trechos mais relevantes e gera uma resposta contextualizada.
        </p>
      </div>

      {/* ── Suggestion chips ── */}
      <div className={styles.suggestions}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            className={styles.chip}
            onClick={() => setQuestion(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* ── Input row ── */}
      <div className={styles.inputRow}>
        <input
          className={styles.input}
          placeholder="Escreva sua pergunta sobre as apólices… (Enter para enviar)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <select
          className={styles.select}
          value={policyType}
          onChange={(e) => setPolicyType(e.target.value)}
          title="Filtrar por tipo de apólice"
        >
          <option value="">Todas as apólices</option>
          <option value="auto">Auto</option>
          <option value="home">Home</option>
          <option value="health">Health</option>
        </select>
        <button
          className={styles.btn}
          onClick={handleSubmit}
          disabled={loading || !question.trim()}
        >
          {loading ? 'Consultando…' : 'Perguntar'}
        </button>
      </div>

      {/* ── Loading animation ── */}
      {loading && (
        <div className={styles.loadingBox}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span>Consultando as apólices…</span>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className={styles.errorBox}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      {/* ── Result ── */}
      {result && (
        <div>
          {/* Answer */}
          <div className={styles.answerBox}>
            <div className={styles.answerLabel}>
              <span className={styles.answerIcon}>✦</span>
              Resposta da IA
            </div>
            <div className={styles.answerText}>
              {result.answer}
            </div>
          </div>

          {/* Sources */}
          {result.sources?.length > 0 && (
            <div className={styles.sources}>
              <div className={styles.sourcesTitle}>
                Fontes utilizadas ({result.sources.length})
              </div>
              {result.sources.map((src, i) => {
                const relevance = src.relevance ?? src.score ?? 0
                const pct       = Math.round(relevance * 100)
                return (
                  <div key={i} className={styles.source}>
                    <div className={styles.sourceTop}>
                      <span className={styles.sourceName}>
                        📄 {src.source ?? `Fonte ${i + 1}`}
                      </span>
                      <span className={styles.sourceScore}>
                        Relevância: {pct}%
                      </span>
                    </div>
                    <div className={styles.scoreBarBg}>
                      <div
                        className={styles.scoreBar}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {src.content && (
                      <p className={styles.chunk}>"{src.content.slice(0, 200)}…"</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

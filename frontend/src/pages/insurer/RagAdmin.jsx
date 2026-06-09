import { useRef, useState } from 'react'
import { askQuestion, retrieveChunks } from '../../services/api'
import styles from './RagAdmin.module.css'

const SUGGESTIONS = [
  'Qual o prazo para acionar o seguro auto?',
  'O seguro residencial cobre enchentes?',
  'Quais documentos para acionar o plano de saúde?',
  'Quais são as exclusões do seguro auto?',
  'Como solicitar reembolso no seguro saúde?',
]

const WELCOME = {
  role: 'bot',
  text: 'Olá, Admin! Faça uma pergunta sobre as apólices indexadas. Os chunks recuperados aparecerão no painel de debug ao lado.',
}

export default function RagAdmin() {
  const [messages,    setMessages]    = useState([WELCOME])
  const [input,       setInput]       = useState('')
  const [policyType,  setPolicyType]  = useState('')
  const [loading,     setLoading]     = useState(false)
  const [chunks,      setChunks]      = useState([])
  const bottomRef = useRef(null)

  async function send(text) {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: q }])
    setLoading(true)
    setChunks([])

    try {
      // Fire both requests in parallel for speed
      const [askRes, retrieveRes] = await Promise.all([
        askQuestion(q, policyType || null),
        retrieveChunks(q, policyType || null).catch(() => ({ data: { results: [] } })),
      ])
      setMessages((m) => [...m, {
        role: 'bot',
        text: askRes.data.answer,
        sources: askRes.data.sources,
      }])
      setChunks(retrieveRes.data.results ?? retrieveRes.data ?? [])
    } catch (e) {
      const msg = e?.response?.data?.detail ?? 'Erro ao consultar o RAG.'
      setMessages((m) => [...m, { role: 'bot', text: `⚠️ ${msg}` }])
    } finally {
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>RAG Admin</h1>
        <p className={styles.pageSubtitle}>
          Chat com debug — veja os chunks recuperados do ChromaDB para cada pergunta
        </p>
      </div>

      <div className={styles.layout}>
        {/* ── Chat ── */}
        <div className={styles.chatCard}>
          {/* Suggestions */}
          {messages.length === 1 && (
            <div className={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <button key={s} className={styles.sugChip} onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className={styles.chatMessages}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.msgRow} ${m.role === 'user' ? styles.msgRowUser : ''}`}>
                <div className={`${styles.msgAvatar} ${m.role === 'user' ? styles.msgAvatarUser : styles.msgAvatarBot}`}>
                  {m.role === 'user' ? '👤' : '🤖'}
                </div>
                <div>
                  <div className={`${styles.msgBubble} ${m.role === 'user' ? styles.msgBubbleUser : styles.msgBubbleBot}`}>
                    {m.text}
                  </div>
                  {m.sources?.length > 0 && (
                    <div className={styles.msgSources}>
                      Fontes: {m.sources.map((s) => s.source ?? s.file ?? s).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className={styles.msgRow}>
                <div className={`${styles.msgAvatar} ${styles.msgAvatarBot}`}>🤖</div>
                <div className={`${styles.msgBubble} ${styles.msgBubbleBot}`}>
                  <div className={styles.typing}>
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className={styles.chatInputRow}>
            <select
              className={styles.chatSelect}
              value={policyType}
              onChange={(e) => setPolicyType(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="auto">Auto</option>
              <option value="home">Residencial</option>
              <option value="health">Saúde</option>
            </select>
            <textarea
              className={styles.chatInput}
              rows={1}
              placeholder="Digite uma pergunta… (Enter para enviar)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button
              className={styles.sendBtn}
              onClick={() => send()}
              disabled={!input.trim() || loading}
            >
              ➤
            </button>
          </div>
        </div>

        {/* ── Debug panel ── */}
        <div className={styles.debugCard}>
          <div className={styles.debugHeader}>
            <span className={styles.debugTitle}>Chunks Recuperados</span>
            <span className={styles.debugBadge}>GET /ask/retrieve</span>
          </div>
          {chunks.length === 0 ? (
            <div className={styles.debugEmpty}>
              Os chunks mais relevantes para a pergunta aparecerão aqui.
            </div>
          ) : (
            <div className={styles.chunkList}>
              {chunks.map((c, i) => (
                <div key={i} className={styles.chunk}>
                  <div className={styles.chunkMeta}>
                    <span className={styles.chunkSource}>{c.source ?? c.metadata?.source ?? `chunk ${i + 1}`}</span>
                    <span className={styles.chunkScore}>
                      {c.relevance != null ? `${(c.relevance * 100).toFixed(1)}%` : c.score != null ? c.score.toFixed(3) : ''}
                    </span>
                  </div>
                  <div className={styles.chunkText}>
                    {(c.content ?? c.text ?? c.document ?? '').slice(0, 300)}
                    {(c.content ?? c.text ?? c.document ?? '').length > 300 ? '…' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useRef, useState } from 'react'
import { askQuestion } from '../../services/api'
import styles from './AskAssistant.module.css'

const SUGGESTIONS = [
  'Qual o prazo para acionar meu seguro auto?',
  'Meu seguro residencial cobre danos por enchente?',
  'Quais documentos preciso para o seguro saúde?',
  'Como solicitar reembolso de consulta médica?',
]

const WELCOME = {
  role: 'bot',
  text: 'Olá! Sou seu assistente de apólices 👋\n\nPosso responder dúvidas sobre as coberturas dos seus seguros Auto, Residencial e Saúde. Como posso te ajudar?',
}

export default function AskAssistant() {
  const [messages,   setMessages]   = useState([WELCOME])
  const [input,      setInput]      = useState('')
  const [policyType, setPolicyType] = useState('')
  const [loading,    setLoading]    = useState(false)
  const bottomRef = useRef(null)

  async function send(text) {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: q }])
    setLoading(true)

    try {
      const res = await askQuestion(q, policyType || null)
      setMessages((m) => [...m, { role: 'bot', text: res.data.answer }])
    } catch (e) {
      const detail = e?.response?.data?.detail
      setMessages((m) => [...m, {
        role: 'bot',
        text: detail
          ? `Não consegui responder agora: ${detail}`
          : 'Desculpe, ocorreu um erro. Tente novamente em instantes.',
      }])
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
        <h1 className={styles.pageTitle}>Assistente IA</h1>
        <p className={styles.pageSubtitle}>
          Tire dúvidas sobre coberturas e procedimentos das suas apólices
        </p>
      </div>

      <div className={styles.chatCard}>
        {/* Suggestions — only when just the welcome message */}
        {messages.length === 1 && (
          <div className={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <button key={s} className={styles.sugChip} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className={styles.messages}>
          {messages.map((m, i) => (
            <div key={i} className={`${styles.msgRow} ${m.role === 'user' ? styles.msgRowUser : ''}`}>
              <div className={`${styles.avatar} ${m.role === 'user' ? styles.avatarUser : styles.avatarBot}`}>
                {m.role === 'user' ? '👤' : '💬'}
              </div>
              <div className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleBot}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className={styles.msgRow}>
              <div className={`${styles.avatar} ${styles.avatarBot}`}>💬</div>
              <div className={`${styles.bubble} ${styles.bubbleBot}`}>
                <div className={styles.typing}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className={styles.inputRow}>
          <select
            className={styles.policySelect}
            value={policyType}
            onChange={(e) => setPolicyType(e.target.value)}
            title="Filtrar por tipo de apólice"
          >
            <option value="">Todas as apólices</option>
            <option value="auto">Auto</option>
            <option value="home">Residencial</option>
            <option value="health">Saúde</option>
          </select>
          <textarea
            className={styles.chatInput}
            rows={1}
            placeholder="Escreva sua dúvida… (Enter para enviar)"
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
    </div>
  )
}

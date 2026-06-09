import { useState } from 'react'
import { SendHorizontal, Bot, User, BookOpen } from 'lucide-react'
import { askQuestion, ingestSeedDocuments } from '../services/api'

const WELCOME_MESSAGE = {
  role:    'assistant',
  text:    'Olá! Sou seu assistente de apólices. Posso responder perguntas sobre os planos de seguro Auto, Residencial e Saúde. O que você quer saber?',
  sources: [],
}

const SUGGESTED_QUESTIONS = [
  'Qual o prazo para acionar o seguro auto após um sinistro?',
  'O seguro residencial cobre danos por enchente?',
  'Quais documentos preciso para acionar o seguro saúde?',
]

export default function AskPolicy() {
  const [messages, setMessages]   = useState([WELCOME_MESSAGE])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [seeding, setSeeding]     = useState(false)
  const [policyType, setPolicyType] = useState('')

  const sendMessage = async (question) => {
    if (!question.trim() || loading) return

    const userMessage = { role: 'user', text: question }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await askQuestion(question, policyType || null)
      const { answer, sources } = res.data
      setMessages(prev => [...prev, { role: 'assistant', text: answer, sources }])
    } catch {
      setMessages(prev => [...prev, {
        role:    'assistant',
        text:    'Desculpe, não consegui processar sua pergunta. Verifique se os documentos foram indexados.',
        sources: [],
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await ingestSeedDocuments()
      setMessages(prev => [...prev, {
        role:    'assistant',
        text:    'Documentos indexados com sucesso! Agora você pode fazer perguntas sobre as apólices Auto, Residencial e Saúde.',
        sources: [],
      }])
    } catch {
      alert('Erro ao indexar documentos.')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-3xl">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Perguntar às Apólices</h1>
        <div className="flex items-center gap-3">
          <select
            value={policyType}
            onChange={e => setPolicyType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as apólices</option>
            <option value="auto">Auto</option>
            <option value="home">Residencial</option>
            <option value="health">Saúde</option>
          </select>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <BookOpen size={16} />
            {seeding ? 'Indexando...' : 'Indexar Docs'}
          </button>
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 bg-white rounded-xl border border-gray-100 p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-white" />
              </div>
            )}

            <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>

              {msg.sources?.length > 0 && (
                <div className="text-xs text-gray-400 px-1">
                  Fontes: {msg.sources.map(s => s.source ?? s.file).join(', ')}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-slate-600" />
              </div>
            )}
          </div>
        ))}

        {/* Indicador de digitação */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Sugestões */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTED_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full transition-colors border border-blue-100"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={e => { e.preventDefault(); sendMessage(input) }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Faça uma pergunta sobre as apólices..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white p-3 rounded-xl transition-colors"
        >
          <SendHorizontal size={18} />
        </button>
      </form>
    </div>
  )
}

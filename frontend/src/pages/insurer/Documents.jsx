import { useEffect, useRef, useState } from 'react'
import {
  ingestSeedDocuments,
  ingestFile,
  ingestText,
  getDocumentStats,
} from '../../services/api'
import styles from './Documents.module.css'

const POLICY_OPTIONS = [
  { value: 'auto',    label: 'Auto'        },
  { value: 'home',    label: 'Residencial' },
  { value: 'health',  label: 'Saúde'       },
  { value: 'general', label: 'Geral'       },
]

export default function Documents() {
  // ── Seed ──────────────────────────────────────────────────────────────────
  const [seedLoading, setSeedLoading] = useState(false)
  const [seedResult,  setSeedResult]  = useState(null)

  async function handleSeed() {
    setSeedLoading(true)
    setSeedResult(null)
    try {
      const res = await ingestSeedDocuments()
      setSeedResult({ ok: true, data: res.data })
    } catch (e) {
      setSeedResult({ ok: false, msg: e?.response?.data?.detail ?? 'Erro ao indexar.' })
    } finally {
      setSeedLoading(false)
      loadStats()
    }
  }

  // ── File upload ───────────────────────────────────────────────────────────
  const fileInputRef = useRef(null)
  const [dragOver,     setDragOver]     = useState(false)
  const [uploadFile,   setUploadFile]   = useState(null)
  const [uploadType,   setUploadType]   = useState('general')
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadResult,  setUploadResult]  = useState(null)

  function onFileDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) setUploadFile(f)
  }

  async function handleUpload() {
    if (!uploadFile) return
    setUploadLoading(true)
    setUploadResult(null)
    try {
      const res = await ingestFile(uploadFile, uploadType)
      setUploadResult({ ok: true, data: res.data })
      setUploadFile(null)
    } catch (e) {
      setUploadResult({ ok: false, msg: e?.response?.data?.detail ?? 'Erro no upload.' })
    } finally {
      setUploadLoading(false)
      loadStats()
    }
  }

  // ── Text ingest ───────────────────────────────────────────────────────────
  const [textContent,  setTextContent]  = useState('')
  const [textSource,   setTextSource]   = useState('')
  const [textType,     setTextType]     = useState('general')
  const [textLoading,  setTextLoading]  = useState(false)
  const [textResult,   setTextResult]   = useState(null)

  async function handleIngestText() {
    if (!textContent.trim() || !textSource.trim()) return
    setTextLoading(true)
    setTextResult(null)
    try {
      const res = await ingestText(textContent, textSource, textType)
      setTextResult({ ok: true, data: res.data })
      setTextContent('')
      setTextSource('')
    } catch (e) {
      setTextResult({ ok: false, msg: e?.response?.data?.detail ?? 'Erro ao indexar texto.' })
    } finally {
      setTextLoading(false)
      loadStats()
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const [stats,        setStats]        = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  async function loadStats() {
    setStatsLoading(true)
    try {
      const res = await getDocumentStats()
      setStats(res.data)
    } catch {
      setStats(null)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => { loadStats() }, [])

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Documentos & Índice Vetorial</h1>
        <p className={styles.pageSubtitle}>
          Gerencie as apólices indexadas no ChromaDB para o pipeline RAG
        </p>
      </div>

      {/* ── Stats card (full width) ── */}
      <div className={styles.cardFull}>
        <div className={styles.cardTitle}>Estado do Índice</div>
        <div className={styles.cardDesc}>Chunks armazenados no ChromaDB</div>
        {statsLoading ? (
          <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>Carregando…</p>
        ) : !stats ? (
          <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>Não disponível</p>
        ) : (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.total_chunks ?? 0}</div>
                <div className={styles.statLabel}>Total de Chunks</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.total_sources ?? 0}</div>
                <div className={styles.statLabel}>Fontes</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.collection_name ?? '—'}</div>
                <div className={styles.statLabel}>Collection</div>
              </div>
            </div>
            {stats.sources?.length > 0 && (
              <div className={styles.sourceList}>
                {stats.sources.map((s) => (
                  <div key={s.name} className={styles.sourceRow}>
                    <span className={styles.sourceName}>{s.name}</span>
                    <span className={styles.sourceCount}>{s.chunks} chunks</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.grid}>
        {/* ── Seed ── */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Carregar Exemplos</div>
          <div className={styles.cardDesc}>
            Indexa as apólices de exemplo incluídas no projeto
            (auto_policy.txt, home_policy.txt, health_policy.txt).
          </div>
          <div className={styles.seedRow}>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleSeed}
              disabled={seedLoading}
            >
              {seedLoading ? '⏳ Indexando…' : '📥 Indexar Exemplos'}
            </button>
            <button
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={loadStats}
            >
              🔄 Atualizar
            </button>
          </div>
          {seedResult && (
            <div className={`${styles.seedResult} ${seedResult.ok ? styles.seedResultOk : styles.seedResultErr}`}>
              {seedResult.ok
                ? `✓ ${seedResult.data.seeded} documentos indexados — ${
                    seedResult.data.details?.map((d) => `${d.source} (${d.chunks_created} chunks)`).join(', ')
                  }`
                : `✗ ${seedResult.msg}`}
            </div>
          )}
        </div>

        {/* ── File upload ── */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Upload de Arquivo</div>
          <div className={styles.cardDesc}>
            Envie um arquivo .txt ou .md para ser dividido em chunks e indexado.
          </div>

          <div
            className={`${styles.uploadArea} ${dragOver ? styles.uploadAreaDrag : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onFileDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={styles.uploadIcon}>📄</div>
            <div className={styles.uploadText}>Arraste um arquivo ou clique para selecionar</div>
            <div className={styles.uploadHint}>.txt ou .md — máx 5 MB</div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            className={styles.uploadHiddenInput}
            onChange={(e) => setUploadFile(e.target.files[0] ?? null)}
          />

          {uploadFile && (
            <div className={styles.fileChip}>
              📎 {uploadFile.name}
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', lineHeight: 1 }}
                onClick={() => setUploadFile(null)}
              >×</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              className={styles.select}
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value)}
            >
              {POLICY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleUpload}
              disabled={!uploadFile || uploadLoading}
            >
              {uploadLoading ? '⏳ Enviando…' : '⬆️ Fazer Upload'}
            </button>
          </div>

          {uploadResult && (
            <div className={`${styles.seedResult} ${uploadResult.ok ? styles.seedResultOk : styles.seedResultErr}`}>
              {uploadResult.ok
                ? `✓ ${uploadResult.data.source_name} — ${uploadResult.data.chunks_created} chunks indexados`
                : `✗ ${uploadResult.msg}`}
            </div>
          )}
        </div>
      </div>

      {/* ── Text ingest (full width) ── */}
      <div className={styles.cardFull}>
        <div className={styles.cardTitle}>Indexar Texto Direto</div>
        <div className={styles.cardDesc}>
          Cole o conteúdo de uma apólice ou documento e dê um nome de fonte para indexar imediatamente.
        </div>

        <div className={styles.textareaRow}>
          <div className={styles.inputRow}>
            <input
              className={styles.input}
              placeholder="Nome da fonte (ex: clausulas_especiais.txt)"
              value={textSource}
              onChange={(e) => setTextSource(e.target.value)}
            />
            <select
              className={styles.select}
              value={textType}
              onChange={(e) => setTextType(e.target.value)}
            >
              {POLICY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <textarea
            className={styles.textarea}
            placeholder="Cole aqui o conteúdo do documento a ser indexado…"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
          />
          <div>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleIngestText}
              disabled={!textContent.trim() || !textSource.trim() || textLoading}
            >
              {textLoading ? '⏳ Indexando…' : '📤 Indexar Texto'}
            </button>
          </div>
          {textResult && (
            <div className={`${styles.seedResult} ${textResult.ok ? styles.seedResultOk : styles.seedResultErr}`}>
              {textResult.ok
                ? `✓ ${textResult.data.source_name} — ${textResult.data.chunks_created} chunks indexados`
                : `✗ ${textResult.msg}`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

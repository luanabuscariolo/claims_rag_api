import { Link } from 'react-router-dom'
import styles from './Landing.module.css'

const INSURER_FEATURES = [
  'Dashboard com estatísticas e gráficos',
  'Tabela de sinistros com filtros e paginação',
  'Atualizar status e valor aprovado',
  'Upload de apólices para o índice vetorial',
  'Chat RAG com debug de chunks recuperados',
]

const CLIENT_FEATURES = [
  'Abrir novo sinistro em poucos passos',
  'Acompanhar status por número de apólice',
  'Timeline visual do andamento',
  'Assistente IA para dúvidas sobre cobertura',
]

export default function Landing() {
  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.pill}>Horizonte Seguradora · Demo</div>
        <h1 className={styles.title}>
          Gestão de Sinistros<br />
          <span className={styles.titleAccent}>com Inteligência Artificial</span>
        </h1>
        <p className={styles.subtitle}>
          Selecione o perfil para acessar o portal correspondente
        </p>
      </div>

      {/* ── Role cards ── */}
      <div className={styles.cards}>
        {/* Insurer */}
        <div className={`${styles.card} ${styles.cardInsurer}`}>
          <div className={`${styles.cardIcon} ${styles.cardIconInsurer}`}>🛡️</div>
          <div className={styles.cardTitle}>Seguradora</div>
          <div className={styles.cardDesc}>
            Painel administrativo completo para gerenciar sinistros,
            documentos e consultar o pipeline RAG.
          </div>
          <ul className={styles.featureList}>
            {INSURER_FEATURES.map((f) => (
              <li key={f} className={styles.featureItem}>
                <span className={`${styles.featureDot} ${styles.featureDotInsurer}`} />
                {f}
              </li>
            ))}
          </ul>
          <Link to="/insurer/dashboard" className={`${styles.cardBtn} ${styles.cardBtnInsurer}`}>
            Entrar como Seguradora →
          </Link>
        </div>

        {/* Client */}
        <div className={`${styles.card} ${styles.cardClient}`}>
          <div className={`${styles.cardIcon} ${styles.cardIconClient}`}>👤</div>
          <div className={styles.cardTitle}>Cliente</div>
          <div className={styles.cardDesc}>
            Portal simplificado para abrir sinistros, acompanhar
            o andamento e tirar dúvidas com o assistente IA.
          </div>
          <ul className={styles.featureList}>
            {CLIENT_FEATURES.map((f) => (
              <li key={f} className={styles.featureItem}>
                <span className={`${styles.featureDot} ${styles.featureDotClient}`} />
                {f}
              </li>
            ))}
          </ul>
          <Link to="/client/my-claims" className={`${styles.cardBtn} ${styles.cardBtnClient}`}>
            Entrar como Cliente →
          </Link>
        </div>
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          FastAPI · SQLite · ChromaDB · Sentence Transformers · LM Studio
        </p>
      </div>
    </div>
  )
}

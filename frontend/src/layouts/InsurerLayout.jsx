import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { checkHealth } from '../services/api'
import styles from './InsurerLayout.module.css'

const NAV = [
  { to: '/insurer/dashboard',  icon: '📊', label: 'Dashboard'     },
  { to: '/insurer/claims',     icon: '📋', label: 'Sinistros'     },
  { to: '/insurer/new-claim',  icon: '➕', label: 'Novo Sinistro' },
  { to: '/insurer/documents',  icon: '📁', label: 'Documentos'    },
  { to: '/insurer/rag',        icon: '🤖', label: 'RAG Admin'     },
]

export default function InsurerLayout() {
  const [apiOnline, setApiOnline] = useState(null)

  useEffect(() => {
    checkHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false))
    const id = setInterval(() => {
      checkHealth().then(() => setApiOnline(true)).catch(() => setApiOnline(false))
    }, 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={styles.layout}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>🛡️</div>
          <div className={styles.logoTitle}>Horizonte</div>
          <div className={styles.logoRole}>Seguradora</div>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navLabel}>Menu</div>
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              <span className={styles.navIcon}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.footerApi}>FastAPI + ChromaDB + LLM</div>
          <div className={styles.healthText}>
            <span className={`${styles.healthDot} ${apiOnline === false ? styles.healthDotOffline : ''}`} />
            API {apiOnline === null ? 'verificando…' : apiOnline ? 'online' : 'offline'}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <span className={styles.topbarTitle}>Portal da Seguradora</span>
          <Link to="/" className={styles.topbarBack}>← Trocar perfil</Link>
        </header>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

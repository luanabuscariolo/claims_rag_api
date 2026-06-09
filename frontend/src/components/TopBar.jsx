import styles from './TopBar.module.css'

export default function TopBar({ tabs, activeTab, onTabChange }) {
  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <span className={styles.brandSymbol}>◈</span>
        <span className={styles.brandText}>
          <strong>Insurance</strong>RAG
        </span>
      </div>

      <nav className={styles.nav}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={[
              styles.tabBtn,
              activeTab === tab.id ? styles.active : '',
              tab.id === 'new-claim' ? styles.actionTab : '',
            ].join(' ')}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  )
}

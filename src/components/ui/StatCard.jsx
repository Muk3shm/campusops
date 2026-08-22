import styles from './ui.module.css';

/**
 * A dashboard statistics card showing a metric with an icon.
 * Used in dashboards to display counts like "Open Requests: 5".
 */
export default function StatCard({ icon: Icon, label, value, variant = 'default' }) {
  return (
    <div className={`${styles.statCard} ${styles[`statCard_${variant}`] || ''}`}>
      <div className={styles.statCardIcon}>
        <Icon size={24} />
      </div>
      <div className={styles.statCardContent}>
        <span className={styles.statCardValue}>{value}</span>
        <span className={styles.statCardLabel}>{label}</span>
      </div>
    </div>
  );
}

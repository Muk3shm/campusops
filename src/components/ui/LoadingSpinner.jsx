import styles from './ui.module.css';

/**
 * A simple loading spinner. Used while waiting for data to load.
 */
export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner} />
      <p className={styles.loadingMessage}>{message}</p>
    </div>
  );
}

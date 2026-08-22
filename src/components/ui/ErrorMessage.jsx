import { AlertTriangle } from 'lucide-react';
import styles from './ui.module.css';

/**
 * Displays an error message with an icon. Used when data fails to load.
 */
export default function ErrorMessage({ message = 'Something went wrong. Please try again.' }) {
  return (
    <div className={styles.errorContainer}>
      <AlertTriangle size={24} />
      <p>{message}</p>
    </div>
  );
}

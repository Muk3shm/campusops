import styles from './ui.module.css';

/**
 * Displays a colored badge indicating the priority level of a service request.
 */
const PRIORITY_CONFIG = {
  LOW: { label: 'Low', className: 'priorityLow' },
  MEDIUM: { label: 'Medium', className: 'priorityMedium' },
  HIGH: { label: 'High', className: 'priorityHigh' },
  CRITICAL: { label: 'Critical', className: 'priorityCritical' },
};

export default function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || { label: priority, className: 'priorityLow' };

  return (
    <span className={`${styles.badge} ${styles[config.className]}`}>
      {config.label}
    </span>
  );
}

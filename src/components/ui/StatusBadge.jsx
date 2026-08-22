import styles from './ui.module.css';

/**
 * Displays a colored badge indicating the status of a service request.
 * Each status has a distinct color to help users quickly scan request lists.
 */
const STATUS_CONFIG = {
  OPEN: { label: 'Open', className: 'statusOpen' },
  ASSIGNED: { label: 'Assigned', className: 'statusAssigned' },
  IN_PROGRESS: { label: 'In Progress', className: 'statusInProgress' },
  RESOLVED: { label: 'Resolved', className: 'statusResolved' },
  CLOSED: { label: 'Closed', className: 'statusClosed' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'statusOpen' };

  return (
    <span className={`${styles.badge} ${styles[config.className]}`}>
      {config.label}
    </span>
  );
}

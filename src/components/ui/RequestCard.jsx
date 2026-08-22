import { MapPin, Clock, User } from 'lucide-react';
import { Link } from 'react-router';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import styles from './ui.module.css';

/**
 * A card displaying a summary of a service request.
 * Used in dashboards and list views. Links to the full request details.
 */
export default function RequestCard({ request }) {
  const createdDate = new Date(request.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link to={`/requests/${request.id}`} className={styles.requestCard}>
      <div className={styles.requestCardHeader}>
        <span className={styles.requestCardId}>{request.id}</span>
        <div className={styles.requestCardBadges}>
          <PriorityBadge priority={request.priority} />
          <StatusBadge status={request.status} />
        </div>
      </div>
      <h3 className={styles.requestCardTitle}>{request.title}</h3>
      <div className={styles.requestCardMeta}>
        <span className={styles.requestCardMetaItem}>
          <MapPin size={14} />
          {request.location}
        </span>
        <span className={styles.requestCardMetaItem}>
          <Clock size={14} />
          {createdDate}
        </span>
        {request.assigneeName && (
          <span className={styles.requestCardMetaItem}>
            <User size={14} />
            {request.assigneeName}
          </span>
        )}
      </div>
    </Link>
  );
}

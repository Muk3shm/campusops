import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Tag,
  MessageSquare,
  FileText,
  Edit3,
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import PriorityBadge from '@/components/ui/PriorityBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import SuggestSolutionModal from '@/components/ui/SuggestSolutionModal';
import EditRequestModal from '@/components/ui/EditRequestModal';
import { useAuth } from '@/context/AuthContext';
import { getServiceRequestById, submitKnowledgeArticleForReview } from '@/services/api';
import styles from './RequestDetailsPage.module.css';

/**
 * Full details page for a single service request.
 * Allows Technicians & Admins to document solutions from resolved requests.
 */
export default function RequestDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    async function loadRequest() {
      try {
        setLoading(true);
        const data = await getServiceRequestById(id);
        if (!data) {
          setError('Service request not found.');
        } else {
          setRequest(data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadRequest();
  }, [id]);

  async function handleDocumentSolutionSubmit(articleData) {
    await submitKnowledgeArticleForReview(articleData, user);
    alert('Solution documented successfully and submitted for Admin review (PENDING_REVIEW).');
    setIsDocModalOpen(false);
  }

  if (loading) return <LoadingSpinner message="Loading request details..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!request) return <ErrorMessage message="Request not found" />;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isResolved = request.status === 'RESOLVED' || request.status === 'CLOSED';
  const canDocument = isResolved && (user?.role === 'TECHNICIAN' || user?.role === 'ADMIN');
  const isStudentOrStaff = user?.role === 'STUDENT' || user?.role === 'STAFF';
  const isOwner = request.reportedBy === user?.email;
  const canEdit = isStudentOrStaff && isOwner && request.status === 'OPEN';

  return (
    <div className={styles.page}>
      <Link to="/requests" className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to Requests
      </Link>

      <div className={styles.header}>
        <div className={styles.headerTop}>
          <span className={styles.requestId}>{request.id}</span>
          <div className={styles.badges}>
            {canEdit && (
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.8125rem', gap: '6px' }}
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit3 size={14} />
                Edit Request
              </button>
            )}
            <PriorityBadge priority={request.priority} />
            <StatusBadge status={request.status} />
          </div>
        </div>
        <h1 className={styles.title}>{request.title}</h1>
      </div>

      <div className={styles.content}>
        {/* Details Card */}
        <div className={styles.detailsCard}>
          <h2 className={styles.sectionTitle}>Details</h2>

          <div className={styles.detailsList}>
            <div className={styles.detailItem}>
              <Tag size={16} />
              <div>
                <span className={styles.detailLabel}>Category</span>
                <span className={styles.detailValue}>{request.category}</span>
              </div>
            </div>
            <div className={styles.detailItem}>
              <MapPin size={16} />
              <div>
                <span className={styles.detailLabel}>Location</span>
                <span className={styles.detailValue}>{request.location}</span>
              </div>
            </div>
            <div className={styles.detailItem}>
              <User size={16} />
              <div>
                <span className={styles.detailLabel}>Reported By</span>
                <span className={styles.detailValue}>{request.reporterName}</span>
              </div>
            </div>
            {request.assigneeName && (
              <div className={styles.detailItem}>
                <User size={16} />
                <div>
                  <span className={styles.detailLabel}>Assigned To</span>
                  <span className={styles.detailValue}>{request.assigneeName}</span>
                </div>
              </div>
            )}
            <div className={styles.detailItem}>
              <Clock size={16} />
              <div>
                <span className={styles.detailLabel}>Created</span>
                <span className={styles.detailValue}>{formatDate(request.createdAt)}</span>
              </div>
            </div>
            <div className={styles.detailItem}>
              <Clock size={16} />
              <div>
                <span className={styles.detailLabel}>Last Updated</span>
                <span className={styles.detailValue}>{formatDate(request.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className={styles.descriptionCard}>
          <h2 className={styles.sectionTitle}>
            <MessageSquare size={18} />
            Description
          </h2>
          <p className={styles.description}>{request.description}</p>
        </div>

        {/* Resolution Notes (if resolved/closed) */}
        {request.resolutionNotes && (
          <div className={styles.resolutionCard}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Resolution</h2>
              {canDocument && (
                <button
                  className="btn btn-secondary"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.8125rem',
                    gap: '6px',
                    backgroundColor: '#f0fdf4',
                    color: '#166534',
                    borderColor: '#bbf7d0',
                  }}
                  onClick={() => setIsDocModalOpen(true)}
                >
                  <FileText size={14} />
                  Document this Solution
                </button>
              )}
            </div>
            <p className={styles.description}>{request.resolutionNotes}</p>
            {request.resolvedAt && (
              <p className={styles.resolvedAt}>Resolved on {formatDate(request.resolvedAt)}</p>
            )}
          </div>
        )}
      </div>

      {/* Solution Documentation Modal */}
      {isDocModalOpen && (
        <SuggestSolutionModal
          isOpen={isDocModalOpen}
          onClose={() => setIsDocModalOpen(false)}
          onSubmit={handleDocumentSolutionSubmit}
          initialData={{
            title: request.title,
            category: request.category,
            problem: request.description,
            symptoms: `${request.title} at ${request.location}`,
            steps: request.resolutionNotes ? [request.resolutionNotes] : [''],
            relatedRequestId: request.id,
          }}
        />
      )}

      {/* Edit Request Modal */}
      {isEditModalOpen && (
        <EditRequestModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          request={request}
          onSuccess={(updated) => setRequest(updated)}
        />
      )}
    </div>
  );
}

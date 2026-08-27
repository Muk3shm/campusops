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
  X,
  Save,
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import PriorityBadge from '@/components/ui/PriorityBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import SuggestSolutionModal from '@/components/ui/SuggestSolutionModal';
import EditRequestModal from '@/components/ui/EditRequestModal';
import { useAuth } from '@/context/AuthContext';
import { getServiceRequestById, submitKnowledgeArticleForReview, updateServiceRequestStatus } from '@/services/api';
import { REQUEST_STATUSES } from '@/data/mockRequests';
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
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  async function handleStatusUpdateSubmit(e) {
    e.preventDefault();
    if (!request) return;
    try {
      setUpdatingStatus(true);
      const updated = await updateServiceRequestStatus(request.id, newStatus, resolutionNotes);
      setRequest(updated);
      setIsStatusModalOpen(false);
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
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

  const isAdmin = user?.role === 'ADMIN';
  const isStudentOrStaff = user?.role === 'STUDENT' || user?.role === 'STAFF';
  const isTechnician = user?.role === 'TECHNICIAN';

  const userSub = user?.sub || user?.id;
  const userEmail = user?.email;
  const userId = user?.id;

  const isOwner = Boolean(
    (userEmail && request.reportedBy === userEmail) ||
    (userId && request.reportedBy === userId) ||
    (userSub && request.reportedBy === userSub) ||
    (userSub && request.reporterSub === userSub)
  );

  const isAssignedTechnician = Boolean(
    (userSub && request.assignedToSub === userSub) ||
    (userSub && request.assignedTo === userSub) ||
    (userEmail && request.assignedTo === userEmail) ||
    (userId && request.assignedTo === userId)
  );

  const canEditContent =
    isAdmin ||
    (
      isStudentOrStaff &&
      isOwner &&
      request.status === 'OPEN'
    );

  const canUpdateStatus =
    isAdmin ||
    (
      isTechnician &&
      isAssignedTechnician
    );

  const isResolved = request.status === 'RESOLVED' || request.status === 'CLOSED';
  const canDocument = isResolved && (isTechnician || isAdmin);

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
            {canEditContent && (
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.8125rem', gap: '6px' }}
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit3 size={14} />
                Edit Request
              </button>
            )}
            {canUpdateStatus && (
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.8125rem', gap: '6px' }}
                onClick={() => {
                  setNewStatus(request.status);
                  setResolutionNotes(request.resolutionNotes || '');
                  setIsStatusModalOpen(true);
                }}
              >
                <Edit3 size={14} />
                Update Status
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
                <span className={styles.detailValue}>{request.reporterName || request.reportedBy}</span>
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

      {/* Update Status Modal for Technician & Admin */}
      {isStatusModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
            padding: '16px',
          }}
          onClick={() => setIsStatusModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: 'var(--color-card)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text)' }}>
                Update Work Order: {request.id}
              </h3>
              <button
                style={{ border: 'none', background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                onClick={() => setIsStatusModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStatusUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                <strong>{request.title}</strong> — {request.location}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="modalStatus" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text)' }}>
                  Workflow Status
                </label>
                <select
                  id="modalStatus"
                  className="input"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {REQUEST_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="modalNotes" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text)' }}>
                  Resolution / Progress Notes
                </label>
                <textarea
                  id="modalNotes"
                  className="input"
                  rows={4}
                  placeholder="Describe work performed or resolution details..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsStatusModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updatingStatus}
                >
                  <Save size={16} />
                  {updatingStatus ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


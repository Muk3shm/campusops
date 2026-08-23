import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Wrench,
  ClipboardList,
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit3,
  X,
  Save,
  FileText,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import PriorityBadge from '@/components/ui/PriorityBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import SuggestSolutionModal from '@/components/ui/SuggestSolutionModal';
import {
  getServiceRequests,
  updateServiceRequestStatus,
  submitKnowledgeArticleForReview,
  deleteServiceRequest,
} from '@/services/api';
import { REQUEST_STATUSES } from '@/data/mockRequests';
import styles from './TechnicianDashboard.module.css';

/**
 * Technician Workspace & Dashboard.
 * Displays assigned work orders, status workflow updates, and "Document this Solution" knowledge creation.
 */
export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status update modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Solution documentation modal state
  const [docTargetRequest, setDocTargetRequest] = useState(null);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getServiceRequests(user);
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenUpdateModal(req, e) {
    e.stopPropagation();
    setSelectedRequest(req);
    setNewStatus(req.status);
    setResolutionNotes(req.resolutionNotes || '');
  }

  async function handleSaveStatus(e) {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      setUpdating(true);
      await updateServiceRequestStatus(selectedRequest.id, newStatus, resolutionNotes);
      setSelectedRequest(null);
      await loadData();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdating(false);
    }
  }

  function handleOpenDocModal(req, e) {
    if (e) e.stopPropagation();
    setDocTargetRequest(req);
  }

  async function handleDocumentSolutionSubmit(articleData) {
    await submitKnowledgeArticleForReview(articleData, user);
    alert('Solution documented successfully and submitted for Admin review (PENDING_REVIEW).');
    setDocTargetRequest(null);
  }

  async function handleDeleteRequest(req, e) {
    if (e) e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to delete request ${req.id}?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteServiceRequest(req.id);
      await loadData();
    } catch (err) {
      alert('Failed to delete request: ' + err.message);
    }
  }

  const assignedToMe = requests.length;
  const openAssigned = requests.filter(r => r.status === 'ASSIGNED' || r.status === 'OPEN').length;
  const inProgress = requests.filter(r => r.status === 'IN_PROGRESS').length;
  const resolvedThisWeek = requests.filter(r => r.status === 'RESOLVED' || r.status === 'CLOSED').length;

  const columns = [
    { key: 'id', label: 'Request ID' },
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    {
      key: 'priority',
      label: 'Priority',
      render: (value) => <PriorityBadge priority={value} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    { key: 'location', label: 'Location' },
    {
      key: 'reportedBy',
      label: 'Reported By',
      render: (val, row) => row.reporterName || val,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
            onClick={(e) => handleOpenUpdateModal(row, e)}
          >
            <Edit3 size={12} />
            Update Status
          </button>

          {(row.status === 'RESOLVED' || row.status === 'CLOSED') && (
            <button
              className="btn btn-secondary"
              style={{
                padding: '4px 8px',
                fontSize: '0.75rem',
                gap: '4px',
                backgroundColor: '#f0fdf4',
                color: '#166534',
                borderColor: '#bbf7d0',
              }}
              onClick={(e) => handleOpenDocModal(row, e)}
            >
              <FileText size={12} />
              Document Solution
            </button>
          )}

          {user?.role === 'TECHNICIAN' && (
            <button
              className="btn btn-danger"
              style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
              onClick={(e) => handleDeleteRequest(row, e)}
            >
              <Trash2 size={12} />
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner message="Loading technician workspace..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Wrench size={24} />
            Technician Workspace
          </h1>
          <p className={styles.pageSubtitle}>
            Assigned to: <strong>{user?.name}</strong> ({user?.specialization || 'Facility & Technical Services'})
          </p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatCard icon={ClipboardList} label="Assigned to Me" value={assignedToMe} variant="purple" />
        <StatCard icon={AlertTriangle} label="Open / Assigned" value={openAssigned} variant="warning" />
        <StatCard icon={Clock} label="In Progress" value={inProgress} />
        <StatCard icon={CheckCircle} label="Resolved Work Orders" value={resolvedThisWeek} variant="success" />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Assigned Work Orders</h2>
        <DataTable
          columns={columns}
          data={requests}
          onRowClick={(row) => navigate(`/requests/${row.id}`)}
        />
      </div>

      {/* Modal for updating status */}
      {selectedRequest && (
        <div className={styles.modalOverlay} onClick={() => setSelectedRequest(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Update Work Order: {selectedRequest.id}</h3>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedRequest(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className={styles.modalForm}>
              <p className={styles.modalSub}>
                <strong>{selectedRequest.title}</strong> — {selectedRequest.location}
              </p>

              <div className={styles.formGroup}>
                <label htmlFor="modalStatus" className={styles.label}>Workflow Status</label>
                <select
                  id="modalStatus"
                  className="input"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {REQUEST_STATUSES.map(st => (
                    <option key={st} value={st}>{st.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="modalNotes" className={styles.label}>Resolution / Progress Notes</label>
                <textarea
                  id="modalNotes"
                  className="input"
                  rows={4}
                  placeholder="Describe work performed or resolution details..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedRequest(null)}
                >
                  Cancel
                </button>

                {newStatus === 'RESOLVED' && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ backgroundColor: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0', gap: '6px' }}
                    onClick={() => {
                      const reqToDoc = { ...selectedRequest, resolutionNotes };
                      setSelectedRequest(null);
                      handleOpenDocModal(reqToDoc);
                    }}
                  >
                    <FileText size={16} />
                    Document Solution
                  </button>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updating}
                >
                  <Save size={16} />
                  {updating ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Solution Documentation Modal */}
      {docTargetRequest && (
        <SuggestSolutionModal
          isOpen={Boolean(docTargetRequest)}
          onClose={() => setDocTargetRequest(null)}
          onSubmit={handleDocumentSolutionSubmit}
          initialData={{
            title: docTargetRequest.title,
            category: docTargetRequest.category,
            problem: docTargetRequest.description,
            symptoms: `${docTargetRequest.title} at ${docTargetRequest.location}`,
            steps: docTargetRequest.resolutionNotes ? [docTargetRequest.resolutionNotes] : [''],
            relatedRequestId: docTargetRequest.id,
          }}
        />
      )}
    </div>
  );
}

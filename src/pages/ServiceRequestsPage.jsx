import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router';
import { PlusCircle, Filter, Edit3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import PriorityBadge from '@/components/ui/PriorityBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import EditRequestModal from '@/components/ui/EditRequestModal';
import { getServiceRequests } from '@/services/api';
import { REQUEST_STATUSES, REQUEST_PRIORITIES } from '@/data/mockRequests';
import styles from './ServiceRequestsPage.module.css';

/**
 * Service Requests listing page.
 * Filterable table reflecting role ownership (Student sees own, Technician sees assigned, Admin sees all).
 */
export default function ServiceRequestsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const initialStatusFilter = searchParams.get('status') || 'ALL';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [editingRequest, setEditingRequest] = useState(null);

  useEffect(() => {
    async function loadRequests() {
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
    loadRequests();
  }, [user]);

  // Sync state if query parameter changes
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus) {
      setStatusFilter(urlStatus);
    }
  }, [searchParams]);

  // Apply filters
  const filteredRequests = requests.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;
    return true;
  });

  // Table column definitions
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'location', label: 'Location' },
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
    {
      key: 'reportedBy',
      label: 'Reported By',
      render: (value, row) => row.reporterName || value,
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value) =>
        new Date(value).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        }),
    },
    ...((user?.role === 'STUDENT' || user?.role === 'STAFF')
      ? [
          {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => {
              const isOwner = Boolean(
                (user?.sub && row.reporterSub === user.sub) ||
                (user?.email && row.reportedBy === user.email) ||
                (user?.id && row.reportedBy === user.id)
              );
              const canEdit = isOwner && row.status === 'OPEN';
              if (!canEdit) return null;
              return (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingRequest(row);
                  }}
                >
                  <Edit3 size={12} />
                  Edit
                </button>
              );
            },
          },
        ]
      : []),
  ];

  const getPageHeading = () => {
    if (user?.role === 'STUDENT') return 'My Service Requests';
    if (user?.role === 'STAFF') return 'My Service Requests';
    if (user?.role === 'TECHNICIAN') return 'My Assigned Requests';
    return 'All Campus Service Requests';
  };

  if (loading) return <LoadingSpinner message="Loading service requests..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{getPageHeading()}</h1>
          <p className={styles.pageSubtitle}>
            {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} found
          </p>
        </div>
        {user?.role === 'STUDENT' && (
          <Link to="/requests/new" className="btn btn-primary">
            <PlusCircle size={18} />
            New Request
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <Filter size={16} className={styles.filterIcon} />
        <select
          className="input"
          style={{ maxWidth: 180 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          {REQUEST_STATUSES.map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          className="input"
          style={{ maxWidth: 180 }}
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
        >
          <option value="ALL">All Priorities</option>
          {REQUEST_PRIORITIES.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Requests Table */}
      <DataTable
        columns={columns}
        data={filteredRequests}
        onRowClick={(row) => navigate(`/requests/${row.id}`)}
      />

      {/* Edit Request Modal */}
      {editingRequest && (
        <EditRequestModal
          isOpen={Boolean(editingRequest)}
          onClose={() => setEditingRequest(null)}
          request={editingRequest}
          onSuccess={() => {
            getServiceRequests(user).then(setRequests).catch(console.error);
          }}
        />
      )}
    </div>
  );
}

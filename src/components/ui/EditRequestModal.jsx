import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { REQUEST_CATEGORIES, REQUEST_PRIORITIES } from '@/data/mockRequests';
import { updateServiceRequest } from '@/services/api';
import styles from './EditRequestModal.module.css';

/**
 * Modal dialog for Student/Staff to edit their open service request.
 * Allows editing title, category, priority, location, and description only.
 */
export default function EditRequestModal({ isOpen, onClose, request, onSuccess }) {
  if (!isOpen || !request) return null;

  const [formData, setFormData] = useState({
    title: request.title || '',
    category: request.category || '',
    priority: request.priority || 'MEDIUM',
    location: request.location || '',
    description: request.description || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim() || !formData.category || !formData.location.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const updated = await updateServiceRequest(request.id, formData);
      onSuccess?.(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update service request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Edit Service Request</h3>
            <p className={styles.subtitle}>
              Request ID: <strong>{request.id}</strong> (Status: {request.status})
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="edit-title" className={styles.label}>Title *</label>
            <input
              id="edit-title"
              name="title"
              type="text"
              className="input"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="edit-category" className={styles.label}>Category *</label>
              <select
                id="edit-category"
                name="category"
                className="input"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                {REQUEST_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="edit-priority" className={styles.label}>Priority *</label>
              <select
                id="edit-priority"
                name="priority"
                className="input"
                value={formData.priority}
                onChange={handleChange}
                required
              >
                {REQUEST_PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="edit-location" className={styles.label}>Location *</label>
            <input
              id="edit-location"
              name="location"
              type="text"
              className="input"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="edit-description" className={styles.label}>Description *</label>
            <textarea
              id="edit-description"
              name="description"
              className="input"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              <Save size={16} style={{ marginRight: '6px' }} />
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

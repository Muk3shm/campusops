import { useState } from 'react';
import { X, Plus, Trash2, Send } from 'lucide-react';
import { REQUEST_CATEGORIES } from '@/data/mockRequests';
import styles from './SuggestSolutionModal.module.css';

/**
 * Modal dialog for Students and Technicians to suggest/submit a Knowledge Article for review.
 * Submitted articles receive status "PENDING_REVIEW".
 */
export default function SuggestSolutionModal({ isOpen, onClose, onSubmit, initialData = {} }) {
  const [title, setTitle] = useState(initialData.title || '');
  const [category, setCategory] = useState(initialData.category || '');
  const [problem, setProblem] = useState(initialData.problem || initialData.description || '');
  const [symptoms, setSymptoms] = useState(
    initialData.symptoms ? (Array.isArray(initialData.symptoms) ? initialData.symptoms.join('\n') : initialData.symptoms) : ''
  );
  const [steps, setSteps] = useState(
    initialData.steps && Array.isArray(initialData.steps) && initialData.steps.length > 0
      ? initialData.steps
      : ['']
  );
  const [additionalNotes, setAdditionalNotes] = useState(initialData.additionalNotes || '');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  function handleAddStep() {
    setSteps(prev => [...prev, '']);
  }

  function handleStepChange(index, value) {
    setSteps(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }

  function handleRemoveStep(index) {
    if (steps.length <= 1) return;
    setSteps(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !category || !problem.trim()) {
      alert('Please fill out all required fields (*)');
      return;
    }

    const filteredSteps = steps.map(s => s.trim()).filter(Boolean);
    if (filteredSteps.length === 0) {
      alert('Please enter at least one troubleshooting step.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        title: title.trim(),
        category,
        problem: problem.trim(),
        symptoms: symptoms.trim(),
        steps: filteredSteps,
        additionalNotes: additionalNotes.trim(),
        relatedRequestId: initialData.relatedRequestId || null,
      });
      onClose();
    } catch (err) {
      alert('Failed to submit solution: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Suggest a Knowledge Article</h2>
            <p className={styles.subtitle}>
              Share your solution to help other campus users resolve issues quickly.
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="articleTitle" className={styles.label}>Article Title *</label>
            <input
              id="articleTitle"
              type="text"
              className="input"
              placeholder="e.g. Fixing Wi-Fi Authentication Errors in Block A"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="articleCategory" className={styles.label}>Category *</label>
            <select
              id="articleCategory"
              className="input"
              value={category}
              onChange={e => setCategory(e.target.value)}
              required
            >
              <option value="">Select Category</option>
              {REQUEST_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="articleProblem" className={styles.label}>Problem Description *</label>
            <textarea
              id="articleProblem"
              className="input"
              rows={3}
              placeholder="Describe the issue or error that occurs..."
              value={problem}
              onChange={e => setProblem(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="articleSymptoms" className={styles.label}>Symptoms (One per line)</label>
            <textarea
              id="articleSymptoms"
              className="input"
              rows={3}
              placeholder="e.g. Wi-Fi shows exclamation mark&#10;Portal page fails to load"
              value={symptoms}
              onChange={e => setSymptoms(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <div className={styles.stepsHeader}>
              <label className={styles.label}>Troubleshooting Steps *</label>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '2px 8px', fontSize: '0.75rem', gap: '4px' }}
                onClick={handleAddStep}
              >
                <Plus size={12} />
                Add Step
              </button>
            </div>

            <div className={styles.stepsList}>
              {steps.map((step, idx) => (
                <div key={idx} className={styles.stepRow}>
                  <span className={styles.stepNum}>{idx + 1}.</span>
                  <input
                    type="text"
                    className="input"
                    placeholder={`Step ${idx + 1} action...`}
                    value={step}
                    onChange={e => handleStepChange(idx, e.target.value)}
                    required
                  />
                  {steps.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeStepBtn}
                      onClick={() => handleRemoveStep(idx)}
                      aria-label="Remove step"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="articleNotes" className={styles.label}>Additional Notes / Tips</label>
            <textarea
              id="articleNotes"
              className="input"
              rows={2}
              placeholder="Any extra recommendations or emergency escalation guidance..."
              value={additionalNotes}
              onChange={e => setAdditionalNotes(e.target.value)}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Send size={16} />
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

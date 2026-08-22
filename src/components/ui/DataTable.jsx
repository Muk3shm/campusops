import styles from './ui.module.css';

/**
 * A reusable table component that renders data with configurable columns.
 * 
 * Props:
 *   columns - Array of { key, label, render? } objects.
 *              'render' is an optional function(value, row) for custom cell rendering.
 *   data    - Array of row objects.
 *   onRowClick - Optional callback when a row is clicked.
 */
export default function DataTable({ columns, data, onRowClick }) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.tableEmpty}>
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? styles.tableRowClickable : ''}
              >
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

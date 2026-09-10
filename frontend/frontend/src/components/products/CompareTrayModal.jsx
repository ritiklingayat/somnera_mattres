import { getPrice } from '../../data/productsData';
import { getMinProductPrice } from '../../utils/productFilterUtils';

export function CompareTrayModal({ comparedProducts = [], onRemove, onClearAll, isOpen, onClose }) {
  if (!comparedProducts.length) return null;

  return (
    <>
      {/* Floating Bottom Compare Tray */}
      {!isOpen && (
        <div className="compare-floating-bar">
          <div className="compare-bar-content container">
            <div className="compared-items-preview">
              <span className="compare-bar-title">Comparing ({comparedProducts.length}/3):</span>
              <div className="compare-thumbnails">
                {comparedProducts.map((p) => (
                  <div key={p.id} className="thumb-item">
                    <img src={p.image} alt={p.name} />
                    <span>{p.name}</span>
                    <button type="button" onClick={() => onRemove(p.id)} className="thumb-remove-btn">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="compare-bar-actions">
              <button type="button" className="compare-clear-btn" onClick={onClearAll}>
                Clear
              </button>
              <button type="button" className="compare-launch-btn" onClick={onClose}>
                COMPARE NOW
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side by Side Comparison Modal */}
      {isOpen && (
        <div className="compare-modal-backdrop" onClick={onClose}>
          <div className="compare-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="compare-modal-header">
              <h2>Compare Mattresses ({comparedProducts.length})</h2>
              <button type="button" className="compare-close-btn" onClick={onClose}>
                ✕
              </button>
            </div>

            <div className="compare-table-wrapper">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Specification</th>
                    {comparedProducts.map((p) => (
                      <th key={p.id}>
                        <div className="compare-head-item">
                          <img src={p.image} alt={p.name} />
                          <h3>{p.name}</h3>
                          <button
                            type="button"
                            className="compare-table-remove"
                            onClick={() => onRemove(p.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Starting Price</strong></td>
                    {comparedProducts.map((p) => (
                      <td key={p.id}>
                        <strong>₹{getMinProductPrice(p).toLocaleString('en-IN')}</strong>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>Firmness / Feel</strong></td>
                    {comparedProducts.map((p) => (
                      <td key={p.id}>{p.firmness || 'Medium firm'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>Warranty</strong></td>
                    {comparedProducts.map((p) => (
                      <td key={p.id}>{p.warranty || '10 years'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>Materials</strong></td>
                    {comparedProducts.map((p) => (
                      <td key={p.id}>
                        {Array.isArray(p.materials) ? p.materials.join(', ') : p.materials || 'High Resilience Foam'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>Available Thickness</strong></td>
                    {comparedProducts.map((p) => (
                      <td key={p.id}>
                        {Object.keys(p.prices || {}).map((t) => `${t}"`).join(', ') || '6"'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td><strong>User Rating</strong></td>
                    {comparedProducts.map((p) => (
                      <td key={p.id}>★ {p.rating || 4.8} ({p.reviewCount || 28} reviews)</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

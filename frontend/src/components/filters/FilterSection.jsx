import { useState } from 'react';
import { normalizeFilterValue } from '../../utils/productFilterUtils';

export function FilterSection({
  title,
  options = [],
  selectedValues = [],
  onToggle,
  counts = {},
  defaultOpen = true,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const getCount = (value) => {
    const norm = normalizeFilterValue(value);
    return counts[value] || counts[String(value).toLowerCase()] || counts[norm] || 0;
  };

  return (
    <div className={`filter-section ${isOpen ? 'is-open' : 'is-closed'}`}>
      <button
        type="button"
        className="filter-section-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="filter-section-title">{title}</span>
        <span className="filter-accordion-icon">{isOpen ? '−' : '+'}</span>
      </button>

      {isOpen && (
        <div className="filter-section-content">
          <div className="filter-chips-container">
            {options.map((option) => {
              const label = typeof option === 'string' ? option : option.label;
              const value = typeof option === 'string' ? option : option.value;
              const isSelected = selectedValues.some(
                (selected) => normalizeFilterValue(selected) === normalizeFilterValue(value)
              );
              const count = getCount(value);

              return (
                <button
                  type="button"
                  key={value}
                  className={`filter-chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => onToggle(value)}
                  aria-pressed={isSelected}
                >
                  <span className="chip-label">{label}</span>
                  {count > 0 && <span className="chip-count">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

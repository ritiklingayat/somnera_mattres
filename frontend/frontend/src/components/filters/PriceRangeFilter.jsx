import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Dual-handle price range filter.
 * - Two overlapping range inputs for min/max control.
 * - Numeric inputs for direct entry.
 * - Handles never cross; min thumb gets higher z-index when near max.
 * - INR formatted labels below the track.
 * - All comparison done on plain numbers (never formatted strings).
 */
export function PriceRangeFilter({ min, max, currentMin, currentMax, onChange }) {
  const [localMin, setLocalMin] = useState(currentMin);
  const [localMax, setLocalMax] = useState(currentMax);

  // Sync external state changes (e.g. Clear Filters)
  useEffect(() => {
    setLocalMin(currentMin);
    setLocalMax(currentMax);
  }, [currentMin, currentMax]);

  const safeMin = Number.isFinite(min) && min > 0 ? min : 0;
  const safeMax = Number.isFinite(max) && max > safeMin ? max : safeMin + 1;

  const range = safeMax - safeMin || 1;

  const minPercent = Math.max(0, Math.min(100, ((localMin - safeMin) / range) * 100));
  const maxPercent = Math.max(0, Math.min(100, ((localMax - safeMin) / range) * 100));

  const commitRef = useRef(null);

  // Debounce calling onChange so filter doesn't fire on every pixel of drag
  const scheduleCommit = useCallback(
    (nextMin, nextMax) => {
      if (commitRef.current) clearTimeout(commitRef.current);
      commitRef.current = setTimeout(() => {
        onChange(nextMin, nextMax);
      }, 120);
    },
    [onChange]
  );

  const handleMinSlider = (e) => {
    const val = Math.min(Number(e.target.value), localMax - 1);
    setLocalMin(val);
    scheduleCommit(val, localMax);
  };

  const handleMaxSlider = (e) => {
    const val = Math.max(Number(e.target.value), localMin + 1);
    setLocalMax(val);
    scheduleCommit(localMin, val);
  };

  const handleMinInput = (e) => {
    const val = Number(e.target.value);
    if (!Number.isFinite(val)) return;
    const clamped = Math.max(safeMin, Math.min(val, localMax - 1));
    setLocalMin(clamped);
    scheduleCommit(clamped, localMax);
  };

  const handleMaxInput = (e) => {
    const val = Number(e.target.value);
    if (!Number.isFinite(val)) return;
    const clamped = Math.min(safeMax, Math.max(val, localMin + 1));
    setLocalMax(clamped);
    scheduleCommit(localMin, clamped);
  };

  // When min thumb is close to max, raise its z-index so it's still draggable
  const minThumbStyle = minPercent >= 97 ? { zIndex: 5 } : {};

  const fmt = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

  return (
    <div className="price-range-filter">
      <h3 className="filter-title">Price Range</h3>

      {/* Numeric input boxes */}
      <div className="price-inputs-row">
        <div className="price-input-box">
          <label htmlFor="min-price-input">MIN</label>
          <input
            id="min-price-input"
            type="number"
            value={localMin}
            min={safeMin}
            max={safeMax}
            step={100}
            onChange={handleMinInput}
          />
        </div>
        <span className="price-separator">–</span>
        <div className="price-input-box">
          <label htmlFor="max-price-input">MAX</label>
          <input
            id="max-price-input"
            type="number"
            value={localMax}
            min={safeMin}
            max={safeMax}
            step={100}
            onChange={handleMaxInput}
          />
        </div>
      </div>

      {/* Dual range slider */}
      <div className="dual-slider-container">
        {/* Background track */}
        <div className="slider-track" />
        {/* Active range highlight */}
        <div
          className="slider-range"
          style={{
            left: `${minPercent}%`,
            width: `${Math.max(0, maxPercent - minPercent)}%`,
          }}
        />
        {/* Min thumb */}
        <input
          type="range"
          min={safeMin}
          max={safeMax}
          step={100}
          value={localMin}
          onChange={handleMinSlider}
          className="thumb thumb-left"
          aria-label="Minimum price"
          style={minThumbStyle}
        />
        {/* Max thumb */}
        <input
          type="range"
          min={safeMin}
          max={safeMax}
          step={100}
          value={localMax}
          onChange={handleMaxSlider}
          className="thumb thumb-right"
          aria-label="Maximum price"
        />
      </div>

      {/* Floor / ceiling labels */}
      <div className="price-labels">
        <span>{fmt(safeMin)}</span>
        <span>{fmt(safeMax)}</span>
      </div>
    </div>
  );
}

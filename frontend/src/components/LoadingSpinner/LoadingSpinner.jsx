import './LoadingSpinner.css';

export default function LoadingSpinner({ label = 'Loading...', inline = false }) {
  return (
    <span className={`somnera-loader${inline ? ' somnera-loader--inline' : ''}`} role="status" aria-live="polite">
      <span className="somnera-loader__ring" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

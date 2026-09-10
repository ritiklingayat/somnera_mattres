export default function StatusBadge({ status }) {
  return <span className={`order-status status-${status.toLowerCase()}`}>{status}</span>;
}

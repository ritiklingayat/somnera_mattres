export default function AdminModal({ title, children, onClose }) {
  return <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="admin-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
      <h2>{title}</h2>
      {children}
    </section>
  </div>;
}

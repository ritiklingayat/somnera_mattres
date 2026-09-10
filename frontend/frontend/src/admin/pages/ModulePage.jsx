import { useState } from 'react';
import AdminModal from '../components/AdminModal';

export default function ModulePage({ config, records = [], onAdd, onUpdate, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const openAdd = () => {
    setEditingRecord(null);
    setIsOpen(true);
  };

  const openEdit = (record) => {
    setEditingRecord(record);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setEditingRecord(null);
  };

  const save = (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (editingRecord) {
      onUpdate({ ...editingRecord, values });
    } else {
      onAdd({ id: crypto.randomUUID(), values });
    }
    close();
  };

  return (
    <>
      <div className="admin-title">
        <div>
          <p>{config.subtitle}</p>
          <h1>{config.title}</h1>
        </div>
        <button className="admin-action" onClick={openAdd}>
          + {config.action}
        </button>
      </div>
      <section className="admin-card module-empty">
        {records.length ? (
          <div className="module-records">
            {records.map((record) => (
              <div key={record.id}>
                {Object.values(record.values).map((value, i) => (
                  <span key={i}>{value}</span>
                ))}
                <button onClick={() => openEdit(record)}>Edit</button>
                <button onClick={() => onDelete(record.id)}>Remove</button>
              </div>
            ))}
          </div>
        ) : (
          <>
            <span>✦</span>
            <h2>{config.empty}</h2>
            <p>
              Use the action above to add your first record. Your changes remain available while this browser session is open.
            </p>
            <button onClick={openAdd}>{config.action}</button>
          </>
        )}
      </section>
      {isOpen && (
        <AdminModal title={editingRecord ? `Edit ${config.title}` : config.action} onClose={close}>
          <form className="admin-form-stack" onSubmit={save}>
            {config.fields.map((field) => {
              const name = field.toLowerCase().replaceAll(' ', '-');
              const defaultValue = editingRecord?.values?.[name] || '';
              const isDateField = field.toLowerCase().includes('date') || name.includes('date');
              return (
                <label key={field}>
                  {field}
                  <input type={isDateField ? 'date' : 'text'} required name={name} defaultValue={defaultValue} />
                </label>
              );
            })}
            <button className="admin-action">Save</button>
          </form>
        </AdminModal>
      )}
    </>
  );
}

import { useEffect, useState } from 'react';

import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import AdminModal from '../components/AdminModal';
import {
  addAdminShowroomApi,
  deleteAdminShowroomApi,
  getAdminShowroomsApi,
  updateAdminShowroomApi,
} from '../services/adminShowroomService';

const emptyShowroom = {
  name: '', city: '', address: '', phone: '', hours: '', facilities: '', mapUrl: '', isActive: true, sortOrder: 0,
};

function toDraft(showroom) {
  if (!showroom) return emptyShowroom;
  return {
    ...emptyShowroom,
    ...showroom,
    facilities: Array.isArray(showroom.facilities) ? showroom.facilities.join(', ') : '',
  };
}

function ShowroomForm({ showroom, onSave, onClose }) {
  const [draft, setDraft] = useState(() => toDraft(showroom));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const setValue = (event) => {
    const { name, value, type, checked } = event.target;
    setDraft((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const name = draft.name.trim();
    const city = draft.city.trim();
    const address = draft.address.trim();
    const phoneDigits = draft.phone.replace(/\D/g, '');
    const hours = draft.hours.trim();
    const facilities = draft.facilities.split(',').map((item) => item.trim()).filter(Boolean);

    if (name.length < 3 || name.length > 120) return setError('Showroom name must contain 3 to 120 characters.');
    if (city.length < 2 || city.length > 60) return setError('City must contain 2 to 60 characters.');
    if (address.length < 10 || address.length > 250) return setError('Address must contain 10 to 250 characters.');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) return setError('Enter a valid phone number with 10 to 15 digits.');
    if (hours.length < 3 || hours.length > 100) return setError('Opening hours must contain 3 to 100 characters.');
    if (facilities.length > 10) return setError('Add no more than 10 facilities.');
    if (facilities.some((item) => item.length > 50)) return setError('Each facility must be 50 characters or shorter.');
    if (new Set(facilities.map((item) => item.toLowerCase())).size !== facilities.length) return setError('Facilities cannot contain duplicates.');
    if (!Number.isInteger(Number(draft.sortOrder)) || Number(draft.sortOrder) < 0 || Number(draft.sortOrder) > 9999) return setError('Display order must be a whole number between 0 and 9999.');

    if (draft.mapUrl.trim()) {
      try {
        const url = new URL(draft.mapUrl.trim());
        if (url.protocol !== 'https:') throw new Error();
      } catch {
        return setError('Google Maps URL must be a valid HTTPS link.');
      }
    }

    try {
      setSaving(true);
      await onSave({ ...draft, name, city, address, hours, facilities, sortOrder: Number(draft.sortOrder) });
    } catch (saveError) {
      setError(saveError.message || 'Unable to save showroom.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-form-stack showroom-form" onSubmit={handleSubmit}>
      <div className="form-two-columns">
        <label>Showroom Name<input name="name" value={draft.name} onChange={setValue} maxLength="120" required autoFocus disabled={saving} /></label>
        <label>City<input name="city" value={draft.city} onChange={setValue} maxLength="60" required disabled={saving} /></label>
      </div>
      <label>Full Address<textarea name="address" value={draft.address} onChange={setValue} rows="3" maxLength="250" required disabled={saving} /></label>
      <div className="form-two-columns">
        <label>Phone Number<input name="phone" type="tel" value={draft.phone} onChange={setValue} placeholder="+91 98765 43210" maxLength="24" required disabled={saving} /></label>
        <label>Opening Hours<input name="hours" value={draft.hours} onChange={setValue} placeholder="10:00 AM - 9:00 PM (Open 7 Days)" maxLength="100" required disabled={saving} /></label>
      </div>
      <label>
        Facilities
        <input name="facilities" value={draft.facilities} onChange={setValue} placeholder="Trial Zone, Parking Available, Sleep Consultant" disabled={saving} />
        <small>Separate facilities with commas. Maximum 10.</small>
      </label>
      <label>
        Google Maps URL (optional)
        <input name="mapUrl" type="url" value={draft.mapUrl} onChange={setValue} placeholder="https://maps.google.com/..." disabled={saving} />
        <small>If left empty, directions are generated from the showroom name and address.</small>
      </label>
      <div className="form-two-columns showroom-form-options">
        <label>Display Order<input name="sortOrder" type="number" min="0" max="9999" step="1" value={draft.sortOrder} onChange={setValue} disabled={saving} /></label>
        <label className="showroom-active-toggle"><input name="isActive" type="checkbox" checked={draft.isActive} onChange={setValue} disabled={saving} />Visible on website</label>
      </div>
      {error && <p className="account-form-error" role="alert">{error}</p>}
      <div className="product-form-actions">
        <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="admin-action" disabled={saving}>
          {saving ? <LoadingSpinner label={showroom ? 'Updating Showroom...' : 'Adding Showroom...'} inline /> : 'Save Showroom'}
        </button>
      </div>
    </form>
  );
}

export default function ShowroomsPage() {
  const [showrooms, setShowrooms] = useState([]);
  const [editingShowroom, setEditingShowroom] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [pageError, setPageError] = useState('');

  const loadShowrooms = async () => {
    try {
      setLoading(true);
      setShowrooms(await getAdminShowroomsApi());
      setPageError('');
    } catch (error) {
      setPageError(error.message || 'Unable to load showrooms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadShowrooms(); }, []);

  const close = () => { setIsOpen(false); setEditingShowroom(null); };
  const openNew = () => { setEditingShowroom(null); setIsOpen(true); };
  const openEdit = (showroom) => { setEditingShowroom(showroom); setIsOpen(true); };

  const handleSave = async (draft) => {
    const duplicate = showrooms.some((showroom) =>
      showroom.id !== editingShowroom?.id &&
      showroom.name.trim().toLowerCase() === draft.name.trim().toLowerCase() &&
      showroom.city.trim().toLowerCase() === draft.city.trim().toLowerCase());
    if (duplicate) throw new Error('A showroom with this name already exists in the selected city.');

    if (editingShowroom) {
      const updated = await updateAdminShowroomApi(editingShowroom.id, draft);
      setShowrooms((current) => current.map((item) => item.id === updated.id ? updated : item));
    } else {
      const created = await addAdminShowroomApi(draft);
      setShowrooms((current) => [...current, created]);
    }
    close();
    await loadShowrooms();
  };

  const handleDelete = async (showroom) => {
    if (!window.confirm(`Delete ${showroom.name}? This cannot be undone.`)) return;
    try {
      setDeletingId(showroom.id);
      await deleteAdminShowroomApi(showroom.id);
      setShowrooms((current) => current.filter((item) => item.id !== showroom.id));
      setPageError('');
    } catch (error) {
      setPageError(error.message || 'Unable to delete showroom.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="admin-title">
        <div><p>Locations</p><h1>Showrooms</h1></div>
        <button className="admin-action" onClick={openNew}>+ Add showroom</button>
      </div>
      {pageError && <p className="account-form-error" role="alert">{pageError}</p>}
      <section className="admin-card showroom-admin">
        {loading ? <LoadingSpinner label="Loading Showrooms..." /> : showrooms.length === 0 ? (
          <div className="module-empty"><h2>No showrooms found</h2><p>Add your first showroom location.</p></div>
        ) : (
          <div className="showroom-admin-grid">
            {showrooms.map((showroom) => (
              <article className="showroom-admin-card" key={showroom.id}>
                <div className="showroom-admin-card-top"><span>{showroom.city}</span><b className={showroom.isActive ? 'is-active' : 'is-hidden'}>{showroom.isActive ? 'Visible' : 'Hidden'}</b></div>
                <h2>{showroom.name}</h2>
                <p>📍 {showroom.address}</p>
                <small>📞 {showroom.phone}</small><small>🕒 {showroom.hours}</small>
                <div className="showroom-admin-facilities">{(showroom.facilities || []).map((facility) => <span key={facility}>{facility}</span>)}</div>
                <div className="showroom-admin-actions">
                  <button className="edit-product" onClick={() => openEdit(showroom)} disabled={deletingId === showroom.id}>Edit</button>
                  <button onClick={() => handleDelete(showroom)} disabled={deletingId === showroom.id}>{deletingId === showroom.id ? 'Deleting...' : 'Delete'}</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {isOpen && (
        <AdminModal title={editingShowroom ? `Edit ${editingShowroom.name}` : 'Add a new showroom'} onClose={close}>
          <ShowroomForm showroom={editingShowroom} onSave={handleSave} onClose={close} />
        </AdminModal>
      )}
    </>
  );
}

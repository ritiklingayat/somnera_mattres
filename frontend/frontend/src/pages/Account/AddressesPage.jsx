import { useState } from 'react';
import { useAuth } from '../../components/Account';

export default function AddressesPage() {
  const { showToast } = useAuth();
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      label: 'Home',
      line1: '42 Turner Road, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      phone: '+91 98765 43210',
    },
  ]);

  const [form, setForm] = useState({ label: '', line1: '', city: '', state: '', pincode: '', phone: '' });
  const [showForm, setShowForm] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addAddress = (e) => {
    e.preventDefault();
    if (!form.line1.trim() || !form.city.trim()) return;
    setAddresses([...addresses, { id: Date.now(), ...form }]);
    setForm({ label: '', line1: '', city: '', state: '', pincode: '', phone: '' });
    setShowForm(false);
    showToast('Address added successfully.');
  };

  const removeAddress = (id) => {
    setAddresses(addresses.filter((a) => a.id !== id));
    showToast('Address removed.');
  };

  return (
    <div className="account-card">
      <div className="account-card-head">
        <div>
          <h1>Saved Addresses</h1>
          <p className="account-card-sub">Manage delivery addresses for faster checkout.</p>
        </div>
        <button className="account-submit-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add New'}
        </button>
      </div>

      {showForm && (
        <form className="account-form" onSubmit={addAddress}>
          <div className="account-form-row">
            <label>
              Address label
              <input name="label" placeholder="Home / Office" value={form.label} onChange={handleChange} />
            </label>
            <label>
              Mobile number
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} required />
            </label>
          </div>
          <label>
            Address
            <input name="line1" placeholder="Flat, street, locality" value={form.line1} onChange={handleChange} required />
          </label>
          <div className="account-form-row">
            <label>
              City
              <input name="city" value={form.city} onChange={handleChange} required />
            </label>
            <label>
              State
              <input name="state" value={form.state} onChange={handleChange} required />
            </label>
            <label>
              Pincode
              <input name="pincode" value={form.pincode} onChange={handleChange} required />
            </label>
          </div>
          <button type="submit" className="account-submit-btn">
            Save Address
          </button>
        </form>
      )}

      {addresses.length === 0 ? (
        <div className="account-empty">
          <p>No saved addresses yet.</p>
        </div>
      ) : (
        <div className="addresses-grid">
          {addresses.map((a) => (
            <article className="address-card" key={a.id}>
              <span className="address-label">{a.label || 'Address'}</span>
              <p>
                {a.line1}
                <br />
                {a.city}, {a.state} {a.pincode}
              </p>
              <small>{a.phone}</small>
              <div className="address-actions">
                <button className="address-edit-btn" onClick={() => setShowForm(true)}>
                  Edit
                </button>
                <button className="address-delete-btn" onClick={() => removeAddress(a.id)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

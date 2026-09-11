import { useState } from 'react';
import { useAuth } from '../../components/Account';

export default function ChangePasswordPage() {
  const { changePassword, showToast } = useAuth();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.next.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (form.next !== form.confirm) {
      setError('New passwords do not match.');
      return;
    }
    try {
      await changePassword(form.current, form.next);
      setForm({ current: '', next: '', confirm: '' });
      showToast('Password changed successfully.');
    } catch (err) {
      setError(err.message || 'Unable to change password.');
    }
  };

  return (
    <div className="account-card">
      <h1>Change Password</h1>
      <p className="account-card-sub">Use at least 6 characters with a mix of letters and numbers.</p>

      <form className="account-form" onSubmit={handleSubmit}>
        <label>
          Current password
          <input name="current" type="password" value={form.current} onChange={handleChange} required />
        </label>
        <div className="account-form-row">
          <label>
            New password
            <input name="next" type="password" value={form.next} onChange={handleChange} required />
          </label>
          <label>
            Confirm new password
            <input name="confirm" type="password" value={form.confirm} onChange={handleChange} required />
          </label>
        </div>
        {error && <p className="account-form-error">{error}</p>}
        <button type="submit" className="account-submit-btn">
          Update Password
        </button>
      </form>
    </div>
  );
}

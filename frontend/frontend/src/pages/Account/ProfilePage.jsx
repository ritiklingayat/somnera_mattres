import { useAuth } from '../../components/Account';
import AccountLayout from './AccountLayout';

export default function ProfilePage() {
  const { user } = useAuth();
  const mobile = user?.mobile || user?.phone;

  return (
    <AccountLayout active="profile">
      <div className="account-card profile-card">
        <p className="account-kicker">MY PROFILE</p>
        <h1>Account Information</h1>
        <p className="account-card-sub">Your verified Somnera account details.</p>
        <div className="profile-details">
          <div><span>Name</span><strong>{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—'}</strong></div>
          <div><span>Email Address</span><strong>{user?.email || '—'}</strong></div>
          <div><span>Mobile Number</span><strong>{mobile || '—'}</strong></div>
        </div>
      </div>
    </AccountLayout>
  );
}

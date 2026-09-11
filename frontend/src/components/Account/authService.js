import { createId, getAll, getOne, initializeLocalDatabase, putOne } from '../../db/database';
import { api } from '../../config/apiClient';

const TOKEN_KEY = 'somnera_auth_token';
const USER_KEY = 'somnera_auth_user';
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

function publicUser(user) {
  if (!user) return null;
  const { password: _password, ...safe } = user;
  return safe;
}

async function findUser(email) {
  await initializeLocalDatabase();
  const normalized = normalizeEmail(email);
  return (await getAll('users')).find(
    (user) => normalizeEmail(user.email) === normalized || String(user.id).toLowerCase() === normalized
  );
}

export async function loginApi({ email, password }) {
  try {
    const data = await api.post('/auth/login', { email, password });
    return data;
  } catch (err) {
    // Fallback to local DB if backend API is not running or network failed
    if (err.message && !err.message.includes('fetch') && !err.message.includes('Network') && err.status) {
      throw err; // Backend returned a real error response (e.g. 401 Incorrect password)
    }
    const user = await findUser(email);
    if (!user || user.password !== password || user.status === 'BLOCKED') {
      throw new Error('Incorrect email or password.');
    }
    return {
      token: `local-${user.id}-${Date.now()}`,
      tokenType: 'Local',
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role || 'USER',
    };
  }
}

export async function generateRegistrationOtpApi(email) {
  try {
    const res = await api.post('/auth/send-otp', { email });
    return { success: true, message: res?.message || 'Verification code sent to your email.' };
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('Network') && err.status) {
      throw err;
    }
    return { success: true, message: 'Local verification ready. Enter any 6-digit code.' };
  }
}

export async function registerApi({ firstName, lastName, email, mobile, password, confirmPassword, otp }) {
  try {
    const user = await api.post('/auth/register', {
      firstName,
      lastName,
      email,
      mobile,
      password,
      confirmPassword,
      otp,
    });
    return user;
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('Network') && err.status) {
      throw err;
    }
    if (password !== confirmPassword) throw new Error('Passwords do not match.');
    if (!/^\d{6}$/.test(String(otp || ''))) throw new Error('Enter any 6-digit verification code.');
    if (await findUser(email)) throw new Error('An account with this email already exists.');
    const user = {
      id: createId('user'),
      firstName,
      lastName,
      email: normalizeEmail(email),
      mobile,
      password,
      role: 'USER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    await putOne('users', user);
    return publicUser(user);
  }
}

export async function forgotPasswordApi({ email }) {
  try {
    const res = await api.post('/auth/forgot-password', { email });
    return { success: true, message: res?.message || 'Password reset code sent to your email.' };
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('Network') && err.status) {
      throw err;
    }
    if (!(await findUser(email))) throw new Error('No account was found for this email.');
    return { success: true, message: 'Enter any 6-digit code to reset the local account.' };
  }
}

export async function resetPasswordApi({ email, otp, newPassword, confirmPassword }) {
  try {
    const res = await api.post('/auth/reset-password', { email, otp, newPassword, confirmPassword });
    return { success: true, message: res?.message || 'Password has been reset successfully.' };
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('Network') && err.status) {
      throw err;
    }
    if (!/^\d{6}$/.test(String(otp || ''))) throw new Error('Enter any 6-digit verification code.');
    if (newPassword !== confirmPassword) throw new Error('Passwords do not match.');
    const user = await findUser(email);
    if (!user) throw new Error('Account not found.');
    await putOne('users', { ...user, password: newPassword, updatedAt: new Date().toISOString() });
    return { success: true };
  }
}

export async function getCurrentUserApi() {
  const raw = localStorage.getItem(USER_KEY);
  if (!localStorage.getItem(TOKEN_KEY) || !raw) throw new Error('Please sign in.');
  const saved = JSON.parse(raw);

  try {
    const user = await api.get('/auth/me');
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    }
  } catch (err) {
    // If local or offline, fallback to saved/IndexedDB
  }

  return publicUser((await getOne('users', saved.id)) || saved);
}

export async function getMyOrdersApi() {
  try {
    const orders = await api.get('/orders/my-orders');
    if (Array.isArray(orders)) return orders;
  } catch (err) {
    // Fallback to local IndexedDB
  }

  const user = await getCurrentUserApi();
  return (await getAll('orders'))
    .filter((order) => String(order.userId) === String(user.id))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function getMyOrderByIdApi(orderId) {
  try {
    const order = await api.get(`/orders/my-orders/${orderId}`);
    if (order) return order;
  } catch (err) {
    // Fallback to local
  }

  const user = await getCurrentUserApi();
  const order = (await getAll('orders')).find(
    (item) => String(item.id) === String(orderId) && String(item.userId) === String(user.id)
  );
  if (!order) throw new Error('Order not found.');
  return order;
}

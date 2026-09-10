import {
  useState,
} from 'react';

import {
  loginApi,
} from '../../components/Account/authService';

import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
} from '../../components/Account/AuthContext';

import LoadingSpinner
  from '../../components/LoadingSpinner/LoadingSpinner';


export default function AdminLoginPage({
  onLogin,
}) {

  const [
    email,
    setEmail,
  ] = useState('');


  const [
    password,
    setPassword,
  ] = useState('');


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState('');


  const handleSubmit =
    async (event) => {

      event.preventDefault();

      setError('');


      if (
        !email.trim() ||
        !password
      ) {

        setError(
          'Please enter email and password.',
        );

        return;
      }


      try {

        setLoading(true);


        const loginData =
          await loginApi({
            email:
              email.trim(),

            password,
          });


        /*
         * Backend LoginResponse contains:
         *
         * token
         * userId
         * firstName
         * lastName
         * email
         * role
         */

        if (
          !loginData?.token
        ) {

          throw new Error(
            'Admin login failed.',
          );
        }


        if (
          loginData.role !==
            'ADMIN'
        ) {

          throw new Error(
            'This account does not have admin access.',
          );
        }


        localStorage.setItem(
          AUTH_TOKEN_KEY,
          loginData.token,
        );


        localStorage.setItem(
          AUTH_USER_KEY,
          JSON.stringify({
            id:
              loginData.userId,

            firstName:
              loginData.firstName,

            lastName:
              loginData.lastName,

            email:
              loginData.email,

            role:
              loginData.role,
          }),
        );


        sessionStorage.setItem(
          'somnera-admin',
          'true',
        );


        onLogin?.(
          loginData,
        );


      } catch (err) {

        /*
         * Remove any accidental USER token
         * if login failed because role != ADMIN.
         */

        if (
          err.message ===
          'This account does not have admin access.'
        ) {

          localStorage.removeItem(
            AUTH_TOKEN_KEY,
          );

          localStorage.removeItem(
            AUTH_USER_KEY,
          );
        }


        setError(
          err.message ||
          'Incorrect email or password.',
        );


      } finally {

        setLoading(false);
      }
    };


  return (

    <main className="admin-login">

      <div className="login-split-container">

        <div className="login-visual">

          <div className="visual-content">

            <h2>
              Crafting Comfort.
            </h2>

            <p>
              Welcome back to the Somnera operations center.
              Manage your catalog, orders, and experiences.
            </p>

          </div>

        </div>


        <section className="login-form-container">

          <div className="admin-mark">
            S
          </div>


          <span>
            Somnera commerce
          </span>


          <h1>
            Admin portal
          </h1>


          <p>
            Sign in to your secure workspace.
          </p>


          <form onSubmit={handleSubmit}>
            <label>
              Admin ID or Email
              <input
                name="email"
                type="text"
                autoComplete="username"
                placeholder="Enter admin ID or email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                required
              />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                required
              />
            </label>

            {error && (
              <p className="login-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner
                  label="Signing in..."
                  inline
                />
              ) : (
                <>
                  Sign in
                  {' '}
                  <b>
                    →
                  </b>
                </>
              )}
            </button>
          </form>

        </section>

      </div>

    </main>
  );
}

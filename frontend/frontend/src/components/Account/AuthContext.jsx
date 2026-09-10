import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  forgotPasswordApi,
  generateRegistrationOtpApi,
  getCurrentUserApi,
  loginApi,
  registerApi,
  resetPasswordApi,
} from './authService';


const AuthContext =
  createContext(null);


export const AUTH_TOKEN_KEY =
  'somnera_auth_token';

export const AUTH_USER_KEY =
  'somnera_auth_user';


export function AuthProvider({
  children,
  onAddToCartSuccess,
}) {

  /*
  ==================================================
  AUTH SESSION
  ==================================================
  */

  const [token, setToken] =
    useState(() =>
      localStorage.getItem(
        AUTH_TOKEN_KEY,
      ),
    );


  const [user, setUser] =
    useState(() => {
      try {
        const raw =
          localStorage.getItem(
            AUTH_USER_KEY,
          );

        return raw
          ? JSON.parse(raw)
          : null;

      } catch {
        return null;
      }
    });


  /*
  ==================================================
  AUTH MODAL
  ==================================================
  */

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);


  const [
    modalView,
    setModalView,
  ] = useState('login');


  /*
  ==================================================
  OTHER AUTH UI STATE
  ==================================================
  */

  const [
    pendingCartItem,
    setPendingCartItem,
  ] = useState(null);


  const [
    toastMessage,
    setToastMessage,
  ] = useState('');


  const isLoggedIn =
    Boolean(token && user);


  /*
  ==================================================
  SAVE SESSION
  ==================================================
  */

  const saveSession = (
    newToken,
    newUser,
  ) => {

    setToken(newToken);
    setUser(newUser);


    if (newToken) {
      localStorage.setItem(
        AUTH_TOKEN_KEY,
        newToken,
      );
    } else {
      localStorage.removeItem(
        AUTH_TOKEN_KEY,
      );
    }


    if (newUser) {
      localStorage.setItem(
        AUTH_USER_KEY,
        JSON.stringify(newUser),
      );
    } else {
      localStorage.removeItem(
        AUTH_USER_KEY,
      );
    }
  };


  /*
  ==================================================
  TOAST
  ==================================================
  */

  const showToast = (message) => {
    setToastMessage(message);

    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };


  /*
  ==================================================
  AUTH MODAL
  ==================================================
  */

  const openAuthModal = (
    view = 'login',
    item = null,
  ) => {

    setModalView(view);

    if (item) {
      setPendingCartItem(item);
    }

    setModalOpen(true);

    document.body.style.overflow =
      'hidden';
  };


  const closeAuthModal = () => {
    setModalOpen(false);

    document.body.style.overflow =
      '';
  };


  /*
  ==================================================
  LOGIN
  ==================================================
  */

  const login = async (
    email,
    password,
  ) => {

    const loginData =
      await loginApi({
        email,
        password,
      });


    if (
      !loginData?.token
    ) {
      throw new Error(
        'Login failed. Please verify your credentials.',
      );
    }


    /*
     * LoginResponse does not contain every
     * UserResponse field such as mobile/status.
     *
     * Save initial login data first.
     */

    const initialUser = {
      id: loginData.userId,
      firstName:
        loginData.firstName,
      lastName:
        loginData.lastName,
      email:
        loginData.email,
      role:
        loginData.role,
    };


    saveSession(
      loginData.token,
      initialUser,
    );


    /*
     * Fetch full authenticated user profile.
     */

    try {
      const profile =
        await getCurrentUserApi();

      if (profile) {
        saveSession(
          loginData.token,
          profile,
        );
      }

    } catch (error) {
      /*
       * Login itself succeeded.
       * Profile refresh failure should not
       * unnecessarily break login.
       */
      console.error(
        'Unable to load current user profile:',
        error,
      );
    }


    closeAuthModal();


    showToast(
      `Welcome back, ${
        loginData.firstName ||
        'Sleep Enthusiast'
      }!`,
    );


    /*
     * Existing frontend behavior:
     * resume Add-to-Cart action after login.
     *
     * Backend cart integration comes in Phase 5.
     */

    if (
      pendingCartItem &&
      onAddToCartSuccess
    ) {

      onAddToCartSuccess(
        pendingCartItem,
      );

      setPendingCartItem(null);

      showToast(
        `${pendingCartItem.name} added to your cart!`,
      );
    }


    return loginData;
  };


  /*
  ==================================================
  REGISTRATION OTP
  ==================================================
  */

  const generateRegistrationOtp =
    async (email) => {

      return generateRegistrationOtpApi(
        email,
      );
    };


  /*
  ==================================================
  REGISTER
  ==================================================
  */

  const register =
    async (formData) => {

      const registeredUser =
        await registerApi(
          formData,
        );


      /*
       * Backend registration returns UserResponse,
       * NOT a JWT.
       *
       * Therefore account creation succeeds,
       * then user logs in normally.
       */

      if (!registeredUser?.id) {
        throw new Error(
          'Registration failed.',
        );
      }


      showToast(
        'Account created successfully. Please login.',
      );


      setModalView('login');


      return registeredUser;
    };


  /*
  ==================================================
  FORGOT PASSWORD
  ==================================================
  */

  const forgotPassword =
    async (email) => {

      return forgotPasswordApi({
        email,
      });
    };


  /*
  ==================================================
  RESET PASSWORD
  ==================================================
  */

  const resetPassword =
    async ({
      email,
      otp,
      newPassword,
      confirmPassword,
    }) => {

      return resetPasswordApi({
        email,
        otp,
        newPassword,
        confirmPassword,
      });
    };


  /*
  ==================================================
  LOGOUT
  ==================================================
  */

  const logout = () => {

    saveSession(
      null,
      null,
    );


    setPendingCartItem(null);


    if (
      [
        '#profile',
        '#orders',
        '#checkout',
      ].includes(
        window.location.hash,
      )
    ) {
      window.location.hash =
        'home';
    }


    showToast(
      'Logged out successfully.',
    );
  };


  /*
  ==================================================
  INVALID / EXPIRED JWT
  ==================================================
  */

  useEffect(() => {

    const handleUnauthorized =
      () => {

        saveSession(
          null,
          null,
        );

        setPendingCartItem(
          null,
        );


        if (
          [
            '#profile',
            '#orders',
            '#checkout',
          ].includes(
            window.location.hash,
          )
        ) {
          window.location.hash =
            'home';
        }


        showToast(
          'Your session has expired. Please login again.',
        );
      };


    window.addEventListener(
      'somnera:unauthorized',
      handleUnauthorized,
    );


    return () => {

      window.removeEventListener(
        'somnera:unauthorized',
        handleUnauthorized,
      );
    };

  }, []);


  /*
  ==================================================
  CLOSE MODAL USING ESC
  ==================================================
  */

  useEffect(() => {

    const handleKeyDown =
      (event) => {

        if (
          event.key ===
            'Escape' &&
          modalOpen
        ) {
          closeAuthModal();
        }
      };


    window.addEventListener(
      'keydown',
      handleKeyDown,
    );


    return () => {

      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };

  }, [modalOpen]);


  /*
  ==================================================
  CONTEXT
  ==================================================
  */

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn,

        modalOpen,
        modalView,

        pendingCartItem,
        toastMessage,

        setModalView,

        openAuthModal,
        closeAuthModal,

        login,
        register,
        logout,

        generateRegistrationOtp,

        forgotPassword,
        resetPassword,

        showToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {

  const context =
    useContext(
      AuthContext,
    );


  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider',
    );
  }


  return context;
}
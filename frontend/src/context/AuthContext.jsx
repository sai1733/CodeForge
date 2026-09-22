import React, { createContext, useReducer, useEffect } from 'react';
import authApi from '../api/authApi';

// Initial State
const initialState = {
  user: (() => {
    try {
      const stored = localStorage.getItem('codeforge_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem('codeforge_token') || null,
  isAuthenticated: !!localStorage.getItem('codeforge_token'),
  loading: false,
  error: null,
};

// Auth Actions
const AUTH_SUCCESS = 'AUTH_SUCCESS';
const AUTH_LOGOUT = 'AUTH_LOGOUT';
const AUTH_ERROR = 'AUTH_ERROR';
const CLEAR_ERROR = 'CLEAR_ERROR';
const SET_LOADING = 'SET_LOADING';

// Reducer Function
const authReducer = (state, action) => {
  switch (action.type) {
    case SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case AUTH_SUCCESS:
      localStorage.setItem('codeforge_token', action.payload.token);
      localStorage.setItem('codeforge_user', JSON.stringify(action.payload.user));
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case AUTH_LOGOUT:
      localStorage.removeItem('codeforge_token');
      localStorage.removeItem('codeforge_user');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    case AUTH_ERROR:
      localStorage.removeItem('codeforge_token');
      localStorage.removeItem('codeforge_user');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };
    case CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create Context
export const AuthContext = createContext();

// Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Actions
  const loginUser = async (email, password) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const result = await authApi.login(email, password);
      dispatch({
        type: AUTH_SUCCESS,
        payload: {
          user: result.data.user,
          token: result.data.token,
        },
      });
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please try again.';
      dispatch({ type: AUTH_ERROR, payload: errMsg });
      return { success: false, error: errMsg };
    }
  };

  const registerUser = async (userData) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const result = await authApi.register(userData);
      dispatch({
        type: AUTH_SUCCESS,
        payload: {
          user: result.data.user,
          token: result.data.token,
        },
      });
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      dispatch({ type: AUTH_ERROR, payload: errMsg });
      return { success: false, error: errMsg };
    }
  };

  const logoutUser = () => {
    dispatch({ type: AUTH_LOGOUT });
  };

  const clearError = () => {
    dispatch({ type: CLEAR_ERROR });
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        loading: state.loading,
        error: state.error,
        loginUser,
        registerUser,
        logoutUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

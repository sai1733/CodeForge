import React, { createContext, useReducer } from 'react';
import projectApi from '../api/projectApi';

// Initial State
const initialState = {
  projects: [],
  loading: false,
  error: null,
};

// Actions
const PROJECT_LOADING = 'PROJECT_LOADING';
const FETCH_PROJECTS_SUCCESS = 'FETCH_PROJECTS_SUCCESS';
const CREATE_PROJECT_SUCCESS = 'CREATE_PROJECT_SUCCESS';
const PROJECT_ERROR = 'PROJECT_ERROR';
const CLEAR_PROJECT_ERROR = 'CLEAR_PROJECT_ERROR';

// Reducer
const projectReducer = (state, action) => {
  switch (action.type) {
    case PROJECT_LOADING:
      return {
        ...state,
        loading: true,
      };
    case FETCH_PROJECTS_SUCCESS:
      return {
        ...state,
        projects: action.payload,
        loading: false,
        error: null,
      };
    case CREATE_PROJECT_SUCCESS:
      return {
        ...state,
        projects: [action.payload, ...state.projects],
        loading: false,
        error: null,
      };
    case PROJECT_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case CLEAR_PROJECT_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create Context
export const ProjectContext = createContext();

// Provider
export const ProjectProvider = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  const fetchProjects = async (params = {}) => {
    dispatch({ type: PROJECT_LOADING });
    try {
      const result = await projectApi.getProjects(params);
      dispatch({ type: FETCH_PROJECTS_SUCCESS, payload: result.data });
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to load projects';
      dispatch({ type: PROJECT_ERROR, payload: errMsg });
      return { success: false, error: errMsg };
    }
  };

  const createProject = async (projectData) => {
    dispatch({ type: PROJECT_LOADING });
    try {
      const result = await projectApi.createProject(projectData);
      dispatch({ type: CREATE_PROJECT_SUCCESS, payload: result.data });
      return { success: true, data: result.data };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to create project';
      dispatch({ type: PROJECT_ERROR, payload: errMsg });
      return { success: false, error: errMsg };
    }
  };

  const clearProjectError = () => {
    dispatch({ type: CLEAR_PROJECT_ERROR });
  };

  return (
    <ProjectContext.Provider
      value={{
        projects: state.projects,
        loading: state.loading,
        error: state.error,
        fetchProjects,
        createProject,
        clearProjectError,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

import React, { createContext, useReducer } from 'react';
import taskApi from '../api/taskApi';

// Initial State
const initialState = {
  tasks: [],
  loading: false,
  error: null,
};

// Actions
const TASK_LOADING = 'TASK_LOADING';
const FETCH_TASKS_SUCCESS = 'FETCH_TASKS_SUCCESS';
const CREATE_TASK_SUCCESS = 'CREATE_TASK_SUCCESS';
const UPDATE_TASK_STATUS_SUCCESS = 'UPDATE_TASK_STATUS_SUCCESS';
const TASK_ERROR = 'TASK_ERROR';
const CLEAR_TASK_ERROR = 'CLEAR_TASK_ERROR';

// Reducer
const taskReducer = (state, action) => {
  switch (action.type) {
    case TASK_LOADING:
      return {
        ...state,
        loading: true,
      };
    case FETCH_TASKS_SUCCESS:
      return {
        ...state,
        tasks: action.payload,
        loading: false,
        error: null,
      };
    case CREATE_TASK_SUCCESS:
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
        loading: false,
        error: null,
      };
    case UPDATE_TASK_STATUS_SUCCESS:
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task._id === action.payload._id ? action.payload : task
        ),
        loading: false,
        error: null,
      };
    case TASK_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case CLEAR_TASK_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create Context
export const TaskContext = createContext();

// Provider
export const TaskProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Fetch Tasks
  const fetchTasks = async (params) => {
    dispatch({ type: TASK_LOADING });
    try {
      const result = await taskApi.getTasks(params);
      dispatch({ type: FETCH_TASKS_SUCCESS, payload: result.data });
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to fetch tasks';
      dispatch({ type: TASK_ERROR, payload: errMsg });
      return { success: false, error: errMsg };
    }
  };

  // Create Task
  const createTask = async (taskData) => {
    dispatch({ type: TASK_LOADING });
    try {
      const result = await taskApi.createTask(taskData);
      dispatch({ type: CREATE_TASK_SUCCESS, payload: result.data });
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to assign task';
      dispatch({ type: TASK_ERROR, payload: errMsg });
      return { success: false, error: errMsg };
    }
  };

  // Update Task Status
  const updateTaskStatus = async (taskId, statusData) => {
    dispatch({ type: TASK_LOADING });
    try {
      const result = await taskApi.updateStatus(taskId, statusData);
      dispatch({ type: UPDATE_TASK_STATUS_SUCCESS, payload: result.data });
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update task status';
      dispatch({ type: TASK_ERROR, payload: errMsg });
      return { success: false, error: errMsg };
    }
  };

  const clearTaskError = () => {
    dispatch({ type: CLEAR_TASK_ERROR });
  };

  return (
    <TaskContext.Provider
      value={{
        tasks: state.tasks,
        loading: state.loading,
        error: state.error,
        fetchTasks,
        createTask,
        updateTaskStatus,
        clearTaskError,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

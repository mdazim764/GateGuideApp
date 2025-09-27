// src/services/api.js - Complete update with all backend routes

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Choose the appropriate base URL depending on environment
// const BASE_URL = __DEV__
//   ? 'http://192.168.142.245:3000/api'
//   : 'https://gate-guide-backend.onrender.com/api';

const BASE_URL = 'https://gate-guide-api.onrender.com/api';

console.log('Connecting to API at:', BASE_URL);

// Create an axios instance with a longer timeout
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // Increase timeout to 120 seconds for quiz generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding token
apiClient.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem('@auth/accessToken');
      if (token) {
        // Make sure we're using the correct format
        // Log in development to debug token issues
        if (__DEV__) {
          console.log(
            'Adding token to request:',
            token.substring(0, 10) + '...',
          );
        }
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting token for API request:', error);
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Improve the interceptor to better handle expired tokens
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If error is 401 or 403 (both indicate auth issues) and we haven't retried yet
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Get refresh token
        const refreshToken = await AsyncStorage.getItem('@auth/refreshToken');

        if (!refreshToken) {
          // Clear auth data and force logout
          await AsyncStorage.multiRemove([
            '@auth/accessToken',
            '@auth/refreshToken',
            '@auth/user',
          ]);
          // Signal that user needs to login again
          return Promise.reject({ forceLogout: true, ...error });
        }

        // Call refresh endpoint
        const response = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {
            token: refreshToken,
          },
          {
            // Skip interceptors for this request to avoid infinite loops
            skipAuthRefresh: true,
          },
        );

        const { token: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

        // Save new tokens
        await AsyncStorage.setItem('@auth/accessToken', newAccessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('@auth/refreshToken', newRefreshToken);
        }

        console.log('Token refreshed successfully');

        // Update Authorization header and retry
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.log('Token refresh failed:', refreshError);
        // Clear auth data after failed refresh
        await AsyncStorage.multiRemove([
          '@auth/accessToken',
          '@auth/refreshToken',
          '@auth/user',
        ]);
        return Promise.reject({ forceLogout: true, ...error });
      }
    }

    return Promise.reject(error);
  },
);

// Add this to src/services/api.js
const handleApiError = async error => {
  if (!error.response) {
    // Network error (no response)
    return {
      status: 'network_error',
      message: 'Network error. Please check your connection.',
    };
  }

  if (error.response.status === 401 || error.response.status === 403) {
    // Auth error
    return {
      status: 'auth_error',
      message: 'Authentication error. Please login again.',
    };
  }

  return {
    status: 'api_error',
    message: error.response.data?.message || 'An error occurred',
  };
};

// API service object with methods for each endpoint group
const api = {
  auth: {
    register: userData => apiClient.post('/auth/register', userData),
    login: credentials => apiClient.post('/auth/login', credentials),
    logout: () => apiClient.post('/auth/logout'),
    verifyToken: () => apiClient.get('/auth/verify-token'),
    refreshToken: refreshToken =>
      apiClient.post('/auth/refresh', { token: refreshToken }),
  },

  dashboard: {
    getSummary: () => apiClient.get('/dashboard/summary'),
    getRecentQuizzes: () => apiClient.get('/dashboard/recent-quizzes'),
    getStudyStreak: () => apiClient.get('/dashboard/study-streak'),
  },

  analytics: {
    getSummary: timeframe =>
      apiClient.get(`/analytics/summary?timeframe=${timeframe}`),
    getSubjectPerformance: () =>
      apiClient.get('/analytics/subject-performance'),
    getStudyHours: timeframe =>
      apiClient.get(`/analytics/study-hours?timeframe=${timeframe}`),
    getAnalytics: (period = 'week') =>
      apiClient.get(`/analytics?period=${period}`),
    exportAnalyticsData: (period = 'week', format = 'json') =>
      apiClient.get(`/analytics/export?period=${period}&format=${format}`),
  },

  // UPDATED: Academic endpoints with new routes
  academic: {
    // Get full syllabus tree (public)
    getSyllabusTree: () => apiClient.get('/academic/syllabus-tree'),

    // Get syllabus with user progress (authenticated)
    getSyllabusWithProgress: () =>
      apiClient.get('/academic/syllabus-with-progress'),

    // Get all subjects (derived from syllabus)
    getSubjects: async () => {
      const response = await apiClient.get('/academic/syllabus-tree');
      // Extract just the subjects from the full syllabus
      return {
        ...response,
        data: response.data.map(subject => ({
          id: subject.id,
          name: subject.name,
          description: subject.description,
          imageUrl: subject.imageUrl,
          progress: subject.progress || 0,
        })),
      };
    },

    // Get a single subject with details
    getSubjectDetail: async subjectId => {
      // Since we don't have a direct endpoint, we'll get the full syllabus and filter
      const response = await apiClient.get('/academic/syllabus-with-progress');
      const subject = response.data.find(s => s.id === subjectId);
      return { ...response, data: subject };
    },

    // Admin endpoint to seed syllabus (protected)
    seedSyllabus: () => apiClient.post('/academic/seed-syllabus'),
  },

  // Progress tracking
  progress: {
    // Mark a subtopic as completed
    markSubtopicCompleted: (subtopicId, status = 'completed') =>
      apiClient.post('/progress/subtopic', {
        subtopicId,
        status,
      }),
    updateTopicProgress: (topicId, completed) =>
      apiClient.post(`/progress/topic`, { topicId, completed }),
    updateSubtopicProgress: (subtopicId, completed) =>
      apiClient.post(`/progress/subtopic`, { subtopicId, completed }),
    // Get all user progress
    getAllProgress: () => apiClient.get('/progress'),
    getTopicProgress: topicId => apiClient.get(`/progress/topic/${topicId}`),
  },

  ai: {
    chat: message => apiClient.post('/ai/chat', { message }),
    analyze: () => apiClient.get('/ai/analyze'),
    generateStudyPlan: data => apiClient.post('/ai/generate-study-plan', data),
    // New quote endpoints
    getRandomQuote: () => apiClient.get('/ai/quote'),
    getTestQuote: () => apiClient.get('/ai/test-quote'),
    getTopicQuote: topic =>
      apiClient.get(`/ai/quote?topic=${encodeURIComponent(topic)}`),

    createConversation: (title = 'New Conversation') =>
      apiClient.post('/ai/conversations', { title }),
    getConversations: (page = 1, limit = 10) =>
      apiClient.get(`/ai/conversations?page=${page}&limit=${limit}`),
    getConversation: id => apiClient.get(`/ai/conversations/${id}`),
    sendMessage: (id, data) =>
      apiClient.post(`/ai/conversations/${id}/messages`, data),
    deleteConversation: id => apiClient.delete(`/ai/conversations/${id}`),
    updateConversationTitle: (id, data) =>
      apiClient.put(`/ai/conversations/${id}`, data),
  },

  knowledge: {
    getAvailableTopics: () => apiClient.get('/knowledge/available-topics'),
    getTopicDetails: id => apiClient.get(`/knowledge/topics/${id}`),
  },

  pyqs: {
    getAll: filters => apiClient.get('/pyqs', { params: filters }),
    getById: id => apiClient.get(`/pyqs/${id}`),
    getAllPyqStats: () => apiClient.get('/pyq/stats'),
    getPyqQuestionsBySubject: subjectId =>
      apiClient.get(`/pyq/questions/subject/${subjectId}`),
    getPyqQuestionsBySubjectAndYear: (subjectId, year) =>
      apiClient.get(`/pyq/questions/subject/${subjectId}/year/${year}`),
  },

  quizzes: {
    generate: options => apiClient.post('/quizzes/generate', options),
    getQuiz: id => apiClient.get(`/quizzes/${id}`),
    submitQuiz: (id, answers) =>
      apiClient.post(`/quizzes/${id}/submit`, answers),
    getAttempts: () => apiClient.get('/quizzes/attempts/all'),
    getAttemptDetail: attemptId =>
      apiClient.get(`/quizzes/attempts/${attemptId}`),
  },

  resources: {
    getAll: async filters => {
      try {
        const response = await apiClient.get('/resources', { params: filters });
        return response;
      } catch (error) {
        const errorInfo = await handleApiError(error);
        throw errorInfo;
      }
    },
    getById: id => apiClient.get(`/resources/${id}`),
    create: data => apiClient.post('/resources', data),
    uploadUrl: url => apiClient.post('/resources/upload-url', { url }),
    add: data => apiClient.post('/resources/add', data),
    update: (id, data) => apiClient.put(`/resources/${id}`, data),
    delete: id => apiClient.delete(`/resources/${id}`),
  },

  youtube: {
    getPlaylists: () => apiClient.get('/youtube/playlists'),
    // Fix 1: Make sure this URL matches your backend route exactly
    getPlaylistVideos: playlistId =>
      apiClient.get(`/youtube/playlists/${playlistId}/videos`),
    addPlaylist: playlistData =>
      apiClient.post('/youtube/playlists/add', playlistData),
    updateWatchProgress: (videoId, progress) =>
      apiClient.post(`/youtube/videos/${videoId}/progress`, { progress }),
  },

  planner: {
    // Get tasks for a specific day
    getTasksByDate: date => apiClient.get(`/planner/tasks?date=${date}`),

    // Get all tasks (useful for calendar marking)
    getAllTasks: () => apiClient.get('/planner/alltasks'),

    // Add a new task
    createTask: taskData => apiClient.post('/planner/tasks', taskData),

    // Update a task
    updateTask: (taskId, updateData) =>
      apiClient.put(`/planner/tasks/${taskId}`, updateData),

    // Delete a task
    deleteTask: taskId => apiClient.delete(`/planner/tasks/${taskId}`),
  },

  session: {
    // Log a new study session
    logSession: data => apiClient.post('/sessions/log', data),

    // Get today's study statistics
    getTodaysStats: () => apiClient.get('/sessions/today'),

    // Get session history with pagination and filtering
    getSessionHistory: (params = {}) =>
      apiClient.get('/sessions/history', { params }),

    // Get weekly statistics
    getWeeklyStats: (weeks = 4) =>
      apiClient.get(`/sessions/weekly?weeks=${weeks}`),

    // Update daily study goal
    updateStudyGoal: data => apiClient.put('/sessions/goal', data),

    // Get personalized study recommendations
    getRecommendations: () => apiClient.get('/sessions/recommendations'),
  },

  admin: {
    seedYoutubeLibrary: () => apiClient.post('/admin/seed/youtube-library'),
    getPendingResources: () => apiClient.get('/admin/resources/pending'),
    approveResource: (id, data) =>
      apiClient.put(`/admin/resources/${id}`, data),
  },

  // Add quotes API endpoints
  quotes: {
    getAll: (page = 1, limit = 20) =>
      apiClient.get(`/ai/quotes?page=${page}&limit=${limit}`),
    getDaily: () => apiClient.get('/ai/quotes/daily'),
    getToday: () => apiClient.get('/ai/quotes/today'),
    getRandom: () => apiClient.get('/ai/quotes/random'),
    getPersonalized: () => apiClient.get('/ai/quotes/personalized'),
    getById: quoteId => apiClient.get(`/ai/quotes/${quoteId}`),
  },

  notifications: {
    // Update FCM token
    updateFcmToken: fcmToken => {
      console.log('API: Updating FCM token...');
      return apiClient.put('/notifications/token', { fcmToken });
    },

    // Get user notifications with pagination
    getNotifications: (page = 1, limit = 10) => {
      console.log(
        `API: Getting notifications (page: ${page}, limit: ${limit})...`,
      );
      return apiClient.get(`/notifications?page=${page}&limit=${limit}`);
    },

    // Mark notifications as read
    markRead: notificationIds => {
      console.log('API: Marking notifications as read:', notificationIds);
      return apiClient.patch('/notifications/read', { ids: notificationIds });
    },

    // Delete specific notifications
    deleteNotifications: notificationIds => {
      console.log('API: Deleting notifications:', notificationIds);
      return apiClient.delete('/notifications', {
        data: { ids: notificationIds },
      });
    },

    // Clear all notifications
    clearAllNotifications: () => {
      console.log('API: Clearing all notifications...');
      return apiClient.delete('/notifications/all');
    },

    // Get notification preferences
    getPreferences: () => {
      console.log('API: Getting notification preferences...');
      return apiClient.get('/notifications/preferences');
    },

    // Update notification preferences
    updatePreferences: preferences => {
      console.log('API: Updating notification preferences:', preferences);
      return apiClient.put('/notifications/preferences', preferences);
    },

    // Send test notification
    sendTestNotification: () => {
      console.log('API: Sending test notification...');
      return apiClient.post('/notifications/test');
    },
  },
};

// Add retry interceptor to handle network issues

// Add this after creating your apiClient instance
apiClient.interceptors.response.use(undefined, async error => {
  const { config, message } = error;

  // Check if error is a network error or a timeout
  if (message === 'Network Error' || error.code === 'ECONNABORTED') {
    // Don't retry if we already tried 3 times
    if (config._retry >= 2) {
      return Promise.reject(error);
    }

    // Set retry count
    config._retry = (config._retry || 0) + 1;

    // Wait for 1 second before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Retry the request
    return apiClient(config);
  }

  return Promise.reject(error);
});

export default api;

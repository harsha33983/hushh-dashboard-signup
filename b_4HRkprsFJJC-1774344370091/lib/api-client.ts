import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Api-Key': process.env.NEXT_PUBLIC_API_KEY || 'dev-api-key-12345',
  },
});

// Automatically inject workspace ID into all requests
apiClient.interceptors.request.use((config) => {
  // In a real app, this might come from a context or URL param
  const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspace_id') || 'workspace-123' : 'workspace-123';
  config.headers['X-Workspace-Id'] = workspaceId;
  return config;
});

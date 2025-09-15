// src/api/http.js
import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',            // ✅ relative (goes through Vite proxy)
  withCredentials: true,      // ✅ needed for cookie-based auth
})

// Optional: readable network errors
api.interceptors.response.use(
  r => r,
  err => {
    console.error('API ERROR', {
      url: err?.config?.url,
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message,
    })
    throw err
  }
)

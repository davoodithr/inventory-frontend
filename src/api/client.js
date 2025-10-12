// src/api/client.js
import axios from 'axios'

export const storage = {
  get access(){ return localStorage.getItem('access') },
  set access(v){ v ? localStorage.setItem('access', v) : localStorage.removeItem('access') },
  get refresh(){ return localStorage.getItem('refresh') },
  set refresh(v){ v ? localStorage.setItem('refresh', v) : localStorage.removeItem('refresh') },
}

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export const api = axios.create({
  baseURL: BASE,
  headers: { 'Accept':'application/json','Content-Type':'application/json' }
})

api.interceptors.request.use(cfg => {
  const t = storage.access
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

let refreshing = false
let queue = []

function onRefreshed(token){ queue.forEach(cb => cb(token)); queue = [] }

export async function refreshToken(){
  if (refreshing) return new Promise(resolve => queue.push(resolve))
  refreshing = true  

  try {
    const { data } = await axios.post(`${BASE}/auth/token/refresh/`, { refresh: storage.refresh })
    storage.access = data.access
    onRefreshed(data.access)
    return data.access
  } catch (e) {
    storage.access = null
    storage.refresh = null
    throw e
  } finally {
    refreshing = false
  }
}

// retry on 401 with refreshed token
api.interceptors.response.use(
  r => r,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && storage.refresh && !original._retry){
      original._retry = true
      try {
        const newAcc = await refreshToken()
        original.headers.Authorization = `Bearer ${newAcc}`
        return api(original)
      } catch (e) {
        // fallthrough
      }
    }
    return Promise.reject(err)
  }
)

export async function fetchTransactions() {
  const { data } = await api.get("/inv/inventory-transactions");
  return Array.isArray(data?.results) ? data.results : []
  
}

export async function fetchStockQuants() {
  const { data } = await api.get("/inv/stock-quants/");
  return Array.isArray(data?.results) ? data.results : []
}



// ✅ Main fetch for first page
export async function fetchWarehouseTracking(warehouseId, page = 1) {
  const { data } = await api.get(`/inv/inventory-tracking/${warehouseId}/warehouse/?page=${page}`);
  return data;
}

// ✅ Extra helper to fetch directly by URL (for next/previous links)
export async function fetchWarehouseTrackingPage(url) {
  const { data } = await api.get(url);
  return data;
}
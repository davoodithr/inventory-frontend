// src/api/auth.js
import { api, storage } from './client'

export async function login(email, password){
  const { data } = await api.post('/auth/token/', { email, password })
  storage.access = data.access
  storage.refresh = data.refresh
    return data
}

export function logout(){
  storage.access = null
  storage.refresh = null
}

export function isAuthed(){
  return !!storage.access
}


export async function registerUser(payload) {
  // expects: { username, first_name, last_name, email, password }
  const { data } = await api.post('/auth/register', payload)
  return data // either { user, access, refresh } or just user fields
}


export function useRole() {
  const { user } = isAuthed();

  console.log(user?.role)
  return user?.role || null;
}

export function canSeeWarehouses(role, isSuper) {
  return isSuper || ["storekeeper", "production_manager"].includes(role);
}
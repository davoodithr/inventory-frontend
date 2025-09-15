import React from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthed } from '../api/auth'

export default function ProtectedRoute({ children }){
  if (!isAuthed()) return <Navigate to="/login" replace />
  return children
}

// Login.jsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'  // ← add Link
import { login } from '../api/auth'

export default function Login(){
  const nav = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(username, password)   // see note below about email vs username
      nav('/', { replace: true })
    } catch (e) {
      
      setError(e?.response?.data?.detail || 'ورود ناموفق بود')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm bg-white shadow rounded-xl p-6">
        <h1 className="text-xl font-semibold text-center mb-6">ورود</h1>
        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">نام کاربری</label>
            <input className="w-full border rounded px-3 py-2"
              value={username} onChange={e=>setUsername(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">رمز عبور</label>
            <input type="password" className="w-full border rounded px-3 py-2"
              value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <button disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50">
            {loading ? 'در حال ورود…' : 'ورود'}
          </button>
        </form>

        {/* link to register */}
        <p className="text-sm text-center text-gray-600 mt-4">
          حساب کاربری ندارید؟{" "}
          <Link to="/CreateUser" className="text-blue-600 hover:underline">
            ثبت نام
          </Link>
        </p>
      </div>
    </div>
  )
}

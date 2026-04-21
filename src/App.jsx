import { useState } from 'react'
import axios from 'axios'
import './App.css'

const API = import.meta.env.VITE_API_URL

export default function App() {
  const [screen, setScreen] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confPass, setConfPass] = useState('')
  const [otp, setOtp] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState(null)
  const [tempToken, setTempToken] = useState(null)
  const [resetToken, setResetToken] = useState(null)
  const [user, setUser] = useState(null)

  function showAlert(msg, type = 'err') {
    setAlert({ msg, type })
    setTimeout(() => setAlert(null), 4000)
  }

  async function handleLogin() {
    if (!email || !password) return showAlert('Fill in all fields.')
    setLoading(true)
    try {
      const { data } = await axios.post(`${API}/api/auth/login`, { email, password })
      if (data.ceoFirstLogin) {
        setUserId(data.userId)
        setScreen('ceo-otp')
        showAlert('OTP sent to your email!', 'ok')
      } else {
        localStorage.setItem('token', data.token)
        setUser(data.user)
        setScreen('dashboard')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed.'
      showAlert(msg)
      if (err.response?.data?.resetSent) {
        setTimeout(() => setScreen('reset-code'), 2000)
      }
    }
    setLoading(false)
  }

  async function handleCeoOtp() {
    if (!otp) return showAlert('Enter the OTP.')
    setLoading(true)
    try {
      const { data } = await axios.post(`${API}/api/auth/verify-ceo-otp`, { userId, otp })
      setTempToken(data.tempToken)
      setScreen('ceo-set-password')
      showAlert('OTP verified!', 'ok')
    } catch (err) {
      showAlert(err.response?.data?.message || 'Invalid OTP.')
    }
    setLoading(false)
  }

  async function handleCeoSetPassword() {
    if (!newPass || !confPass) return showAlert('Fill in all fields.')
    if (newPass !== confPass) return showAlert('Passwords do not match.')
    if (newPass.length < 8) return showAlert('Password must be at least 8 characters.')
    setLoading(true)
    try {
      const { data } = await axios.post(`${API}/api/auth/ceo-set-password`, { tempToken, newPassword: newPass })
      localStorage.setItem('token', data.token)
      setScreen('dashboard')
      showAlert('Password set! Welcome, CEO.', 'ok')
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to set password.')
    }
    setLoading(false)
  }

  async function handleForgotPassword() {
    if (!email) return showAlert('Enter your email.')
    setLoading(true)
    try {
      await axios.post(`${API}/api/auth/forgot-password`, { email })
      showAlert('Reset code sent if email exists.', 'ok')
      setTimeout(() => setScreen('reset-code'), 2000)
    } catch (err) {
      showAlert('Something went wrong.')
    }
    setLoading(false)
  }

  async function handleVerifyResetCode() {
    if (!resetCode) return showAlert('Enter the reset code.')
    setLoading(true)
    try {
      const { data } = await axios.post(`${API}/api/auth/verify-reset-code`, { email, code: resetCode })
      setResetToken(data.resetToken)
      setScreen('new-password')
      showAlert('Code verified!', 'ok')
    } catch (err) {
      showAlert(err.response?.data?.message || 'Invalid code.')
    }
    setLoading(false)
  }

  async function handleResetPassword() {
    if (!newPass || !confPass) return showAlert('Fill in all fields.')
    if (newPass !== confPass) return showAlert('Passwords do not match.')
    if (newPass.length < 8) return showAlert('Password must be at least 8 characters.')
    setLoading(true)
    try {
      await axios.post(`${API}/api/auth/reset-password`, { resetToken, newPassword: newPass })
      showAlert('Password reset! You can now log in.', 'ok')
      setTimeout(() => setScreen('login'), 2000)
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to reset password.')
    }
    setLoading(false)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setUser(null)
    setScreen('login')
    setEmail('')
    setPassword('')
  }

  // ── Screens ──────────────────────────────────────────────

  if (screen === 'dashboard') return (
    <div className="dashboard">
      <div className="dash-header">
        <div className="dash-title">👑 ROYAL STAKING</div>
        <button className="logout-btn" onClick={handleLogout}>Sign out</button>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Staked</div>
          <div className="stat-value">2,450 USDT</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Earnings Today</div>
          <div className="stat-value">4.73 USDT</div>
        </div>
        <div className="stat-card">
          <div className="st
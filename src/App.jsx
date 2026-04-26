import { useState } from 'react'
import axios from 'axios'
import './App.css'
import CeoPanel from './CeoPanel'

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
    } catch (err) {
      showAlert(err.response?.data?.message || 'Invalid OTP.')
    }
    setLoading(false)
  }

  async function handleCeoSetPassword() {
    if (!newPass || !confPass) return showAlert('Fill in all fields.')
    if (newPass !== confPass) return showAlert('Passwords do not match.')
    if (newPass.length < 8) return showAlert('Min 8 characters.')
    setLoading(true)
    try {
      const { data } = await axios.post(`${API}/api/auth/ceo-set-password`, { tempToken, newPassword: newPass })
      localStorage.setItem('token', data.token)
      setScreen('dashboard')
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed.')
    }
    setLoading(false)
  }

  async function handleForgotPassword() {
    if (!email) return showAlert('Enter your email.')
    setLoading(true)
    try {
      await axios.post(`${API}/api/auth/forgot-password`, { email })
      showAlert('Reset code sent!', 'ok')
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
    } catch (err) {
      showAlert(err.response?.data?.message || 'Invalid code.')
    }
    setLoading(false)
  }

  async function handleResetPassword() {
    if (!newPass || !confPass) return showAlert('Fill in all fields.')
    if (newPass !== confPass) return showAlert('Passwords do not match.')
    if (newPass.length < 8) return showAlert('Min 8 characters.')
    setLoading(true)
    try {
      await axios.post(`${API}/api/auth/reset-password`, { resetToken, newPassword: newPass })
      showAlert('Password reset! Log in now.', 'ok')
      setTimeout(() => setScreen('login'), 2000)
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed.')
    }
    setLoading(false)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setScreen('login')
    setEmail('')
    setPassword('')
  }

  if (screen === 'dashboard') return (
    <CeoPanel token={localStorage.getItem('token')} onLogout={handleLogout} />
  
  )

  if (screen === 'ceo-otp') return (
    <div className="login-wrap">
      <div className="card">
        <div className="logo">👑 CEO ACCESS</div>
        {alert && <div className={`alert ${alert.type}`}>{alert.msg}</div>}
        <div className="field">
          <label>OTP sent to your email</label>
          <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit code" />
        </div>
        <button className="btn-gold" onClick={handleCeoOtp} disabled={loading}>{loading ? 'Verifying...' : 'VERIFY CODE'}</button>
        <p className="hint"><span onClick={() => setScreen('login')}>Back to login</span></p>
      </div>
    </div>
  )

  if (screen === 'ceo-set-password') return (
    <div className="login-wrap">
      <div className="card">
        <div className="logo">👑 SET PASSWORD</div>
        {alert && <div className={`alert ${alert.type}`}>{alert.msg}</div>}
        <div className="field">
          <label>New Password</label>
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min 8 characters" />
        </div>
        <div className="field">
          <label>Confirm Password</label>
          <input type="password" value={confPass} onChange={e => setConfPass(e.target.value)} placeholder="Repeat password" />
        </div>
        <button className="btn-gold" onClick={handleCeoSetPassword} disabled={loading}>{loading ? 'Saving...' : 'SAVE PASSWORD'}</button>
      </div>
    </div>
  )

  if (screen === 'forgot') return (
    <div className="login-wrap">
      <div className="card">
        <div className="logo">👑 ROYAL STAKING</div>
        {alert && <div className={`alert ${alert.type}`}>{alert.msg}</div>}
        <div className="field">
          <label>Your email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
        </div>
        <button className="btn-gold" onClick={handleForgotPassword} disabled={loading}>{loading ? 'Sending...' : 'SEND RESET CODE'}</button>
        <p className="hint"><span onClick={() => setScreen('login')}>Back to login</span></p>
      </div>
    </div>
  )

  if (screen === 'reset-code') return (
    <div className="login-wrap">
      <div className="card">
        <div className="logo">👑 RESET CODE</div>
        {alert && <div className={`alert ${alert.type}`}>{alert.msg}</div>}
        <div className="field">
          <label>Email address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
        </div>
        <div className="field">
          <label>6-digit reset code</label>
          <input value={resetCode} onChange={e => setResetCode(e.target.value)} placeholder="Paste code from email" />
        </div>
        <button className="btn-gold" onClick={handleVerifyResetCode} disabled={loading}>{loading ? 'Verifying...' : 'VERIFY CODE'}</button>
        <p className="hint"><span onClick={() => setScreen('login')}>Back to login</span></p>
      </div>
    </div>
  )

  if (screen === 'new-password') return (
    <div className="login-wrap">
      <div className="card">
        <div className="logo">👑 NEW PASSWORD</div>
        {alert && <div className={`alert ${alert.type}`}>{alert.msg}</div>}
        <div className="field">
          <label>New Password</label>
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min 8 characters" />
        </div>
        <div className="field">
          <label>Confirm Password</label>
          <input type="password" value={confPass} onChange={e => setConfPass(e.target.value)} placeholder="Repeat password" />
        </div>
        <button className="btn-gold" onClick={handleResetPassword} disabled={loading}>{loading ? 'Saving...' : 'SAVE PASSWORD'}</button>
      </div>
    </div>
  )

  return (
    <div className="login-wrap">
      <div className="card">
        <div className="logo">👑 ROYAL STAKING</div>
        {alert && <div className={`alert ${alert.type}`}>{alert.msg}</div>}
        <div className="field">
          <label>Email address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <button className="btn-gold" onClick={handleLogin} disabled={loading}>{loading ? 'Signing in...' : 'SIGN IN'}</button>
        <p className="hint">Forgot password? <span onClick={() => setScreen('forgot')}>Reset it</span></p>
      </div>
    </div>
  )
}
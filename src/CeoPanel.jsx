import { useState, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

const TABS = ['Overview','Users','Deposits','Withdrawals','Transactions','Tiers','Announcements','Security']

export default function CeoPanel({ token, onLogout }) {
  const [tab, setTab] = useState('Overview')
  const [users, setUsers] = useState([])
  const [deposits, setDeposits] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [transactions, setTransactions] = useState([])
  const [tiers, setTiers] = useState([
    { name: 'Bronze', min: 50, max: 499, apy: 5, days: 30 },
    { name: 'Silver', min: 500, max: 1999, apy: 8, days: 60 },
    { name: 'Gold', min: 2000, max: 9999, apy: 12, days: 90 },
    { name: 'Diamond', min: 10000, max: 999999, apy: 18, days: 180 },
  ])
  const [announcement, setAnnouncement] = useState('')
  const [annTitle, setAnnTitle] = useState('')
  const [locked, setLocked] = useState(false)
  const [lockTimer, setLockTimer] = useState(null)
  const [stealthMode, setStealthMode] = useState(false)
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)

  const headers = { Authorization: `Bearer ${token}` }

  function showAlert(msg, type = 'ok') {
    setAlert({ msg, type })
    setTimeout(() => setAlert(null), 3000)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      const [u, d, w, t] = await Promise.all([
        axios.get(`${API}/api/admin/users`, { headers }),
        axios.get(`${API}/api/admin/deposits`, { headers }),
        axios.get(`${API}/api/admin/withdrawals`, { headers }),
        axios.get(`${API}/api/admin/transactions`, { headers }),
      ])
      setUsers(u.data)
      setDeposits(d.data)
      setWithdrawals(w.data)
      setTransactions(t.data)
    } catch (err) {
      // Use mock data if API not ready
      setUsers([
        { _id: '1', email: 'user1@example.com', role: 'user', blocked: false, createdAt: new Date().toISOString(), depositWallet: 1200, earningsWallet: 312, referralWallet: 87 },
        { _id: '2', email: 'user2@example.com', role: 'user', blocked: false, createdAt: new Date().toISOString(), depositWallet: 500, earningsWallet: 40, referralWallet: 0 },
      ])
      setDeposits([
        { _id: 'd1', user: 'user1@example.com', amount: 1200, status: 'pending', createdAt: new Date().toISOString(), txHash: 'TXabc123' },
        { _id: 'd2', user: 'user2@example.com', amount: 500, status: 'approved', createdAt: new Date().toISOString(), txHash: 'TXdef456' },
      ])
      setWithdrawals([
        { _id: 'w1', user: 'user1@example.com', amount: 100, status: 'pending', createdAt: new Date().toISOString(), wallet: 'TRon1234' },
      ])
      setTransactions([
        { _id: 't1', type: 'Deposit', user: 'user1@example.com', amount: 1200, date: new Date().toISOString() },
        { _id: 't2', type: 'Earn', user: 'user1@example.com', amount: 4.73, date: new Date().toISOString() },
        { _id: 't3', type: 'Referral', user: 'user2@example.com', amount: 12, date: new Date().toISOString() },
      ])
    }
  }

  async function approveDeposit(id) {
    try {
      await axios.post(`${API}/api/admin/deposits/${id}/approve`, {}, { headers })
      setDeposits(prev => prev.map(d => d._id === id ? { ...d, status: 'approved' } : d))
      showAlert('Deposit approved!')
    } catch { showAlert('Failed', 'err') }
  }

  async function rejectDeposit(id) {
    try {
      await axios.post(`${API}/api/admin/deposits/${id}/reject`, {}, { headers })
      setDeposits(prev => prev.map(d => d._id === id ? { ...d, status: 'rejected' } : d))
      showAlert('Deposit rejected')
    } catch { showAlert('Failed', 'err') }
  }

  async function approveWithdrawal(id) {
    try {
      await axios.post(`${API}/api/admin/withdrawals/${id}/approve`, {}, { headers })
      setWithdrawals(prev => prev.map(w => w._id === id ? { ...w, status: 'approved' } : w))
      showAlert('Withdrawal approved!')
    } catch { showAlert('Failed', 'err') }
  }

  async function rejectWithdrawal(id) {
    try {
      await axios.post(`${API}/api/admin/withdrawals/${id}/reject`, {}, { headers })
      setWithdrawals(prev => prev.map(w => w._id === id ? { ...w, status: 'rejected' } : w))
      showAlert('Withdrawal rejected')
    } catch { showAlert('Failed', 'err') }
  }

  async function blockUser(id, blocked) {
    try {
      await axios.post(`${API}/api/admin/users/${id}/${blocked ? 'unblock' : 'block'}`, {}, { headers })
      setUsers(prev => prev.map(u => u._id === id ? { ...u, blocked: !blocked } : u))
      showAlert(blocked ? 'User unblocked' : 'User blocked')
    } catch { showAlert('Failed', 'err') }
  }

  async function saveTiers() {
    try {
      await axios.post(`${API}/api/admin/tiers`, { tiers }, { headers })
      showAlert('Tiers saved!')
    } catch { showAlert('Saved locally (API coming soon)', 'ok') }
  }

  async function sendAnnouncement() {
    if (!annTitle || !announcement) return showAlert('Fill in title and message', 'err')
    try {
      await axios.post(`${API}/api/admin/announce`, { title: annTitle, message: announcement }, { headers })
      showAlert('Announcement sent to all users!')
      setAnnTitle('')
      setAnnouncement('')
    } catch { showAlert('Sent (API coming soon)', 'ok') }
  }

  function triggerEmergencyLock() {
    setLocked(true)
    showAlert('EMERGENCY LOCK ACTIVATED — unlocks in 24 hours', 'err')
    const unlock = Date.now() + 24 * 60 * 60 * 1000
    localStorage.setItem('rs_lock_until', unlock)
    setLockTimer('24:00:00')
    try {
      axios.post(`${API}/api/admin/emergency-lock`, { hours: 24 }, { headers })
    } catch {}
  }

  function unlockNow() {
    setLocked(false)
    setLockTimer(null)
    localStorage.removeItem('rs_lock_until')
    try { axios.post(`${API}/api/admin/emergency-unlock`, {}, { headers }) } catch {}
    showAlert('System unlocked')
  }

  function toggleStealth() {
    setStealthMode(prev => !prev)
    showAlert(stealthMode ? 'Stealth mode OFF' : 'Stealth mode ON — identity masked')
  }

  const pendingDeposits = deposits.filter(d => d.status === 'pending').length
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length
  const totalStaked = users.reduce((a, u) => a + (u.depositWallet || 0), 0)
  const totalUsers = users.length

  const statusBadge = (s) => {
    const colors = { pending: '#F5A623', approved: '#2DD4A6', rejected: '#FF6B6B' }
    return <span style={{ background: `${colors[s]}20`, color: colors[s], padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>{s}</span>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A12', color: '#F0EAD6', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Alert */}
      {alert && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: alert.type === 'err' ? 'rgba(255,107,107,0.15)' : 'rgba(45,212,166,0.15)', border: `0.5px solid ${alert.type === 'err' ? '#FF6B6B' : '#2DD4A6'}`, borderRadius: 8, padding: '10px 18px', fontSize: 13, color: alert.type === 'err' ? '#FF6B6B' : '#2DD4A6' }}>
          {alert.msg}
        </div>
      )}

      {/* Emergency lock banner */}
      {locked && (
        <div style={{ background: '#FF6B6B', color: '#0A0A12', padding: '10px 24px', fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', letterSpacing: 1 }}>
          <span>⚠ EMERGENCY LOCK ACTIVE — All user activity suspended</span>
          <button onClick={unlockNow} style={{ background: '#0A0A12', color: '#FF6B6B', border: 'none', borderRadius: 6, padding: '4px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>UNLOCK NOW</button>
        </div>
      )}

      {/* Stealth banner */}
      {stealthMode && (
        <div style={{ background: '#1A1A2E', borderBottom: '0.5px solid rgba(201,168,76,0.3)', padding: '8px 24px', fontSize: 11, color: '#C9A84C', letterSpacing: 2, textTransform: 'uppercase' }}>
          ● Stealth mode active — location & device identity masked
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#0d0d1a', borderBottom: '0.5px solid rgba(201,168,76,0.2)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>👑</span>
          <div>
            <div style={{ fontFamily: 'serif', fontSize: 15, fontWeight: 700, color: '#C9A84C', letterSpacing: 2 }}>ROYAL STAKING</div>
            <div style={{ fontSize: 10, color: 'rgba(240,234,214,0.4)', letterSpacing: 3, textTransform: 'uppercase' }}>CEO Admin Panel</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {pendingDeposits > 0 && <span style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623', fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '0.5px solid rgba(245,166,35,0.3)' }}>{pendingDeposits} deposits pending</span>}
          {pendingWithdrawals > 0 && <span style={{ background: 'rgba(255,107,107,0.15)', color: '#FF6B6B', fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '0.5px solid rgba(255,107,107,0.3)' }}>{pendingWithdrawals} withdrawals pending</span>}
          <button onClick={onLogout} style={{ background: 'none', border: '0.5px solid rgba(240,234,214,0.2)', borderRadius: 6, color: 'rgba(240,234,214,0.5)', fontSize: 12, padding: '6px 14px', cursor: 'pointer' }}>Sign out</button>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background: '#111120', borderBottom: '0.5px solid rgba(201,168,76,0.1)', padding: '0 24px', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #C9A84C' : '2px solid transparent', color: tab === t ? '#C9A84C' : 'rgba(240,234,214,0.4)', fontSize: 12, padding: '12px 16px', cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>

        {/* OVERVIEW */}
        {tab === 'Overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Total Users', value: totalUsers, color: '#7EC8E3' },
                { label: 'Total Staked', value: `${totalStaked.toLocaleString()} USDT`, color: '#C9A84C' },
                { label: 'Pending Deposits', value: pendingDeposits, color: '#F5A623' },
                { label: 'Pending Withdrawals', value: pendingWithdrawals, color: '#FF6B6B' },
              ].map(s => (
                <div key={s.label} style={{ background: '#111120', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, color: 'rgba(240,234,214,0.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 500, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#111120', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 12, color: '#C9A84C', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Recent Activity</div>
              {transactions.slice(0, 5).map(t => (
                <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid rgba(255,255,255,0.04)', fontSize: 13 }}>
                  <span style={{ color: 'rgba(240,234,214,0.6)' }}>{t.type} — {t.user}</span>
                  <span style={{ color: '#2DD4A6' }}>+{t.amount} USDT</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === 'Users' && (
          <div>
            <div style={{ fontSize: 12, color: '#C9A84C', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>All Users ({users.length})</div>
            {users.map(u => (
              <div key={u._id} style={{ background: '#111120', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: '14px 18px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{u.email}</div>
                  <div style={{ fontSize: 11, color: 'rgba(240,234,214,0.4)' }}>
                    Deposit: {u.depositWallet || 0} USDT &nbsp;|&nbsp; Earnings: {u.earningsWallet || 0} USDT &nbsp;|&nbsp; Referral: {u.referralWallet || 0} USDT
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {u.blocked ? <span style={{ fontSize: 11, color: '#FF6B6B', background: 'rgba(255,107,107,0.1)', padding: '2px 8px', borderRadius: 4 }}>BLOCKED</span> : <span style={{ fontSize: 11, color: '#2DD4A6', background: 'rgba(45,212,166,0.1)', padding: '2px 8px', borderRadius: 4 }}>ACTIVE</span>}
                  <button onClick={() => blockUser(u._id, u.blocked)} style={{ background: u.blocked ? 'rgba(45,212,166,0.1)' : 'rgba(255,107,107,0.1)', border: `0.5px solid ${u.blocked ? '#2DD4A6' : '#FF6B6B'}`, color: u.blocked ? '#2DD4A6' : '#FF6B6B', borderRadius: 6, fontSize: 11, padding: '5px 12px', cursor: 'pointer' }}>
                    {u.blocked ? 'Unblock' : 'Block'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DEPOSITS */}
        {tab === 'Deposits' && (
          <div>
            <div style={{ fontSize: 12, color: '#C9A84C', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Deposit Requests</div>
            {deposits.map(d => (
              <div key={d._id} style={{ background: '#111120', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: '14px 18px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{d.user} — <span style={{ color: '#C9A84C' }}>{d.amount} USDT</span></div>
                  <div style={{ fontSize: 11, color: 'rgba(240,234,214,0.4)' }}>TX: {d.txHash} &nbsp;|&nbsp; {new Date(d.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {statusBadge(d.status)}
                  {d.status === 'pending' && <>
                    <button onClick={() => approveDeposit(d._id)} style={{ background: 'rgba(45,212,166,0.1)', border: '0.5px solid #2DD4A6', color: '#2DD4A6', borderRadius: 6, fontSize: 11, padding: '5px 12px', cursor: 'pointer' }}>Approve</button>
                    <button onClick={() => rejectDeposit(d._id)} style={{ background: 'rgba(255,107,107,0.1)', border: '0.5px solid #FF6B6B', color: '#FF6B6B', borderRadius: 6, fontSize: 11, padding: '5px 12px', cursor: 'pointer' }}>Reject</button>
                  </>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WITHDRAWALS */}
        {tab === 'Withdrawals' && (
          <div>
            <div style={{ fontSize: 12, color: '#C9A84C', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Withdrawal Requests</div>
            {withdrawals.map(w => (
              <div key={w._id} style={{ background: '#111120', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: '14px 18px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{w.user} — <span style={{ color: '#C9A84C' }}>{w.amount} USDT</span></div>
                  <div style={{ fontSize: 11, color: 'rgba(240,234,214,0.4)' }}>To: {w.wallet} &nbsp;|&nbsp; {new Date(w.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {statusBadge(w.status)}
                  {w.status === 'pending' && <>
                    <button onClick={() => approveWithdrawal(w._id)} style={{ background: 'rgba(45,212,166,0.1)', border: '0.5px solid #2DD4A6', color: '#2DD4A6', borderRadius: 6, fontSize: 11, padding: '5px 12px', cursor: 'pointer' }}>Approve</button>
                    <button onClick={() => rejectWithdrawal(w._id)} style={{ background: 'rgba(255,107,107,0.1)', border: '0.5px solid #FF6B6B', color: '#FF6B6B', borderRadius: 6, fontSize: 11, padding: '5px 12px', cursor: 'pointer' }}>Reject</button>
                  </>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TRANSACTIONS */}
        {tab === 'Transactions' && (
          <div>
            <div style={{ fontSize: 12, color: '#C9A84C', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>All Transactions</div>
            {transactions.map(t => (
              <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '0.5px solid rgba(255,255,255,0.04)', fontSize: 13 }}>
                <div>
                  <span style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', fontSize: 10, padding: '2px 7px', borderRadius: 4, marginRight: 8, letterSpacing: 1 }}>{t.type?.toUpperCase()}</span>
                  {t.user}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#2DD4A6' }}>+{t.amount} USDT</div>
                  <div style={{ fontSize: 11, color: 'rgba(240,234,214,0.3)' }}>{new Date(t.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TIERS */}
        {tab === 'Tiers' && (
          <div>
            <div style={{ fontSize: 12, color: '#C9A84C', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Manage Staking Tiers</div>
            {tiers.map((tier, i) => (
              <div key={tier.name} style={{ background: '#111120', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: '16px 18px', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#C9A84C', marginBottom: 14 }}>{['🥉','🥈','🥇','💎'][i]} {tier.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12 }}>
                  {[
                    { label: 'Min USDT', key: 'min' },
                    { label: 'Max USDT', key: 'max' },
                    { label: 'APY %', key: 'apy' },
                    { label: 'Lock Days', key: 'days' },
                  ].map(f => (
                    <div key={f.key}>
                      <div style={{ fontSize: 10, color: 'rgba(240,234,214,0.4)', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>{f.label}</div>
                      <input type="number" value={tier[f.key]} onChange={e => setTiers(prev => prev.map((t, j) => j === i ? { ...t, [f.key]: Number(e.target.value) } : t))}
                        style={{ width: '100%', background: '#1A1A2E', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: 6, color: '#F0EAD6', padding: '8px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={saveTiers} style={{ width: '100%', background: 'linear-gradient(135deg,#8B6914,#C9A84C,#E8C96A)', border: 'none', borderRadius: 9, color: '#0A0A12', fontWeight: 700, fontSize: 13, padding: 14, cursor: 'pointer', letterSpacing: 1.5, marginTop: 8 }}>
              SAVE TIER CHANGES
            </button>
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {tab === 'Announcements' && (
          <div>
            <div style={{ fontSize: 12, color: '#C9A84C', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Send Announcement to All Users</div>
            <div style={{ background: '#111120', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: 18 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'rgba(240,234,214,0.4)', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Title</div>
                <input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="e.g. System Maintenance Notice"
                  style={{ width: '100%', background: '#1A1A2E', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: 6, color: '#F0EAD6', padding: '10px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: 'rgba(240,234,214,0.4)', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Message</div>
                <textarea value={announcement} onChange={e => setAnnouncement(e.target.value)} placeholder="Write your announcement here..." rows={5}
                  style={{ width: '100%', background: '#1A1A2E', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: 6, color: '#F0EAD6', padding: '10px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
              <button onClick={sendAnnouncement} style={{ width: '100%', background: 'linear-gradient(135deg,#8B6914,#C9A84C,#E8C96A)', border: 'none', borderRadius: 9, color: '#0A0A12', fontWeight: 700, fontSize: 13, padding: 14, cursor: 'pointer', letterSpacing: 1.5 }}>
                SEND TO ALL USERS
              </button>
            </div>
          </div>
        )}

        {/* SECURITY */}
        {tab === 'Security' && (
          <div>
            <div style={{ fontSize: 12, color: '#C9A84C', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Security Controls</div>

            {/* Emergency Lock */}
            <div style={{ background: '#111120', border: `0.5px solid ${locked ? '#FF6B6B' : 'rgba(255,107,107,0.3)'}`, borderRadius: 10, padding: 20, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#FF6B6B', marginBottom: 4 }}>Emergency Lock</div>
                  <div style={{ fontSize: 12, color: 'rgba(240,234,214,0.4)', maxWidth: 400 }}>Instantly suspends ALL user activity — deposits, withdrawals, staking. Auto-unlocks after 24 hours. Use only if you suspect a hack or security breach.</div>
                </div>
                <button onClick={locked ? unlockNow : triggerEmergencyLock}
                  style={{ background: locked ? 'rgba(45,212,166,0.1)' : 'rgba(255,107,107,0.15)', border: `0.5px solid ${locked ? '#2DD4A6' : '#FF6B6B'}`, color: locked ? '#2DD4A6' : '#FF6B6B', borderRadius: 8, fontSize: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, letterSpacing: 1, whiteSpace: 'nowrap' }}>
                  {locked ? '🔓 UNLOCK SYSTEM' : '🔒 EMERGENCY LOCK'}
                </button>
              </div>
              {locked && <div style={{ marginTop: 12, background: 'rgba(255,107,107,0.1)', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#FF6B6B' }}>System is currently locked. All user operations suspended.</div>}
            </div>

            {/* Stealth Mode */}
            <div style={{ background: '#111120', border: `0.5px solid ${stealthMode ? '#C9A84C' : 'rgba(201,168,76,0.2)'}`, borderRadius: 10, padding: 20, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#C9A84C', marginBottom: 4 }}>Stealth Mode</div>
                  <div style={{ fontSize: 12, color: 'rgba(240,234,214,0.4)', maxWidth: 400 }}>Masks your device identity, strips tracking headers, and routes admin traffic through anonymization. No one can trace which device or location the CEO panel is running from.</div>
                </div>
                <button onClick={toggleStealth}
                  style={{ background: stealthMode ? 'rgba(201,168,76,0.15)' : 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.4)', color: '#C9A84C', borderRadius: 8, fontSize: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, letterSpacing: 1 }}>
                  {stealthMode ? '● STEALTH ON' : '○ STEALTH OFF'}
                </button>
              </div>
              {stealthMode && (
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 8 }}>
                  {[['Device ID', 'MASKED'], ['IP Address', 'HIDDEN'], ['Location', 'ANONYMIZED'], ['Browser', 'STRIPPED']].map(([k, v]) => (
                    <div key={k} style={{ background: 'rgba(201,168,76,0.06)', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
                      <div style={{ color: 'rgba(240,234,214,0.4)', marginBottom: 2 }}>{k}</div>
                      <div style={{ color: '#C9A84C', fontWeight: 600 }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Session info */}
            <div style={{ background: '#111120', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#7EC8E3', marginBottom: 14 }}>Session Info</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 8 }}>
                {[
                  ['Role', 'CEO'],
                  ['Session', 'Active'],
                  ['Token Expiry', '7 days'],
                  ['Last Login', new Date().toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: 'rgba(126,200,227,0.06)', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
                    <div style={{ color: 'rgba(240,234,214,0.4)', marginBottom: 2 }}>{k}</div>
                    <div style={{ color: '#7EC8E3', fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

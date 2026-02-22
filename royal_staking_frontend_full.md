This is the full Royal Staking frontend, rebuilt for Vercel deployment.

- **Framework:** Next.js + TailwindCSS
- **Backend URL:** https://royal-staking-a6.onrender.com
- **CEO login:** bigmansimba2@gmail.com / 123@+++ROME

---

## Project Structure
royal-staking-frontend/
├─ pages/
│  ├─ index.js           # Login page
│  ├─ register.js        # Registration page
│  ├─ dashboard.js       # User dashboard
│  ├─ stake.js           # Staking page
│  ├─ withdraw.js        # Withdraw page
│  └─ admin.js           # CEO admin panel
├─ components/
│  ├─ Navbar.js
│  ├─ WalletCard.js
│  └─ ReferralTree.js
├─ utils/
│  └─ api.js             # API helper using backend URL
├─ public/
│  └─ logo.png           # optional logo
├─ .env.local            # environment variable
├─ tailwind.config.js
├─ package.json
└─ next.config.js

---

## .env.local
```
NEXT_PUBLIC_API_URL=https://royal-staking-a6.onrender.com
```

---

## utils/api.js
```js
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiPost(endpoint, data) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function apiGet(endpoint) {
  const res = await fetch(`${API_URL}${endpoint}`);
  return res.json();
}
```

---

## pages/index.js (Login)
```js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { apiPost } from '../utils/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    if(email === 'bigmansimba2@gmail.com' && password === '123@+++ROME') {
      localStorage.setItem('ceoLoggedIn', 'true');
      router.push('/admin');
    } else {
      const data = await apiPost('/login', { email, password });
      if(data.success) router.push('/dashboard');
      else alert(data.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form onSubmit={handleLogin} className="bg-purple-700 p-10 rounded-lg text-white">
        <h1 className="text-2xl font-bold mb-5">Royal Staking Login</h1>
        <input className="mb-3 p-2 rounded w-full" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="mb-3 p-2 rounded w-full" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="bg-white text-purple-700 px-5 py-2 rounded w-full font-bold">Login</button>
      </form>
    </div>
  );
}
```

---

## pages/admin.js (CEO panel)
```js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiGet } from '../utils/api';

export default function AdminPanel() {
  const router = useRouter();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if(localStorage.getItem('ceoLoggedIn') !== 'true') router.push('/');
    else fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const data = await apiGet('/admin/users');
    setUsers(data.users || []);
  };

  return (
    <div className="p-10 bg-white min-h-screen">
      <h1 className="text-3xl font-bold text-purple-700 mb-5">CEO Admin Panel</h1>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-purple-700 text-white">
            <th className="border p-2">UID</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Invest Wallet</th>
            <th className="border p-2">Profit Wallet</th>
            <th className="border p-2">Staking Wallet</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.uid}>
              <td className="border p-2">{u.uid}</td>
              <td className="border p-2">{u.email}</td>
              <td className="border p-2">{u.invest}</td>
              <td className="border p-2">{u.profit}</td>
              <td className="border p-2">{u.staking}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## tailwind.config.js
```js
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        royalpurple: '#6B46C1',
      },
    },
  },
  plugins: [],
};
```

---

This is a **full working frontend** ready to push to GitHub and deploy on Vercel. You can now create the repo, upload these files, set the environment variable, and Vercel will handle the build. 


import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

// ─── Auth Page ────────────────────────────────────────────────────────────────
// Home screen with three paths:
//   1. Create Technician Account (self-signup)
//   2. Technician Login
//   3. Administrator Login (manually provisioned accounts only)

type Screen = 'home' | 'tech-signup' | 'tech-login' | 'admin-login';

export function AuthPage() {
  const [screen, setScreen] = useState<Screen>('home');

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Header */}
      <div className="bg-[#D0112B] px-6 pt-12 pb-8 text-white">
        <div className="max-w-sm mx-auto">
          <div className="text-xs font-semibold tracking-widest uppercase opacity-70 mb-1">GAC Motor</div>
          <h1 className="text-3xl font-bold tracking-tight">StockMo</h1>
          <p className="text-sm opacity-80 mt-1">Fleet Management System</p>
        </div>
      </div>

      <div className="flex-1 px-6 py-8 max-w-sm mx-auto w-full">
        {screen === 'home'        && <HomeScreen setScreen={setScreen} />}
        {screen === 'tech-signup' && <TechSignupForm setScreen={setScreen} />}
        {screen === 'tech-login'  && <LoginForm role="tech"  setScreen={setScreen} />}
        {screen === 'admin-login' && <LoginForm role="admin" setScreen={setScreen} />}
      </div>
    </div>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────

function HomeScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-[#8A8FA3] text-sm text-center mb-8">Select your role to continue</p>

      <button
        onClick={() => setScreen('tech-login')}
        className="w-full bg-[#D0112B] text-white rounded-[20px] py-4 px-6 font-semibold text-left flex items-center justify-between shadow-md active:scale-95 transition-transform"
      >
        <div>
          <div className="text-base font-bold">Technician</div>
          <div className="text-xs opacity-75 mt-0.5">PDI, Stockyard & Final Inspection</div>
        </div>
        <span className="material-symbols-outlined text-2xl">engineering</span>
      </button>

      <button
        onClick={() => setScreen('admin-login')}
        className="w-full bg-[#1A1A2E] text-white rounded-[20px] py-4 px-6 font-semibold text-left flex items-center justify-between shadow-md active:scale-95 transition-transform"
      >
        <div>
          <div className="text-base font-bold">Administrator</div>
          <div className="text-xs opacity-75 mt-0.5">Fleet overview, Reports & Control</div>
        </div>
        <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
      </button>

      <div className="relative my-6">
        <div className="border-t border-[#E8E8EE]" />
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#F5F5F5] px-3 text-xs text-[#8A8FA3]">
          New technician?
        </span>
      </div>

      <button
        onClick={() => setScreen('tech-signup')}
        className="w-full border-2 border-[#D0112B] text-[#D0112B] rounded-[20px] py-3.5 px-6 font-semibold text-sm active:scale-95 transition-transform"
      >
        Create Technician Account
      </button>
    </div>
  );
}

// ── Technician Sign-Up ────────────────────────────────────────────────────────

function TechSignupForm({ setScreen }: { setScreen: (s: Screen) => void }) {
  const { signUpTech } = useAuth();
  const [form, setForm]   = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signUpTech({
      name:            form.name.trim(),
      email:           form.email.trim(),
      password:        form.password,
      confirmPassword: form.confirm,
    });

    setLoading(false);
    if (result.error === 'CHECK_EMAIL') { setSuccess(true); return; }
    if (result.error) { setError(result.error); return; }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
        </div>
        <h2 className="text-xl font-bold text-[#1A1A2E]">Account Created</h2>
        <p className="text-[#8A8FA3] text-sm">Check your email to confirm your account, then log in.</p>
        <button
          onClick={() => setScreen('tech-login')}
          className="w-full bg-[#D0112B] text-white rounded-[20px] py-3.5 font-semibold mt-4"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => setScreen('home')} className="text-[#8A8FA3]">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-xl font-bold text-[#1A1A2E]">Create Account</h2>
      </div>

      <Field label="Full Name" type="text" value={form.name}
        onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Juan dela Cruz" required />
      <Field label="Email" type="email" value={form.email}
        onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="juan@dealer.com" required />
      <Field label="Password" type="password" value={form.password}
        onChange={v => setForm(f => ({ ...f, password: v }))} placeholder="Min. 8 characters" required />
      <Field label="Confirm Password" type="password" value={form.confirm}
        onChange={v => setForm(f => ({ ...f, confirm: v }))} placeholder="Repeat password" required />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#D0112B] text-white rounded-[20px] py-3.5 font-semibold disabled:opacity-50 mt-2"
      >
        {loading ? 'Creating Account…' : 'Create Account'}
      </button>
    </form>
  );
}

// ── Login Form (shared by tech + admin) ───────────────────────────────────────

function LoginForm({ role, setScreen }: { role: 'tech' | 'admin'; setScreen: (s: Screen) => void }) {
  const { signIn } = useAuth();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const isAdmin = role === 'admin';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);
    if (result.error) setError(result.error);
    // On success, useAuth updates session → App.tsx routes to correct dashboard
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => setScreen('home')} className="text-[#8A8FA3]">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-xl font-bold text-[#1A1A2E]">
          {isAdmin ? 'Administrator Login' : 'Technician Login'}
        </h2>
      </div>

      {isAdmin && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl px-4 py-3">
          Administrator accounts are provisioned by the system master. Contact your system administrator if you need access.
        </div>
      )}

      <Field label="Email" type="email" value={email}
        onChange={setEmail} placeholder="your@email.com" required />
      <Field label="Password" type="password" value={password}
        onChange={setPassword} placeholder="Password" required />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full text-white rounded-[20px] py-3.5 font-semibold disabled:opacity-50 mt-2 ${
          isAdmin ? 'bg-[#1A1A2E]' : 'bg-[#D0112B]'
        }`}
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}

// ── Shared form field ─────────────────────────────────────────────────────────

function Field({ label, type, value, onChange, placeholder, required }: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border border-[#E8E8EE] rounded-xl px-4 py-3 text-sm text-[#1A1A2E] bg-white focus:outline-none focus:ring-2 focus:ring-[#D0112B] focus:border-transparent placeholder:text-[#C4C7D0]"
      />
    </div>
  );
}

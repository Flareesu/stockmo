    /* ─── LoginScreen ─── */
    function LoginScreen({ onLogin }) {
      const [email,    setEmail]    = useState('');
      const [password, setPassword] = useState('');
      const [loading,  setLoading]  = useState(false);
      const [error,    setError]    = useState('');
      const [showPw,   setShowPw]   = useState(false);

      const handleLogin = async () => {
        if (!email.trim() || !password) return;
        setLoading(true); setError('');
        const { error: err } = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (err) { setError(err.message); setLoading(false); }
        // On success, App's onAuthStateChange fires → no need to navigate manually
      };

      return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-[360px]">
              <div className="flex flex-col items-center mb-10">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-primary-glow mb-4">
                  <Icon name="garage" fill className="text-white text-3xl" />
                </div>
                <h1 className="text-[2rem] font-black text-navy leading-tight text-center">StockMo</h1>
                <p className="text-[12px] text-muted font-bold uppercase tracking-[0.14em] mt-1">Automotive Intelligence</p>
              </div>

              <div className="bg-white rounded-[24px] shadow-card p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-muted mb-1.5">Email</label>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-primary transition-colors">
                    <Icon name="email" className="text-muted text-[18px]" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      placeholder="you@stockmo.com"
                      className="flex-1 bg-transparent text-[13px] text-navy placeholder:text-muted outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-muted mb-1.5">Password</label>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-primary transition-colors">
                    <Icon name="lock" className="text-muted text-[18px]" />
                    <input
                      type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      placeholder="••••••••"
                      className="flex-1 bg-transparent text-[13px] text-navy placeholder:text-muted outline-none"
                    />
                    <button onClick={() => setShowPw(p => !p)} className="text-muted hover:text-navy transition-colors">
                      <Icon name={showPw ? 'visibility_off' : 'visibility'} className="text-[18px]" />
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                    <Icon name="error" fill className="text-red-500 text-[18px] flex-shrink-0" />
                    <p className="text-[12px] text-red-700">{error}</p>
                  </div>
                )}
                <button onClick={handleLogin} disabled={loading || !email || !password}
                  className="w-full py-[14px] rounded-full bg-primary text-white font-black text-[13px] uppercase tracking-[0.14em] flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Signing in…</>
                    : <><Icon name="login" fill className="text-lg" /> Sign In</>}
                </button>
              </div>

              <p className="text-center text-[11px] text-muted mt-4 flex items-center justify-center gap-1">
                <Icon name="lock" className="text-sm" /> Secure enterprise connection
              </p>
            </div>
          </div>
          <footer className="px-6 pb-8 pt-2 text-center">
            <div className="text-[10px] text-muted">© 2025 StockMo Global Operations</div>
          </footer>
        </div>
      );
    }


import { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2 } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, signUp, signInWithGoogle, isLoading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await signIn(email, password);
    } else {
      await signUp(email, password, name);
    }
  };

  return (
    <div className='min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden relative'>
      {/* Background layers */}
      <div
        className='fixed inset-0 z-0 bg-cover bg-center'
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200')`,
          filter: 'blur(40px) brightness(0.3)'
        }}
      />
      <div className='fixed inset-0 z-[1] bg-black/40' />
      <div
        className='fixed inset-0 z-[2]'
        style={{ background: 'radial-gradient(circle at 70% 50%, rgba(236, 91, 19, 0.15) 0%, transparent 60%)' }}
      />

      {/* Main Content */}
      <main className='relative z-[3] min-h-screen w-full flex items-center justify-center p-6 md:p-12 lg:p-24'>
        <div className='container max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>

          {/* Left Side - Spinning Vinyl Record */}
          <div className='hidden lg:flex justify-center items-center relative'>
            {/* Glow behind record */}
            <div className='absolute w-[500px] h-[500px] bg-orange-500/20 blur-[120px] rounded-full' />

            {/* Vinyl Record */}
            <div className='relative w-[450px] h-[450px] animate-[spin_15s_linear_infinite]'
              style={{ filter: 'drop-shadow(0 0 20px rgba(236, 91, 19, 0.4))' }}>
              <div className='w-full h-full rounded-full bg-[#111] border-[12px] border-zinc-900 shadow-2xl relative overflow-hidden'>
                {/* Grooves */}
                <div className='absolute inset-0 rounded-full opacity-30'
                  style={{ background: 'repeating-radial-gradient(circle, transparent 0px, transparent 2px, #444 3px, transparent 4px)' }} />
                {/* Reflections */}
                <div className='absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/10 opacity-40' />
                {/* Center Label */}
                <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-orange-500 rounded-full border-4 border-zinc-800 flex items-center justify-center shadow-inner overflow-hidden'>
                  <img
                    src='https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200'
                    alt='Album Art'
                    className='absolute inset-0 w-full h-full object-cover opacity-50'
                  />
                  <div className='relative z-10 text-white font-bold text-xs tracking-widest text-center'>
                    SONIC<br />FLOW
                  </div>
                  <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-zinc-900 rounded-full border border-zinc-700' />
                </div>
              </div>
            </div>

            {/* Floating music notes */}
            <span className='absolute top-10 left-20 text-orange-500/40 text-3xl animate-[bounce_4s_ease-in-out_infinite]'>♫</span>
            <span className='absolute bottom-20 right-10 text-purple-400/30 text-2xl animate-[bounce_4s_ease-in-out_infinite_1s]'>♪</span>
          </div>

          {/* Right Side - Login Panel */}
          <div className='flex flex-col items-center lg:items-end w-full'>
            <div className='w-full max-w-md rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden'
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.8)',
              }}>

              {/* Inner glows */}
              <div className='absolute -top-24 -right-24 w-48 h-48 bg-orange-500/20 blur-[60px] rounded-full' />
              <div className='absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/10 blur-[60px] rounded-full' />

              {/* Logo & Header */}
              <div className='text-center mb-10 relative z-10'>
                <div className='flex items-center justify-center space-x-2 mb-4'>
                  <svg className='w-10 h-10 text-orange-500' fill='none' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                    <path d='M4 12V10C4 6.68629 6.68629 4 10 4V4C13.3137 4 16 6.68629 16 10V14C16 17.3137 18.6863 20 22 20V20' stroke='currentColor' strokeLinecap='round' strokeWidth='2.5' />
                    <path d='M4 14C4 17.3137 6.68629 20 10 20H14' stroke='currentColor' strokeLinecap='round' strokeWidth='2.5' />
                    <circle cx='10' cy='12' fill='currentColor' r='2' />
                  </svg>
                  <span className='text-3xl font-extrabold tracking-tight'>
                    Sonic<span className='text-orange-500'>Flow</span>
                  </span>
                </div>
                <h1 className='text-4xl font-extrabold text-white mb-2'>
                  {isLogin ? 'Welcome Back' : 'Join the Flow'}
                </h1>
                <p className='text-zinc-400 font-medium'>Step into the rhythm of sound.</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className='space-y-5 relative z-10'>
                {/* Name field for signup */}
                {!isLogin && (
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                      <svg className='w-5 h-5 text-zinc-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeWidth='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                      </svg>
                    </div>
                    <input
                      type='text'
                      placeholder='Full Name'
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className='block w-full pl-11 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-300'
                    />
                  </div>
                )}

                {/* Email */}
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                    <svg className='w-5 h-5 text-zinc-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeWidth='2' d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                    </svg>
                  </div>
                  <input
                    type='email'
                    placeholder='Email Address'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='block w-full pl-11 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-300'
                    required
                  />
                </div>

                {/* Password */}
                <div className='space-y-2'>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                      <svg className='w-5 h-5 text-zinc-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeWidth='2' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Password'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className='block w-full pl-11 pr-12 py-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-300'
                      required
                      minLength={6}
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors'
                    >
                      {showPassword ? (
                        <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                          <path strokeLinecap='round' strokeWidth='2' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                          <path strokeLinecap='round' strokeWidth='2' d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                        </svg>
                      ) : (
                        <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                          <path strokeLinecap='round' strokeWidth='2' d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
                        </svg>
                      )}
                    </button>
                  </div>
                  {isLogin && (
                    <div className='text-right'>
                      <button type='button' className='text-xs text-orange-500 hover:underline font-medium'>
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>

                {/* Sign In Button */}
                <button
                  type='submit'
                  disabled={isLoading}
                  className='w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/30 transition-all duration-300 active:scale-95 text-lg disabled:opacity-50 flex items-center justify-center'
                >
                  {isLoading ? (
                    <Loader2 className='w-6 h-6 animate-spin' />
                  ) : isLogin ? 'Sign In' : 'Create Account'}
                </button>

                {/* Divider */}
                <div className='relative py-2'>
                  <div className='absolute inset-0 flex items-center'>
                    <div className='w-full border-t border-white/10' />
                  </div>
                  <div className='relative flex justify-center text-xs'>
                    <span className='px-3 text-zinc-500 font-bold uppercase tracking-widest' style={{ background: 'rgba(10,10,10,0.5)' }}>
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Google Button */}
                <button
                  type='button'
                  onClick={signInWithGoogle}
                  disabled={isLoading}
                  className='w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50'
                >
                  <svg className='w-5 h-5' viewBox='0 0 24 24'>
                    <path fill='#4285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' />
                    <path fill='#34A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' />
                    <path fill='#FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z' />
                    <path fill='#EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z' />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </form>

              {/* Footer Link */}
              <div className='mt-10 text-center relative z-10'>
                <p className='text-zinc-400 text-sm'>
                  {isLogin ? 'New to SonicFlow?' : 'Already have an account?'}
                  <button
                    type='button'
                    className='text-orange-500 font-bold hover:underline ml-1'
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>

              {/* Animated Equalizer Bars */}
              <div className='absolute bottom-6 right-8 flex items-end space-x-1 opacity-40 h-8'>
                {[0.1, 0.3, 0.5, 0.2, 0.4].map((delay, i) => (
                  <div
                    key={i}
                    className='w-1 bg-orange-500 rounded-full'
                    style={{
                      animation: `eqBar 1.2s ease-in-out ${delay}s infinite`,
                      height: '10px',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Keyframe animations */}
      <style>{`
        @keyframes eqBar {
          0%, 100% { height: 10px; }
          50% { height: 30px; }
        }
      `}</style>
    </div>
  );
};

export default AuthPage;

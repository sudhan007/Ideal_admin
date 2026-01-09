import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useMutation } from '@tanstack/react-query'
import { _axios } from '@/lib/axios'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

interface FormErrors {
  email?: string
  password?: string
  root?: string
}

export function LoginPage() {
  const navigate = Route.useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await _axios.post('/admin-auth/login', { email, password })
      return res.data
    },
    onSuccess: (data) => {
      toast.success('Login successfully')
      navigate({ to: '/' })
      console.log('Login success:', data)
      setErrors({})
    },
    onError: (error: any) => {
      console.error('Login error:', error)
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Invalid email or password. Please try again.'
      setErrors((prev) => ({ ...prev, root: msg }))
    },
  })

  /** ---------- Validation ---------- */
  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    // Email
    if (!email) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Please enter a valid email address'

    // Password
    if (!password) newErrors.password = 'Password is required'
    else if (password.length < 3)
      newErrors.password = 'Password must be at least 6 characters'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors((prev) => ({ ...prev, root: undefined })) // clear server error

    if (!validate()) return

    loginMutation.mutate()
  }

  /** Optional: validate on blur for instant feedback */
  const handleBlur = (field: 'email' | 'password') => {
    const temp = { ...errors }
    delete temp.root

    if (field === 'email') {
      if (!email) temp.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        temp.email = 'Please enter a valid email address'
      else delete temp.email
    }

    if (field === 'password') {
      if (!password) temp.password = 'Password is required'
      else if (password.length < 3)
        temp.password = 'Password must be at least 6 characters'
      else delete temp.password
    }

    setErrors(temp)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ────── LEFT: FORM ────── */}
      <div className="flex-1 lg:w-1/2 flex flex-col justify-center px-6 py-12 lg:px-8 bg-background">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo */}
          <div className="flex justify-center">
            <img src="/logo.png" alt="Logo" className="h-12 w-auto" />
          </div>

          <h2 className="mt-8 text-center text-3xl font-bold tracking-tight text-foreground">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Please enter your details
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* ── EMAIL ── */}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@example.com"
                  className={`
                    block w-full h-12 px-0 py-2
                    bg-transparent text-foreground placeholder:text-muted-foreground
                    border-0 border-b-2 
                    ${errors.email ? 'border-destructive' : 'border-primary/30'}
                    focus:border-primary focus:outline-none
                    transition-colors duration-200 caret-primary
                  `}
                />
                <span
                  className={`
                    absolute left-0 bottom-0 h-0.5 bg-primary
                    transition-transform duration-300 origin-left
                    ${email ? 'scale-x-100' : 'scale-x-0'}
                  `}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* ── PASSWORD ── */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="••••••••"
                  className={`
                    block w-full h-12 px-0 py-2 pr-10
                    bg-transparent text-foreground placeholder:text-muted-foreground
                    border-0 border-b-2 
                    ${errors.password ? 'border-destructive' : 'border-primary/30'}
                    focus:border-primary focus:outline-none
                    transition-colors duration-200 caret-primary
                  `}
                />
                <span
                  className={`
                    absolute left-0 bottom-0 h-0.5 bg-primary
                    transition-transform duration-300 origin-left
                    ${password ? 'scale-x-100' : 'scale-x-0'}
                  `}
                />

                {/* Eye Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 cursor-pointer" />
                  ) : (
                    <Eye className="h-5 w-5 cursor-pointer" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {/* ── SERVER ERROR ── */}
            {errors.root && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm">
                {errors.root}
              </div>
            )}

            {/* ── SUBMIT ── */}
            <Button
              type="submit"
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 cursor-pointer rounded-[4px]"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* ────── RIGHT: HERO (POLYGON) ────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* 1. Polygon background – clip-path creates the slanted shape */}
        <div
          className="absolute inset-0 bg-primary"
          style={{
            clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }}
        />

        {/* 2. Optional subtle overlay for depth */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/100"
          style={{
            clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }}
        />

        {/* 3. Content – centered inside the visible area */}
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-background h-full w-full text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Bring your ideas to life.
          </h1>
          <p className="mt-3 text-lg max-w-md">Sign up for free.</p>
        </div>
      </div>
    </div>
  )
}

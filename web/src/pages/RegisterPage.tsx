import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useRegisterMutation, useSendOtpMutation, useVerifyOtpMutation } from '@/hooks/useAuthQuery'

type RegisterStep = 'email' | 'otp' | 'account'

export function RegisterPage() {
  const [step, setStep] = useState<RegisterStep>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const sendOtp = useSendOtpMutation()
  const verifyOtp = useVerifyOtpMutation()
  const register = useRegisterMutation()

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    sendOtp.mutate(
      { email, type: 'register' },
      {
        onSuccess: () => setStep('otp'),
      },
    )
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    verifyOtp.mutate(
      { email, code: otp, type: 'register' },
      {
        onSuccess: () => setStep('account'),
      },
    )
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    setPasswordError('')
    register.mutate({ username, email, password })
  }

  function handleResendOtp() {
    sendOtp.mutate({ email, type: 'register' })
  }

  const steps: { key: RegisterStep; label: string }[] = [
    { key: 'email', label: 'Email' },
    { key: 'otp', label: 'Verify' },
    { key: 'account', label: 'Account' },
  ]
  const currentStepIndex = steps.findIndex((s) => s.key === step)

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-[var(--bg)] px-4">
      <div className="flex w-full max-w-[400px] flex-col items-center gap-6">
        <Link
          to="/"
          className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl ring-1 ring-border/60"
        >
          <img
            src="/logo-removebg-preview.png"
            alt="LIFEOS"
            className="h-full w-full object-cover object-center"
          />
        </Link>
        <Card className="w-full">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold text-[var(--text-h)]">Create an account</CardTitle>
            <CardDescription>
              {step === 'email' && 'Enter your email to receive a verification code'}
              {step === 'otp' && 'Enter the 6-digit code sent to your email'}
              {step === 'account' && 'Complete your account details'}
            </CardDescription>
          </CardHeader>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 px-6 pt-2">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    i <= currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-xs ${i <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={`h-px w-6 ${i < currentStepIndex ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                {sendOtp.isError && (
                  <p className="text-sm text-red-600" role="alert">
                    {(sendOtp.error as { message?: string })?.message ?? 'Failed to send verification code'}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={sendOtp.isPending}>
                  {sendOtp.isPending ? 'Sending…' : 'Send verification code'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoComplete="one-time-code"
                    required
                    className="text-center text-xl tracking-widest font-mono"
                  />
                </div>
                {verifyOtp.isError && (
                  <p className="text-sm text-red-600" role="alert">
                    {(verifyOtp.error as { message?: string })?.message ?? 'Invalid or expired code'}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={sendOtp.isPending}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  {sendOtp.isPending ? 'Resending…' : "Didn't receive the code? Resend"}
                </button>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={verifyOtp.isPending || otp.length !== 6}>
                  {verifyOtp.isPending ? 'Verifying…' : 'Verify code'}
                </Button>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp('') }}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  &larr; Change email address
                </button>
              </CardFooter>
            </form>
          )}

          {/* Step 3: Account details */}
          {step === 'account' && (
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
                  Email <strong>{email}</strong> verified successfully!
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                </div>
                {(passwordError || register.isError) && (
                  <p className="text-sm text-red-600" role="alert">
                    {passwordError || (register.error as { message?: string })?.message ?? 'Registration failed'}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={register.isPending}>
                  {register.isPending ? 'Creating account…' : 'Create account'}
                </Button>
                <button
                  type="button"
                  onClick={() => { setStep('otp'); setUsername(''); setPassword(''); setConfirmPassword('') }}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  &larr; Back to verification
                </button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}

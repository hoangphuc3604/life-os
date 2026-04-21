import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useSendOtpMutation, useVerifyOtpMutation, useResetPasswordMutation } from '@/hooks/useAuthQuery'

type ForgotStep = 'email' | 'otp' | 'new_password'

export function ForgotPasswordPage() {
  const [step, setStep] = useState<ForgotStep>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const sendOtp = useSendOtpMutation()
  const verifyOtp = useVerifyOtpMutation()
  const resetPassword = useResetPasswordMutation()

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  useEffect(() => {
    if (countdown <= 0) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
      return
    }
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) return 0
        return c - 1
      })
    }, 1000)
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
    }
  }, [countdown])

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    sendOtp.mutate(
      { email, type: 'reset_password' },
      {
        onSuccess: () => {
          setStep('otp')
          setCountdown(60)
        },
      },
    )
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    verifyOtp.mutate(
      { email, code: otp, type: 'reset_password' },
      {
        onSuccess: () => setStep('new_password'),
      },
    )
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    setPasswordError('')
    resetPassword.mutate({ email, code: otp, newPassword: password })
  }

  function handleResendOtp() {
    sendOtp.mutate(
      { email, type: 'reset_password' },
      {
        onSuccess: () => setCountdown(60),
      },
    )
  }

  const steps: { key: ForgotStep; label: string }[] = [
    { key: 'email', label: 'Email' },
    { key: 'otp', label: 'Verify' },
    { key: 'new_password', label: 'Reset' },
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
            <CardTitle className="text-2xl font-semibold text-[var(--text-h)]">Reset your password</CardTitle>
            <CardDescription>
              {step === 'email' && 'Enter your registered email address'}
              {step === 'otp' && 'Enter the 6-digit code sent to your email'}
              {step === 'new_password' && 'Enter your new password'}
            </CardDescription>
          </CardHeader>

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
                  Remember your password?{' '}
                  <Link to="/login" className="font-medium text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </form>
          )}

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
                  disabled={countdown > 0 || sendOtp.isPending}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Didn't receive the code? Resend"}
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

          {step === 'new_password' && (
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
                  Email <strong>{email}</strong> verified successfully!
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                </div>
                {(passwordError || resetPassword.isError) && (
                  <p className="text-sm text-red-600" role="alert">
                    {passwordError || ((resetPassword.error as { message?: string })?.message ?? 'Failed to reset password')}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
                  {resetPassword.isPending ? 'Resetting…' : 'Reset password'}
                </Button>
                <button
                  type="button"
                  onClick={() => { setStep('otp'); setPassword(''); setConfirmPassword('') }}
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

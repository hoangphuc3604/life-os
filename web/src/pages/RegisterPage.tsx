import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useRegisterMutation } from '@/hooks/useAuthQuery'

export function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const register = useRegisterMutation()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    register.mutate({ username, email, password })
  }

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
          <CardDescription>Enter your details to get started</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
              <Label htmlFor="email">Email</Label>
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
            {register.isError && (
              <p className="text-sm text-red-600" role="alert">
                {(register.error as { message?: string })?.message ?? 'Registration failed'}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={register.isPending}>
              {register.isPending ? 'Creating account…' : 'Sign up'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      </div>
    </div>
  )
}

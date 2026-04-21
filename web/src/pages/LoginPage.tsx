import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useLoginMutation } from '@/hooks/useAuthQuery'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const login = useLoginMutation()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    login.mutate({ username, password })
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
          <CardTitle className="text-2xl font-semibold text-[var(--text-h)]">Welcome back</CardTitle>
          <CardDescription>Sign in with your username and password</CardDescription>
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
                autoComplete="current-password"
                required
                minLength={6}
              />
            </div>
            {login.isError && (
              <p className="text-sm text-red-600" role="alert">
                {(login.error as { message?: string })?.message ?? 'Login failed'}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'Signing in…' : 'Sign in'}
            </Button>
            <div className="flex items-center justify-between w-full text-sm">
              <Link to="/forgot-password" className="font-medium text-primary hover:underline">
                Forgot password?
              </Link>
              <span className="text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </span>
            </div>
          </CardFooter>
        </form>
      </Card>
      </div>
    </div>
  )
}

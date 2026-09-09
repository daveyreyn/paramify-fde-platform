import { redirect } from 'next/navigation';
import { Lock } from 'lucide-react';

import { GlassLogo } from '@/components/glass-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { safeNextPath, sessionUser } from '@/lib/auth';

import { login } from './actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const target = safeNextPath(next);
  if (await sessionUser()) redirect(target ?? '/deliverables');

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <GlassLogo className="size-36" />
          <h1 className="mt-2 font-mono text-xl font-semibold tracking-tight text-foreground">
            paramify
          </h1>
          <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            FDE Platform
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 rounded-xl border border-border/70 bg-card/60 p-6 shadow-sm backdrop-blur-sm">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary dark:text-white">
            // sign in
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Use your Paramify credentials to access your engagements.
          </p>

          {error && (
            <p className="mt-3 rounded-md border border-status-error/30 bg-status-error/10 px-3 py-2 text-sm text-status-error">
              Email or password was not recognized.
            </p>
          )}

          <form action={login} className="mt-6 grid gap-4">
            {target && <input type="hidden" name="next" value={target} />}
            <div className="grid gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@paramify.com"
                className="bg-background/40 font-mono text-sm"
                required
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="bg-background/40 font-mono text-sm"
                required
              />
            </div>

            <Button type="submit" size="lg" className="mt-1 w-full gap-2 font-medium">
              <Lock className="size-4" /> Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center font-mono text-[11px] text-muted-foreground">
          v1.0.0 · prod · FedRAMP moderate
        </p>
      </div>
    </div>
  );
}

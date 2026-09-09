'use client';

import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Palette, User } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof User;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/40 p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-medium text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState('');
  const [title, setTitle] = useState('Forward Deployed Engineer');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary dark:text-white">
          // settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Manage your profile, preferences, and API access for the FDE platform.
        </p>
      </div>

      <div className="mt-8 grid max-w-2xl gap-4">
        <Section icon={User} title="Profile" description="How you appear across engagements.">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} className="text-sm" />
          </Field>
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-sm" />
          </Field>
          <div>
            <Button size="sm">Save changes</Button>
          </div>
        </Section>

        <Section icon={Palette} title="Appearance" description="Theme and display preferences.">
          <Field label="Theme">
            <div className="flex w-fit items-center gap-1 rounded-lg border border-border/70 bg-card/40 p-1">
              {(['light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => theme !== t && toggleTheme()}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors',
                    theme === t
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        <Section icon={KeyRound} title="API" description="Connect your API key to the platform.">
          <Field label="API key">
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="pfy_live_…"
                className="bg-background/40 pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
          <div>
            <Button size="sm" disabled={!apiKey.trim()}>
              Save key
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
}

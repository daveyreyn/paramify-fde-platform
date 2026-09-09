import { redirect } from 'next/navigation';

import { loopbackUrl, sessionUser } from '@/lib/auth';

import { approve } from './actions';

export default async function CliAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; state?: string }>;
}) {
  const params = await searchParams;
  const user = await sessionUser();
  if (!user) {
    const next = new URLSearchParams({
      redirect: params.redirect ?? '',
      state: params.state ?? '',
    });
    redirect(`/login?next=${encodeURIComponent(`/cli-auth?${next}`)}`);
  }

  const target = loopbackUrl(params.redirect);
  if (!target || !params.state) {
    return (
      <main>
        <h1>CLI login</h1>
        <p>Invalid or missing callback parameters. Run `fde login` again.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>CLI login</h1>
      <p>
        The FDE CLI on this machine wants to log in as <strong>{user.email}</strong>.
      </p>
      <form action={approve}>
        <input type="hidden" name="redirect" value={target.href} />
        <input type="hidden" name="state" value={params.state} />
        <button type="submit">Approve</button>
      </form>
      <p>Not you? Close this tab and the CLI request will time out.</p>
    </main>
  );
}

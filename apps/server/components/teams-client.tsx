'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Building2, Pencil, Plus, Trash2, X } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { displayName, initials } from '@/lib/deliverable-ui';

type Member = {
  id: string;
  email: string;
  name: string | null;
  isSuper: boolean;
};

type TeamRow = {
  id: string;
  name: string;
  users: Member[];
};

type Modal =
  | { type: 'add' }
  | { type: 'edit'; team: TeamRow }
  | { type: 'delete'; team: TeamRow }
  | null;

export function TeamsClient({
  initialTeams,
  allUsers,
}: {
  initialTeams: TeamRow[];
  allUsers: Member[];
}) {
  const router = useRouter();
  const [modal, setModal] = useState<Modal>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberOpLoading, setMemberOpLoading] = useState<string | null>(null);

  const [addName, setAddName] = useState('');
  const [editMembers, setEditMembers] = useState<Member[]>([]);
  const [memberSearch, setMemberSearch] = useState('');

  function openAdd() {
    setAddName('');
    setError(null);
    setModal({ type: 'add' });
  }

  function openEdit(team: TeamRow) {
    setEditMembers([...team.users]);
    setMemberSearch('');
    setError(null);
    setModal({ type: 'edit', team });
  }

  function openDelete(team: TeamRow) {
    setError(null);
    setModal({ type: 'delete', team });
  }

  function closeModal() {
    setModal(null);
    setError(null);
  }

  async function handleAdd() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create team');
        return;
      }
      closeModal();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(user: Member) {
    if (modal?.type !== 'edit') return;
    setMemberOpLoading(user.id);
    try {
      const res = await fetch(`/api/v1/teams/${encodeURIComponent(modal.team.name)}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      if (res.ok) {
        setEditMembers((prev) => [...prev, user]);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? 'Failed to add member');
      }
    } finally {
      setMemberOpLoading(null);
    }
  }

  async function handleRemoveMember(user: Member) {
    if (modal?.type !== 'edit') return;
    setMemberOpLoading(user.id);
    try {
      const res = await fetch(`/api/v1/teams/${encodeURIComponent(modal.team.name)}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      if (res.ok) {
        setEditMembers((prev) => prev.filter((m) => m.id !== user.id));
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? 'Failed to remove member');
      }
    } finally {
      setMemberOpLoading(null);
    }
  }

  async function handleDelete() {
    if (modal?.type !== 'delete') return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/teams/${encodeURIComponent(modal.team.name)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to delete team');
        return;
      }
      closeModal();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const membersInTeam = new Set(editMembers.map((m) => m.id));
  const addableUsers = allUsers.filter(
    (u) =>
      !membersInTeam.has(u.id) &&
      (!memberSearch ||
        displayName(u).toLowerCase().includes(memberSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(memberSearch.toLowerCase())),
  );

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary dark:text-white">
            // workspaces
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Teams</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Workspaces group the users who can access a set of deliverables.
          </p>
        </div>
        <Button size="sm" className="mt-1" onClick={openAdd}>
          <Plus className="mr-2 size-4" />
          Add Team
        </Button>
      </div>

      {initialTeams.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {initialTeams.map((team) => (
            <div key={team.id} className="group relative rounded-xl">
              <a href={`/teams/${team.id}`} className="block focus-visible:outline-none">
                <Card className="flex h-full flex-col gap-0 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                      <Building2 className="size-4" />
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                  <h2 className="mt-3 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                    {team.name}
                  </h2>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {team.users.slice(0, 4).map((member) => (
                        <Avatar key={member.id} className="size-6 ring-2 ring-card">
                          <AvatarFallback className="bg-secondary text-[10px] font-medium text-secondary-foreground">
                            {initials(member)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {team.users.length} members
                    </span>
                  </div>
                </Card>
              </a>
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => openEdit(team)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => openDelete(team)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">No teams yet.</p>
      )}

      {/* Add Team */}
      <Dialog open={modal?.type === 'add'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Team name
              </label>
              <Input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="engineering"
                onKeyDown={(e) => e.key === 'Enter' && addName && handleAdd()}
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!addName || loading}>
              {loading ? 'Creating…' : 'Create Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Members */}
      <Dialog open={modal?.type === 'edit'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modal?.type === 'edit' ? modal.team.name : 'Edit Team'}</DialogTitle>
            <DialogDescription>Add or remove members from this team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Current members</p>
              {editMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No members yet.</p>
              ) : (
                <div className="space-y-0.5">
                  {editMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-2 rounded-md px-2 py-1.5">
                      <Avatar className="size-6">
                        <AvatarFallback className="bg-secondary text-[10px] font-medium text-secondary-foreground">
                          {initials(member)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium">{displayName(member)}</div>
                        <div className="truncate font-mono text-[10px] text-muted-foreground">
                          {member.email}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member)}
                        disabled={memberOpLoading === member.id}
                        className="rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Add members</p>
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search users…"
                className="mb-2"
              />
              <div className="max-h-40 space-y-0.5 overflow-y-auto">
                {addableUsers.length === 0 ? (
                  <p className="px-2 text-xs text-muted-foreground">No more users to add.</p>
                ) : (
                  addableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleAddMember(user)}
                      disabled={memberOpLoading === user.id}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent disabled:opacity-40"
                    >
                      <Avatar className="size-6">
                        <AvatarFallback className="bg-secondary text-[10px] font-medium text-secondary-foreground">
                          {initials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium">{displayName(user)}</div>
                        <div className="truncate font-mono text-[10px] text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                      <Plus className="size-3 shrink-0 text-muted-foreground" />
                    </button>
                  ))
                )}
              </div>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button onClick={closeModal}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team */}
      <Dialog open={modal?.type === 'delete'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              {modal?.type === 'delete' && (
                <>
                  Are you sure you want to delete{' '}
                  <strong className="text-foreground">{modal.team.name}</strong>? Members won&apos;t
                  be deleted but will lose access to this team&apos;s deliverables.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting…' : 'Delete Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

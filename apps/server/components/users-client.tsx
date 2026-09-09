'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Trash2, UserPlus } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { displayName, initials } from '@/lib/deliverable-ui';
import { cn } from '@/lib/utils';

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  isSuper: boolean;
};

type Modal =
  | { type: 'add' }
  | { type: 'edit'; user: UserRow }
  | { type: 'delete'; user: UserRow }
  | { type: 'delete-orphaned' }
  | null;

export function UsersClient({ initialUsers }: { initialUsers: UserRow[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<Modal>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  const [addEmail, setAddEmail] = useState('');
  const [addName, setAddName] = useState('');
  const [addIsSuper, setAddIsSuper] = useState(false);

  const [editName, setEditName] = useState('');
  const [editIsSuper, setEditIsSuper] = useState(false);

  function openAdd() {
    setAddEmail('');
    setAddName('');
    setAddIsSuper(false);
    setNewPassword(null);
    setError(null);
    setModal({ type: 'add' });
  }

  function openEdit(user: UserRow) {
    setEditName(user.name ?? '');
    setEditIsSuper(user.isSuper);
    setError(null);
    setModal({ type: 'edit', user });
  }

  function openDelete(user: UserRow) {
    setError(null);
    setModal({ type: 'delete', user });
  }

  function closeModal() {
    setModal(null);
    setError(null);
    setNewPassword(null);
  }

  async function handleAdd() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addEmail, name: addName || undefined, isSuper: addIsSuper }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create user');
        return;
      }
      setNewPassword(data.initialPassword);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit() {
    if (modal?.type !== 'edit') return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/users/${encodeURIComponent(modal.user.email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName || null, isSuper: editIsSuper }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to update user');
        return;
      }
      closeModal();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (modal?.type !== 'delete') return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/users/${encodeURIComponent(modal.user.email)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to delete user');
        return;
      }
      closeModal();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteOrphaned() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/users/orphaned', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to delete orphaned users');
        return;
      }
      closeModal();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary dark:text-white">
            // directory
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Users</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Everyone with access to the platform. Open a user to see what they own.
          </p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  setError(null);
                  setModal({ type: 'delete-orphaned' });
                }}
              >
                Delete Orphaned Users
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={openAdd}>
            <UserPlus className="mr-2 size-4" />
            Add User
          </Button>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-border/70">
        {initialUsers.map((user, i) => (
          <div
            key={user.id}
            className={cn(
              'flex items-center gap-3 bg-card/40 px-4 py-3',
              i !== 0 && 'border-t border-border/60',
            )}
          >
            <a
              href={`/users/${user.id}`}
              className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-80"
            >
              <Avatar className="size-9">
                <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                  {initials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {displayName(user)}
                </div>
                <div className="truncate font-mono text-xs text-muted-foreground">{user.email}</div>
              </div>
              {user.isSuper && (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  super
                </span>
              )}
            </a>
            <button
              onClick={() => openEdit(user)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              onClick={() => openDelete(user)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add User */}
      <Dialog open={modal?.type === 'add'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          {newPassword ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                User created. Share this one-time password — it won&apos;t be shown again.
              </p>
              <div className="rounded-md bg-secondary px-3 py-2 font-mono text-sm">
                {newPassword}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Name (optional)
                </label>
                <Input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={addIsSuper}
                  onChange={(e) => setAddIsSuper(e.target.checked)}
                  className="size-4 rounded"
                />
                Super user (admin)
              </label>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )}
          <DialogFooter>
            {newPassword ? (
              <Button onClick={closeModal}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={!addEmail || loading}>
                  {loading ? 'Creating…' : 'Create User'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User */}
      <Dialog open={modal?.type === 'edit'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            {modal?.type === 'edit' && <DialogDescription>{modal.user.email}</DialogDescription>}
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editIsSuper}
                onChange={(e) => setEditIsSuper(e.target.checked)}
                className="size-4 rounded"
              />
              Super user (admin)
            </label>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User */}
      <Dialog open={modal?.type === 'delete'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              {modal?.type === 'delete' && (
                <>
                  Are you sure you want to delete{' '}
                  <strong className="text-foreground">{displayName(modal.user)}</strong>? This
                  cannot be undone.
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
              {loading ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Orphaned Users */}
      <Dialog
        open={modal?.type === 'delete-orphaned'}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Orphaned Users</DialogTitle>
            <DialogDescription>
              Permanently delete all users not assigned to any team who have no owned deliverables.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrphaned} disabled={loading}>
              {loading ? 'Deleting…' : 'Delete Orphaned Users'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

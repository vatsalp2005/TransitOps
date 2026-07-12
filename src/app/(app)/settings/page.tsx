"use client";
import { useState } from "react";
import { Shield, Users2, Plus, LockOpen, Lock, Info } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Field";
import { Table, THead, TBody, Th, Td, TRow } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { TableSkeleton, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useApi, apiFetch, ApiError } from "@/lib/client/api";
import { usePermissions } from "@/components/layout/PermissionsProvider";
import { MODULES, ROLE_LABELS, ROLE_KEYS, type AccessLevel, type ModuleKey } from "@/lib/auth/rbac";
import { formatDate } from "@/lib/format";
import type { RoleRow, UserRow } from "@/lib/types";

const MODULE_LABEL: Record<ModuleKey, string> = {
  dashboard: "Dash",
  vehicles: "Vehicles",
  drivers: "Drivers",
  trips: "Trips",
  maintenance: "Maint.",
  fuel: "Fuel",
  reports: "Reports",
  settings: "Settings",
};

const CELL: Record<AccessLevel, { label: string; cls: string }> = {
  none: { label: "—", cls: "text-faint bg-panel-2 border-line" },
  view: { label: "View", cls: "text-ontrip bg-ontrip/10 border-ontrip/30" },
  edit: { label: "Edit", cls: "text-available bg-available/10 border-available/30" },
};

const ROLE_OPTIONS = ROLE_KEYS.map((k) => ({ value: k, label: ROLE_LABELS[k] }));

export default function SettingsPage() {
  const { can } = usePermissions();
  const { toast } = useToast();
  const canEdit = can("settings", "edit");

  const roles = useApi<RoleRow[]>("/api/settings/roles");
  const users = useApi<UserRow[]>("/api/settings/users");
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const patchUser = async (u: UserRow, body: Record<string, unknown>, msg: string) => {
    setBusy(u.id);
    try {
      await apiFetch(`/api/settings/users/${u.id}`, { method: "PATCH", body });
      toast(msg);
      users.refresh();
      roles.refresh();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Update failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const isLocked = (u: UserRow) => !!u.lockedUntil && new Date(u.lockedUntil) > new Date();

  return (
    <div>
      <PageHeader title="Settings & RBAC" subtitle="Manage who has access, and which role they hold.">
        {canEdit && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-4" /> Add User
          </Button>
        )}
      </PageHeader>

      <div className="space-y-4">
        {/* ---- Users (the dynamic half of RBAC) ---- */}
        <Card>
          <CardHeader
            title="Users"
            subtitle="Reassign a role at any time — access updates immediately"
            icon={<Users2 className="size-3.5" />}
          />
          {users.error && !users.data ? (
            <ErrorState message={users.error} onRetry={users.refresh} />
          ) : users.loading && !users.data ? (
            <TableSkeleton rows={4} cols={5} />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Last Login</Th>
                  <Th>Status</Th>
                  {canEdit && <Th className="text-right">Actions</Th>}
                </tr>
              </THead>
              <TBody>
                {(users.data ?? []).map((u) => (
                  <TRow key={u.id}>
                    <Td className="font-medium text-fg">{u.name}</Td>
                    <Td className="text-muted">{u.email}</Td>
                    <Td>
                      {canEdit ? (
                        <Select
                          value={u.role.key}
                          disabled={busy === u.id}
                          onChange={(e) =>
                            patchUser(
                              u,
                              { role: e.target.value },
                              `${u.name} is now ${ROLE_LABELS[e.target.value as keyof typeof ROLE_LABELS]}`,
                            )
                          }
                          options={ROLE_OPTIONS}
                          className="h-8 w-44 py-1 text-xs"
                        />
                      ) : (
                        <span className="text-muted">{u.role.name}</span>
                      )}
                    </Td>
                    <Td className="numeric text-xs text-muted">
                      {u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"}
                    </Td>
                    <Td>
                      {isLocked(u) ? (
                        <StatusBadge tone="danger" label="Locked" />
                      ) : u.isActive ? (
                        <StatusBadge tone="available" label="Active" />
                      ) : (
                        <StatusBadge tone="retired" label="Inactive" />
                      )}
                    </Td>
                    {canEdit && (
                      <Td className="text-right">
                        <div className="flex justify-end gap-1.5">
                          {isLocked(u) && (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={busy === u.id}
                              onClick={() => patchUser(u, { unlock: true }, `${u.name} unlocked`)}
                            >
                              <LockOpen className="size-3.5" /> Unlock
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={u.isActive ? "ghost" : "secondary"}
                            loading={busy === u.id}
                            onClick={() =>
                              patchUser(
                                u,
                                { isActive: !u.isActive },
                                `${u.name} ${u.isActive ? "deactivated" : "activated"}`,
                              )
                            }
                          >
                            {u.isActive ? <Lock className="size-3.5" /> : null}
                            {u.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </Td>
                    )}
                  </TRow>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        {/* ---- Permission matrix (read-only by design) ---- */}
        <Card>
          <CardHeader
            title="Role Permissions"
            subtitle="Reference only — fixed in the backend"
            icon={<Shield className="size-3.5" />}
          />

          <div className="flex items-start gap-2 border-b border-line bg-panel-2/60 px-4 py-2.5">
            <Info className="mt-0.5 size-3.5 shrink-0 text-ontrip" />
            <p className="text-xs leading-relaxed text-muted">
              Permissions are tied to job function and are <span className="text-fg">hardcoded and
              enforced server-side on every request</span> — they cannot be edited at runtime. That
              prevents privilege escalation (e.g. a Safety Officer granting themselves dispatch
              rights). To change what someone can do, <span className="text-fg">change their role</span> above.
            </p>
          </div>

          {roles.loading && !roles.data ? (
            <TableSkeleton rows={4} cols={8} />
          ) : (
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[720px] border-separate border-spacing-[3px]">
                <thead>
                  <tr>
                    <th className="label-tech px-2 py-1.5 text-left">Role</th>
                    {MODULES.map((m) => (
                      <th key={m} className="label-tech px-1 py-1.5 text-center">
                        {MODULE_LABEL[m]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(roles.data ?? []).map((role) => (
                    <tr key={role.key}>
                      <td className="px-2 py-1">
                        <p className="text-sm font-medium text-fg">{role.name}</p>
                        <p className="label-tech mt-0.5">{role.userCount} user(s)</p>
                      </td>
                      {MODULES.map((m) => {
                        const meta = CELL[role.permissions[m] ?? "none"];
                        return (
                          <td key={m} className="px-0.5 py-1 text-center">
                            <span
                              className={`block rounded-[3px] border px-1 py-1.5 text-[11px] font-medium ${meta.cls}`}
                            >
                              {meta.label}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {canEdit && (
        <AddUserModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => { users.refresh(); roles.refresh(); }} />
      )}
    </div>
  );
}

function AddUserModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "DRIVER" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await apiFetch("/api/settings/users", { method: "POST", body: form });
      toast(`${form.name} added`);
      setForm({ name: "", email: "", password: "", role: "DRIVER" });
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])));
      }
      toast(err instanceof ApiError ? err.message : "Could not add user", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add User" description="Create an account and assign its role.">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Full name" error={errors.name}>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
        </Field>
        <Field label="Temporary password" error={errors.password} hint="Min 8 characters, with a letter and a number.">
          <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
        </Field>
        <Field label="Role" error={errors.role}>
          <Select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} options={ROLE_OPTIONS} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Add user</Button>
        </div>
      </form>
    </Modal>
  );
}

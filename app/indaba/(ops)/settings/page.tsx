import Avatar from "@/components/ops/ui/Avatar";
import Button from "@/components/ops/ui/Button";
import PageHeader from "@/components/ops/PageHeader";
import { requireModuleAccess } from "@/lib/ops/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireModuleAccess("/indaba/settings");

  const fields: Array<[string, string]> = [
    ["Name", user.name],
    ["Email", user.email],
    ["Role", user.role],
    ["Password", "••••••••••••"],
  ];

  return (
    <div>
      <PageHeader
        eyebrow="indaba · profile"
        title="settings"
        caption={`${user.name.toLowerCase()} · ${user.role}`}
      />

      <div className="px-4 py-5 md:px-6">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} size="xl" />
          <div>
            <div className="text-[18px] font-medium text-white">{user.name}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-eyebrow text-fg-mute">
              {user.role} · {user.email}
            </div>
          </div>
        </div>

        <div className="mt-6 max-w-md">
          {fields.map(([k, v]) => (
            <div key={k} className="border-t border-line-10 py-3.5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-fg-dim">
                {k}
              </div>
              <div className="mt-1 text-[14px] text-white">{v}</div>
            </div>
          ))}
        </div>

        <form action="/auth/signout" method="post" className="mt-8 max-w-md">
          <Button type="submit" variant="danger" fullWidth>
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}

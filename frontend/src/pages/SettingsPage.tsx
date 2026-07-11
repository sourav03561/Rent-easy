import { Bell, Check, LogOut, Mail, Shield, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SETTINGS_KEY = "renteasy_settings";

type SettingsState = {
  bookingAlerts: boolean;
  ownerUpdates: boolean;
  emailSummary: boolean;
};

const defaultSettings: SettingsState = {
  bookingAlerts: true,
  ownerUpdates: true,
  emailSummary: false
};

function ToggleRow({
  title,
  body,
  checked,
  onChange
}: {
  title: string;
  body: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <span>
        <span className="block text-sm font-extrabold text-ink">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{body}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 shrink-0 accent-teal-700"
      />
    </label>
  );
}

export function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsState>(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...defaultSettings, ...(JSON.parse(stored) as Partial<SettingsState>) } : defaultSettings;
  });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof SettingsState, value: boolean) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setNotice("Settings saved.");
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {notice && (
        <p className="rounded-lg border border-leaf/20 bg-mint px-3 py-2 text-sm font-medium text-leaf">
          {notice}
        </p>
      )}

      <section className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="surface h-fit p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-mint text-lg font-extrabold text-leaf">
              {(user?.name ?? "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="display-font truncate text-lg font-extrabold text-ink">{user?.name}</h2>
              <p className="truncate text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-3">
              <UserRound className="h-4 w-4 text-leaf" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Account type</p>
                <p className="text-sm font-extrabold capitalize text-ink">{user?.role.toLowerCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-3">
              <Shield className="h-4 w-4 text-leaf" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Session</p>
                <p className="text-sm font-extrabold text-ink">Signed in</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <section className="surface p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-mint text-leaf">
                <Bell className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="display-font text-xl font-extrabold text-ink">Notification Settings</h2>
                <p className="mt-1 text-sm text-slate-500">Choose which updates should appear in your dashboard.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <ToggleRow
                title="Booking alerts"
                body="Show updates when booking requests are created, approved, rejected, cancelled, or completed."
                checked={settings.bookingAlerts}
                onChange={(value) => updateSetting("bookingAlerts", value)}
              />
              <ToggleRow
                title="Owner updates"
                body="Show listing and vacancy related reminders for owner accounts."
                checked={settings.ownerUpdates}
                onChange={(value) => updateSetting("ownerUpdates", value)}
              />
              <ToggleRow
                title="Email summary"
                body="Keep this ready for future email reminders and weekly account summaries."
                checked={settings.emailSummary}
                onChange={(value) => updateSetting("emailSummary", value)}
              />
            </div>
          </section>

          <section className="surface p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-600">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="display-font text-lg font-extrabold text-ink">Account Access</h2>
                  <p className="mt-1 text-sm text-slate-500">Use the profile page to edit personal details, or sign out from this device.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => navigate("/dashboard")} className="secondary-button">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Edit Profile
                </button>
                <button type="button" onClick={handleLogout} className="secondary-button text-rose-600 hover:border-rose-200 hover:text-rose-700">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Log out
                </button>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

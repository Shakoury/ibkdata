export function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="bg-admin-card rounded-card p-5">
        <h3 className="font-semibold mb-4">System Settings</h3>
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-admin-muted">Take the app offline temporarily</p>
            </div>
            <button className="bg-error/20 text-error rounded-btn px-3 py-1.5">Enable</button>
          </div>
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <p className="font-medium">Force 2FA</p>
              <p className="text-admin-muted">Require two-factor for all admins</p>
            </div>
            <button className="bg-accent text-white rounded-btn px-3 py-1.5">Enable</button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Session Timeout</p>
              <p className="text-admin-muted">Auto-logout after inactivity</p>
            </div>
            <span className="text-admin-muted">30 minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
}

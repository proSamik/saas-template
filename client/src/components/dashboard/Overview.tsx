export default function Overview() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">
        Overview
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Usage Card */}
        <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-light-muted dark:text-dark-muted">
            Total Usage
          </h3>
          <p className="mt-2 text-3xl font-semibold text-light-foreground dark:text-dark-foreground">
            0
          </p>
          <p className="mt-2 text-sm text-light-muted dark:text-dark-muted">
            Last 30 days
          </p>
        </div>

        {/* Active Projects Card */}
        <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-light-muted dark:text-dark-muted">
            Active Projects
          </h3>
          <p className="mt-2 text-3xl font-semibold text-light-foreground dark:text-dark-foreground">
            0
          </p>
          <p className="mt-2 text-sm text-light-muted dark:text-dark-muted">
            From all workspaces
          </p>
        </div>

        {/* Team Members Card */}
        <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-light-muted dark:text-dark-muted">
            Team Members
          </h3>
          <p className="mt-2 text-3xl font-semibold text-light-foreground dark:text-dark-foreground">
            1
          </p>
          <p className="mt-2 text-sm text-light-muted dark:text-dark-muted">
            Active members
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
        <h2 className="text-lg font-medium text-light-foreground dark:text-dark-foreground mb-4">
          Recent Activity
        </h2>
        <div className="text-light-muted dark:text-dark-muted">
          No recent activity
        </div>
      </div>
    </div>
  );
} 
export default function Analytics() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">
        Analytics
      </h1>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Conversion Rate */}
        <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-light-muted dark:text-dark-muted">
            Conversion Rate
          </h3>
          <p className="mt-2 text-3xl font-semibold text-light-foreground dark:text-dark-foreground">
            0%
          </p>
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">
            +0% from last month
          </p>
        </div>

        {/* Average Session Duration */}
        <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-light-muted dark:text-dark-muted">
            Avg. Session Duration
          </h3>
          <p className="mt-2 text-3xl font-semibold text-light-foreground dark:text-dark-foreground">
            0m
          </p>
          <p className="mt-2 text-sm text-light-muted dark:text-dark-muted">
            Per user
          </p>
        </div>

        {/* Bounce Rate */}
        <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-light-muted dark:text-dark-muted">
            Bounce Rate
          </h3>
          <p className="mt-2 text-3xl font-semibold text-light-foreground dark:text-dark-foreground">
            0%
          </p>
          <p className="mt-2 text-sm text-light-muted dark:text-dark-muted">
            Last 7 days
          </p>
        </div>

        {/* Page Views */}
        <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-light-muted dark:text-dark-muted">
            Page Views
          </h3>
          <p className="mt-2 text-3xl font-semibold text-light-foreground dark:text-dark-foreground">
            0
          </p>
          <p className="mt-2 text-sm text-light-muted dark:text-dark-muted">
            Total views
          </p>
        </div>
      </div>

      {/* Traffic Sources */}
      <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
        <h2 className="text-lg font-medium text-light-foreground dark:text-dark-foreground mb-4">
          Traffic Sources
        </h2>
        <div className="text-light-muted dark:text-dark-muted">
          No data available
        </div>
      </div>

      {/* User Behavior */}
      <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
        <h2 className="text-lg font-medium text-light-foreground dark:text-dark-foreground mb-4">
          User Behavior
        </h2>
        <div className="text-light-muted dark:text-dark-muted">
          No behavior data available
        </div>
      </div>
    </div>
  );
} 
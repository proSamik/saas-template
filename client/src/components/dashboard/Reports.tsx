export default function Reports() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">
        Reports
      </h1>

      {/* Report Types */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Performance Report */}
        <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-light-muted dark:text-dark-muted">
            Performance Report
          </h3>
          <p className="mt-2 text-sm text-light-foreground dark:text-dark-foreground">
            Detailed analysis of system performance metrics
          </p>
          <button className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-light-accent dark:bg-dark-accent hover:bg-opacity-75">
            Generate Report
          </button>
        </div>

        {/* Usage Report */}
        <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-light-muted dark:text-dark-muted">
            Usage Report
          </h3>
          <p className="mt-2 text-sm text-light-foreground dark:text-dark-foreground">
            Resource utilization and user activity metrics
          </p>
          <button className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-light-accent dark:bg-dark-accent hover:bg-opacity-75">
            Generate Report
          </button>
        </div>

        {/* Custom Report */}
        <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-light-muted dark:text-dark-muted">
            Custom Report
          </h3>
          <p className="mt-2 text-sm text-light-foreground dark:text-dark-foreground">
            Create a custom report with selected metrics
          </p>
          <button className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-light-accent dark:bg-dark-accent hover:bg-opacity-75">
            Create Custom
          </button>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
        <h2 className="text-lg font-medium text-light-foreground dark:text-dark-foreground mb-4">
          Recent Reports
        </h2>
        <div className="text-light-muted dark:text-dark-muted">
          No recent reports generated
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
        <h2 className="text-lg font-medium text-light-foreground dark:text-dark-foreground mb-4">
          Scheduled Reports
        </h2>
        <div className="text-light-muted dark:text-dark-muted">
          No scheduled reports
        </div>
        <button className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-light-accent dark:bg-dark-accent hover:bg-opacity-75">
          Schedule New Report
        </button>
      </div>
    </div>
  );
} 
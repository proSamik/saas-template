import { useState } from 'react';

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">
        Settings
      </h1>

      {/* Notifications Settings */}
      <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
        <h2 className="text-lg font-medium text-light-foreground dark:text-dark-foreground mb-4">
          Notifications
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-light-foreground dark:text-dark-foreground">
                Push Notifications
              </label>
              <p className="text-sm text-light-muted dark:text-dark-muted">
                Receive notifications about important updates
              </p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                ${notifications ? 'bg-light-accent dark:bg-dark-accent' : 'bg-gray-200 dark:bg-gray-700'}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${notifications ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-light-foreground dark:text-dark-foreground">
                Email Updates
              </label>
              <p className="text-sm text-light-muted dark:text-dark-muted">
                Receive email notifications about account activity
              </p>
            </div>
            <button
              onClick={() => setEmailUpdates(!emailUpdates)}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                ${emailUpdates ? 'bg-light-accent dark:bg-dark-accent' : 'bg-gray-200 dark:bg-gray-700'}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${emailUpdates ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
        <h2 className="text-lg font-medium text-light-foreground dark:text-dark-foreground mb-4">
          Appearance
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-light-foreground dark:text-dark-foreground">
              Theme
            </label>
            <select className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-light-accent focus:outline-none focus:ring-light-accent sm:text-sm dark:bg-dark-card dark:border-gray-600 dark:text-dark-foreground">
              <option>System Default</option>
              <option>Light</option>
              <option>Dark</option>
            </select>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
        <h2 className="text-lg font-medium text-light-foreground dark:text-dark-foreground mb-4">
          Account
        </h2>
        <div className="space-y-4">
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
} 
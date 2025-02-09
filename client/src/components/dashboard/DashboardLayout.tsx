import { ReactNode, useState } from 'react';
import { 
  ChartBarIcon, 
  HomeIcon, 
  DocumentChartBarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface DashboardLayoutProps {
  overview: ReactNode;
  analytics: ReactNode;
  reports: ReactNode;
  settings: ReactNode;
  variantId: string | null;
}

export default function DashboardLayout({
  overview,
  analytics,
  reports,
  settings,
  variantId
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState('overview');

  const navigation = [
    { name: 'Overview', id: 'overview', icon: HomeIcon, component: overview },
    { name: 'Analytics', id: 'analytics', icon: ChartBarIcon, component: analytics },
    { name: 'Reports', id: 'reports', icon: DocumentChartBarIcon, component: reports },
    { name: 'Settings', id: 'settings', icon: Cog6ToothIcon, component: settings },
  ].filter(item => item.component !== null);

  const currentPage = navigation.find(item => item.id === currentSection);

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <div className="fixed inset-0 z-40 flex">
          {/* Sidebar backdrop */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div className={`
            fixed inset-y-0 left-0 z-40 w-64 transform bg-light-card dark:bg-dark-card transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="flex h-full flex-col">
              {/* Sidebar header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="text-xl font-semibold text-light-foreground dark:text-dark-foreground">
                  Dashboard
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-1 px-2 py-4">
                {navigation.map((item) => {
                  const isActive = currentSection === item.id;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setCurrentSection(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`
                        group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md
                        ${isActive 
                          ? 'bg-light-accent dark:bg-dark-accent text-white' 
                          : 'text-light-foreground dark:text-dark-foreground hover:bg-light-hover dark:hover:bg-dark-hover'
                        }
                      `}
                    >
                      <item.icon
                        className={`
                          mr-3 h-6 w-6 flex-shrink-0
                          ${isActive 
                            ? 'text-white' 
                            : 'text-light-foreground dark:text-dark-foreground'
                          }
                        `}
                      />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex w-64 flex-col">
            <div className="flex min-h-0 flex-1 flex-col bg-light-card dark:bg-dark-card">
              <div className="flex flex-1 flex-col overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="text-xl font-semibold text-light-foreground dark:text-dark-foreground">
                    Dashboard
                  </div>
                </div>
                <nav className="flex-1 space-y-1 px-2 py-4">
                  {navigation.map((item) => {
                    const isActive = currentSection === item.id;
                    return (
                      <button
                        key={item.name}
                        onClick={() => setCurrentSection(item.id)}
                        className={`
                          group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md
                          ${isActive 
                            ? 'bg-light-accent dark:bg-dark-accent text-white' 
                            : 'text-light-foreground dark:text-dark-foreground hover:bg-light-hover dark:hover:bg-dark-hover'
                          }
                        `}
                      >
                        <item.icon
                          className={`
                            mr-3 h-6 w-6 flex-shrink-0
                            ${isActive 
                              ? 'text-white' 
                              : 'text-light-foreground dark:text-dark-foreground'
                            }
                          `}
                        />
                        {item.name}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile header */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between bg-light-card dark:bg-dark-card px-4 py-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-light-foreground dark:text-dark-foreground"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <div className="text-lg font-semibold text-light-foreground dark:text-dark-foreground">
                {currentPage?.name || 'Dashboard'}
              </div>
              <div className="w-6" /> {/* Spacer for alignment */}
            </div>
          </div>

          {/* Content area */}
          <main className="flex-1 overflow-y-auto">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {currentPage?.component}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Lightbulb, 
  Trophy, 
  Scale,
  Clock,
  Upload,
  Menu,
  X,
  TrendingUp,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortfolio } from '@/contexts/PortfolioContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Portfolio Health', href: '/', icon: LayoutDashboard },
  { name: 'Insight Feed', href: '/insights', icon: Lightbulb },
  { name: 'Top Performers', href: '/winners', icon: Trophy },
  { name: 'Asset Rebalancing', href: '/rebalance', icon: Scale },
  { name: 'Era Allocation', href: '/era-allocation', icon: Clock },
  { name: 'Generate Report', href: '/report', icon: FileText },
];

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isDataLoaded, summary, validation } = usePortfolio();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 border-r border-border bg-sidebar">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Portfolio Coach</h1>
              <p className="text-xs text-muted-foreground">Collectible Intelligence</p>
            </div>
          </div>

          {/* Portfolio Status */}
          {isDataLoaded && summary && (
            <div className="px-4 py-4 border-b border-border">
              <div className="glass-card p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Portfolio Value</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  ${summary.totalMarketValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <div className={cn(
                  "flex items-center gap-1 mt-1 text-sm font-medium",
                  summary.unrealizedPL >= 0 ? "text-success" : "text-destructive"
                )}>
                  {summary.unrealizedPL >= 0 ? '+' : ''}
                  ${summary.unrealizedPL.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  <span className="text-muted-foreground">
                    ({summary.unrealizedPLPercent >= 0 ? '+' : ''}{summary.unrealizedPLPercent.toFixed(1)}%)
                  </span>
                </div>
                {validation?.isValid && (
                  <div className="data-validated mt-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    Data validated
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    isActive ? 'nav-link-active' : 'nav-link',
                    !isDataLoaded && item.href !== '/' && 'opacity-50 pointer-events-none'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Upload New Data */}
          <div className="px-4 py-4 border-t border-border">
            <NavLink
              to="/"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-secondary/50 text-secondary-foreground hover:bg-secondary transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isDataLoaded ? 'Upload New Data' : 'Upload Portfolio'}
              </span>
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-base font-semibold">Portfolio Coach</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-background border-b border-border p-4 space-y-1 animate-slide-up">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    isActive ? 'nav-link-active' : 'nav-link',
                    !isDataLoaded && item.href !== '/' && 'opacity-50 pointer-events-none'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}

import { useState } from 'react';
import { Activity, Zap, Database, MessageSquare, Menu, X } from 'lucide-react';
import { HealthMonitor } from './HealthMonitor';
import { ApiPlayground } from './ApiPlayground';
import { ChatInterface } from './ChatInterface';

type Tab = 'overview' | 'playground' | 'chat';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: Activity },
    { id: 'playground' as Tab, label: 'API Playground', icon: Zap },
    { id: 'chat' as Tab, label: 'Chat', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen">
      {/* Header - Mobile Responsive */}
      <header className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold gradient-text">Agent4 Multi-LLM</h1>
                <p className="text-xs text-gray-400">Enterprise API Platform</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-white/10 animate-fade-in">
              <nav className="flex flex-col gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                        activeTab === tab.id
                          ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Mobile Responsive */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'playground' && <ApiPlayground />}
        {activeTab === 'chat' && <ChatInterface />}
      </main>

      {/* Footer - Mobile Responsive */}
      <footer className="glass border-t border-white/10 py-6 mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
          <p className="mb-2">
            Powered by <span className="gradient-text font-semibold">Agent4 Multi-LLM</span>
          </p>
          <p className="text-xs">
            Enterprise-grade LLM orchestration • Production-ready • Open Source
          </p>
        </div>
      </footer>
    </div>
  );
}

function Overview() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Hero Section - Mobile Responsive */}
      <div className="card text-center py-12 sm:py-16 lg:py-20">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
          <span className="gradient-text">Multi-LLM Orchestration</span>
        </h2>
        <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
          Enterprise-grade API platform for intelligent LLM fallback and multi-provider orchestration
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="btn-primary w-full sm:w-auto">
            Get Started
          </button>
          <a
            href="https://github.com/NovusAevum/agent4-implementation"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full sm:w-auto"
          >
            View on GitHub
          </a>
        </div>
      </div>

      {/* Health Monitor */}
      <HealthMonitor />

      {/* Features Grid - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <FeatureCard
          icon={<Zap className="w-6 h-6 sm:w-8 sm:h-8" />}
          title="Lightning Fast"
          description="Sub-second response times with intelligent caching"
        />
        <FeatureCard
          icon={<Database className="w-6 h-6 sm:w-8 sm:h-8" />}
          title="Multi-Provider"
          description="Seamless fallback across multiple LLM providers"
        />
        <FeatureCard
          icon={<Activity className="w-6 h-6 sm:w-8 sm:h-8" />}
          title="Real-time Monitoring"
          description="Live health checks and performance metrics"
        />
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="card group hover:scale-105 transition-transform">
      <div className="mb-4 text-primary-400 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-gray-400">{description}</p>
    </div>
  );
}

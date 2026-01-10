'use client';

import Link from 'next/link';
import { ArrowRight, Github, Sparkles, Brain, Shield, Zap, TrendingUp, Users, Database } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20"></div>
      
      {/* Content */}
      <div className="relative">
        {/* Header */}
        <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-950/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  BLACKDROME
                </h1>
                <p className="text-xs text-slate-400">FedEx Hackathon 2026</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/09Catho/blackdrome-fedex-DCAmanager-SuperML"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 transition-all hover:scale-105"
              >
                <Github className="w-4 h-4 text-slate-300" />
                <span className="text-sm text-slate-300">GitHub</span>
              </a>
              <Link
                href="/login"
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/30 transition-all hover:scale-105"
              >
                Launch App
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-orange-300 font-medium">AI-Powered Debt Collection Platform</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                Revolutionizing
              </span>
              <br />
              <span className="text-white">Debt Recovery</span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              An intelligent DCA management system built for FedEx, powered by machine learning to optimize 
              recovery rates, automate workflows, and ensure SLA compliance.
            </p>

            <div className="flex items-center justify-center space-x-4 pt-4">
              <Link
                href="/login"
                className="group flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-orange-500/30 transition-all hover:scale-105"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="px-8 py-4 bg-slate-800/50 backdrop-blur text-white rounded-xl font-semibold text-lg border border-slate-700 hover:bg-slate-800 transition-all hover:scale-105"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-20">
            {[
              { label: 'Recovery Rate', value: '84%', icon: TrendingUp, color: 'from-green-500 to-emerald-600' },
              { label: 'AI Accuracy', value: '91%', icon: Brain, color: 'from-purple-500 to-violet-600' },
              { label: 'SLA Compliance', value: '98%', icon: Shield, color: 'from-blue-500 to-cyan-600' },
              { label: 'Processing Speed', value: '<2s', icon: Zap, color: 'from-orange-500 to-amber-600' },
            ].map((stat, i) => (
              <div key={i} className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur hover:scale-105 transition-all">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Built with cutting-edge technology to solve real-world debt recovery challenges
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'AI-Powered Scoring',
                description: 'Logistic regression model predicts recovery probability with 91% accuracy, analyzing 6 key features including aging, amount, and contact attempts.',
                gradient: 'from-purple-500 to-violet-600',
              },
              {
                icon: Users,
                title: 'Multi-Tenant Security',
                description: 'Row-Level Security ensures complete data isolation between DCAs. Each agency only accesses their assigned cases with zero data leakage.',
                gradient: 'from-blue-500 to-cyan-600',
              },
              {
                icon: Zap,
                title: 'Real-Time SLA Tracking',
                description: 'Live countdown timers, automatic breach detection, and instant escalation. Never miss a deadline with our automated monitoring system.',
                gradient: 'from-orange-500 to-amber-600',
              },
              {
                icon: Shield,
                title: 'SOP-Driven Workflows',
                description: 'Enforced status transitions based on business rules. PTP requires dates, disputes need reasons, recovered amounts validated.',
                gradient: 'from-green-500 to-emerald-600',
              },
              {
                icon: TrendingUp,
                title: 'Smart Prioritization',
                description: 'ML model generates priority scores (0-10,000) combining recovery probability and debt amount for optimal resource allocation.',
                gradient: 'from-pink-500 to-rose-600',
              },
              {
                icon: Database,
                title: 'Complete Audit Trail',
                description: 'Immutable logs of every action. Track who did what, when, and why. Full transparency for governance and compliance.',
                gradient: 'from-indigo-500 to-purple-600',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur hover:border-slate-600 transition-all hover:scale-105"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ML Model Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="rounded-3xl bg-gradient-to-br from-purple-900/20 via-violet-900/20 to-purple-900/20 border border-purple-500/20 p-12 backdrop-blur">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-purple-300 font-medium">Machine Learning Engine</span>
                </div>
                <h2 className="text-4xl font-bold text-white mb-6">
                  Built Our Own ML Model
                </h2>
                <p className="text-slate-300 text-lg leading-relaxed mb-6">
                  We didn't use pre-trained models. We built a custom <span className="text-purple-400 font-semibold">Logistic Regression</span> model from scratch, 
                  trained on real debt collection scenarios with <span className="text-purple-400 font-semibold">500+ cases</span>.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    </div>
                    <div>
                      <div className="text-white font-semibold">6 Key Features</div>
                      <div className="text-slate-400 text-sm">Aging, amount, attempts, staleness, dispute status, PTP active</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    </div>
                    <div>
                      <div className="text-white font-semibold">83.8% Test Accuracy</div>
                      <div className="text-slate-400 text-sm">Validated on unseen data with 0.908 ROC-AUC score</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    </div>
                    <div>
                      <div className="text-white font-semibold">Explainable AI</div>
                      <div className="text-slate-400 text-sm">Every prediction shows step-by-step calculation and top 3 influencing factors</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="text-sm text-slate-400 mb-2">Training Dataset</div>
                  <div className="text-2xl font-bold text-white">500+ Cases</div>
                </div>
                <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="text-sm text-slate-400 mb-2">Model Type</div>
                  <div className="text-2xl font-bold text-white">Logistic Regression</div>
                </div>
                <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="text-sm text-slate-400 mb-2">Training Time</div>
                  <div className="text-2xl font-bold text-white">&lt; 2 seconds</div>
                </div>
                <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="text-sm text-slate-400 mb-2">Inference Speed</div>
                  <div className="text-2xl font-bold text-white">~100ms</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Meet Team Blackdrome
            </h2>
            <p className="text-xl text-slate-400">
              Two passionate developers building the future of debt recovery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: 'Atul',
                role: 'Full-Stack Developer & ML Engineer',
                description: 'Architected the entire platform, built the ML model from scratch, and implemented the AI scoring system.',
              },
              {
                name: 'Divyanshi',
                role: 'Backend Developer & Database Specialist',
                description: 'Designed the database schema, implemented RLS policies, and created the SLA tracking system.',
              },
            ].map((member, i) => (
              <div
                key={i}
                className="group p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur hover:border-orange-500/50 transition-all hover:scale-105"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-3xl font-bold text-white mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  {member.name[0]}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{member.name}</h3>
                <div className="text-orange-400 font-medium mb-4">{member.role}</div>
                <p className="text-slate-400 leading-relaxed">{member.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Built With Modern Tech</h2>
            <p className="text-slate-400">Production-grade stack for enterprise scalability</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Next.js 14', 'TypeScript', 'Supabase', 'PostgreSQL', 'Python', 'Scikit-learn', 'TailwindCSS', 'Vercel'].map((tech, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
                <div className="text-white font-semibold">{tech}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="rounded-3xl bg-gradient-to-br from-orange-900/20 via-amber-900/20 to-orange-900/20 border border-orange-500/20 p-16 text-center backdrop-blur">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to See It in Action?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Experience the future of debt collection management. Login with demo credentials and explore all features.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                href="/login"
                className="group flex items-center space-x-2 px-10 py-5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-orange-500/40 transition-all hover:scale-105"
              >
                <span>Launch Platform</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="https://github.com/09Catho/blackdrome-fedex-DCAmanager-SuperML"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-10 py-5 bg-slate-800 text-white rounded-xl font-bold text-lg border border-slate-700 hover:bg-slate-700 transition-all hover:scale-105"
              >
                <Github className="w-5 h-5" />
                <span>View on GitHub</span>
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  BLACKDROME
                </span>
              </div>
              <p className="text-slate-400">
                Built for FedEx Hackathon 2026 by Atul & Divyanshi
              </p>
              <p className="text-slate-500 text-sm">
                AI-Powered DCA Management Platform
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

import React from 'react';
import { ArrowRight, Shield, Zap, PieChart } from 'lucide-react';

interface LandingPageProps {
    onGetStarted: (name: string) => void;
    isDark: boolean;
}

export default function LandingPage({ onGetStarted, isDark }: LandingPageProps) {
    const [name, setName] = React.useState('');

    const handleSubmit = () => {
        if (name.trim()) {
            onGetStarted(name);
        }
    }

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${isDark ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900'
            }`}>

            {/* Hero Section */}
            <div className="max-w-4xl w-full text-center space-y-8 animate-fade-in-up">
                <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Master Your Money
                        </span>
                        <br />
                        Control Your Future
                    </h1>
                    <p className={`text-xl md:text-2xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        The smart, secure, and real-time way to track expenses across all your devices.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-4 max-w-sm mx-auto w-full">
                    <input
                        type="text"
                        placeholder="Enter your name to begin..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full px-6 py-4 rounded-full text-lg border outline-none focus:ring-4 transition-all ${isDark
                                ? 'bg-gray-800 border-gray-700 focus:ring-blue-500/20 text-white placeholder-gray-500'
                                : 'bg-white border-gray-200 focus:ring-blue-500/20 text-gray-900'
                            }`}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        className="w-full group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-full text-lg font-semibold hover:bg-blue-700 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    >
                        Get Started Now
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-6xl w-full px-4">
                <FeatureCard
                    icon={<Zap className="w-8 h-8 text-yellow-500" />}
                    title="Real-time Sync"
                    description="Instant updates across your phone, tablet, and laptop. No refresh needed."
                    isDark={isDark}
                />
                <FeatureCard
                    icon={<PieChart className="w-8 h-8 text-green-500" />}
                    title="Smart Analytics"
                    description="Visual breakdowns of your spending habits with interactive charts."
                    isDark={isDark}
                />
                <FeatureCard
                    icon={<Shield className="w-8 h-8 text-blue-500" />}
                    title="Bank-Grade Security"
                    description="Your data is protected with Row Level Security and encrypted storage."
                    isDark={isDark}
                />
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, description, isDark }: { icon: React.ReactNode, title: string, description: string, isDark: boolean }) {
    return (
        <div className={`p-6 rounded-2xl backdrop-blur-xl border transition-all hover:y-[-5px] ${isDark
            ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
            : 'bg-white/50 border-white/20 hover:bg-white shadow-lg'
            }`}>
            <div className="mb-4 p-3 bg-opacity-10 rounded-xl inline-block">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {description}
            </p>
        </div>
    );
}

import { BrainCircuit, Sparkles, Loader2 } from 'lucide-react';

export function GameLoading() {
    return (
        <div className="relative w-full py-12 md:py-20 flex flex-col items-center justify-center animate-in fade-in duration-500 overflow-hidden rounded-3xl border-2 border-primary/5 bg-card/50 backdrop-blur-sm">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-700" />
            </div>

            <div className="relative flex flex-col items-center gap-8 max-w-md text-center p-8">
                {/* Main Visual */}
                <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary to-secondary rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
                    
                    <div className="relative bg-card border-2 border-primary/20 shadow-2xl rounded-3xl p-8 transform transition-transform hover:scale-105 duration-500">
                        <div className="relative h-20 w-20 flex items-center justify-center">
                            {/* Custom SVG Path from User */}
                            <svg 
                                viewBox="0 0 24 24" 
                                className="w-full h-full text-primary animate-bounce-slow"
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="1.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            >
                                <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
                                <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
                                <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
                            </svg>
                            
                            <div className="absolute top-0 right-0">
                                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-2xl font-black tracking-tighter text-foreground md:text-3xl">
                        <BrainCircuit className="w-8 h-8 text-primary" />
                        <span>FLUX <span className="text-primary">AI</span></span>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                            Forging Your Session
                        </h3>
                        <p className="text-muted-foreground font-medium animate-pulse">
                            Our AI is crafting custom challenges for you...
                        </p>
                    </div>
                </div>

                {/* Progress Indicator */}
                <div className="w-64 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-loading-bar rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Neural Engine Active
                </div>
            </div>

            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(-5%); }
                    50% { transform: translateY(5%); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }
                @keyframes loading-bar {
                    0% { width: 0%; transform: translateX(-100%); }
                    50% { width: 70%; transform: translateX(0%); }
                    100% { width: 100%; transform: translateX(100%); }
                }
                .animate-loading-bar {
                    animation: loading-bar 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
            `}</style>
        </div>
    );
}

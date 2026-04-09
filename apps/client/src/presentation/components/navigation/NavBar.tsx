import { useState, useRef, useEffect } from 'react';
import { BarChart3, BookOpen, Brain, Dices, Library, LogOut, MessageCircle, Sparkles, Settings } from 'lucide-react';
import { useViewStore } from '../../features/navigation/store/useViewStore';
import { AppView } from '../../features/navigation/types';
import { Button } from '../ui/button';
import { SettingsModal } from '../settings/SettingsModal';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { type SrsStats, wordsApi } from '../../../infrastructure/api/words';

export function NavBar() {
    const { currentView, setView } = useViewStore();
    const { isAuthenticated, user, logout } = useAuthStore();

    return (
        <nav className="flex items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-6">
                <h1 className="text-xl font-bold tracking-tight text-primary">Flux</h1>

                <div className="flex items-center gap-1 md:gap-2">
                    <Button
                        variant={currentView === AppView.Reading ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setView(AppView.Reading)}
                        className="gap-2 px-2 md:px-4"
                        title="Reading"
                    >
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden md:inline">Reading</span>
                    </Button>
                    <Button
                        variant={currentView === AppView.WordManager ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setView(AppView.WordManager)}
                        className="gap-2 px-2 md:px-4"
                        title="Words"
                    >
                        <Library className="w-4 h-4" />
                        <span className="hidden md:inline">Words</span>
                    </Button>
                    <Button
                        variant={currentView === AppView.LearningMode ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setView(AppView.LearningMode)}
                        className="gap-2 px-2 md:px-4"
                        title="Arena"
                    >
                        <Dices className="w-4 h-4" />
                        <span className="hidden md:inline">Arena</span>
                    </Button>
                    <Button
                        variant={currentView === AppView.SrsReview ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setView(AppView.SrsReview)}
                        className="gap-2 px-2 md:px-4"
                        title="SRS Review"
                    >
                        <Brain className="w-4 h-4" />
                        <span className="hidden md:inline">SRS</span>
                    </Button>
                    <Button
                        variant={currentView === AppView.InteractiveWriting ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setView(AppView.InteractiveWriting)}
                        className="gap-2 px-2 md:px-4"
                        title="Writing"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span className="hidden md:inline">Writing</span>
                    </Button>
                    <Button
                        variant={currentView === AppView.Conversation ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setView(AppView.Conversation)}
                        className="gap-2 px-2 md:px-4"
                        title="Chat"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span className="hidden md:inline">Chat</span>
                    </Button>
                </div>
            </div>

            {isAuthenticated && (
                <UserMenu user={user} onLogout={logout} setView={setView} />
            )}
        </nav>
    );
}

function UserMenu({ user, onLogout, setView }: {
    user: { id: string; email: string } | null;
    onLogout: () => void;
    setView: (view: AppView) => void;
}) {
    const [open, setOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [stats, setStats] = useState<SrsStats | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open && !stats) {
            wordsApi.getSrsStats().then(setStats).catch(() => {});
        }
    }, [open, stats]);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const initials = user?.email
        ? user.email.slice(0, 2).toUpperCase()
        : '?';

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                title={user?.email || 'User'}
            >
                {initials}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border bg-popover shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                    {/* User info */}
                    <div className="px-4 py-3 border-b bg-muted/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-sm font-bold text-secondary-foreground shrink-0">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-popover-foreground truncate">{user?.email}</p>
                                <p className="text-xs text-muted-foreground">Learner</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick stats */}
                    {stats && (
                        <div className="grid grid-cols-3 gap-px bg-border/50 border-b">
                            <div className="bg-popover px-3 py-2 text-center">
                                <p className="text-lg font-bold text-popover-foreground">{stats.total}</p>
                                <p className="text-[10px] text-muted-foreground">Words</p>
                            </div>
                            <div className="bg-popover px-3 py-2 text-center">
                                <p className="text-lg font-bold text-popover-foreground">{stats.learned}</p>
                                <p className="text-[10px] text-muted-foreground">Learned</p>
                            </div>
                            <div className="bg-popover px-3 py-2 text-center">
                                <p className="text-lg font-bold text-primary">{stats.due}</p>
                                <p className="text-[10px] text-muted-foreground">Due</p>
                            </div>
                        </div>
                    )}

                    {/* Menu items */}
                    <div className="py-1">
                        <MenuButton
                            icon={<BarChart3 className="w-4 h-4" />}
                            label="Statistics"
                            onClick={() => { setView(AppView.Stats); setOpen(false); }}
                        />
                        <MenuButton
                            icon={<Brain className="w-4 h-4" />}
                            label="SRS Review"
                            badge={stats?.due ? `${stats.due} due` : undefined}
                            onClick={() => { setView(AppView.SrsReview); setOpen(false); }}
                        />
                        <MenuButton
                            icon={<Settings className="w-4 h-4" />}
                            label="Theme & Settings"
                            onClick={() => { setSettingsOpen(true); setOpen(false); }}
                        />
                    </div>

                    {/* Logout */}
                    <div className="border-t py-1">
                        <MenuButton
                            icon={<LogOut className="w-4 h-4" />}
                            label="Logout"
                            danger
                            onClick={() => { onLogout(); setOpen(false); }}
                        />
                    </div>
                </div>
            )}

            {/* Controlled settings modal */}
            <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} hideTrigger />
        </div>
    );
}

function MenuButton({ icon, label, badge, danger, onClick }: {
    icon: React.ReactNode;
    label: string;
    badge?: string;
    danger?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors
                ${danger
                    ? 'text-destructive hover:bg-destructive/10'
                    : 'text-popover-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
        >
            {icon}
            <span className="flex-1 text-left">{label}</span>
            {badge && (
                <span className="text-[10px] font-medium text-orange-600 dark:text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-full">
                    {badge}
                </span>
            )}
        </button>
    );
}


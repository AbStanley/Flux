import { BarChart3, BookOpen, Brain, Dices, Library, LogOut, Sparkles } from 'lucide-react';
import { useViewStore } from '../../features/navigation/store/useViewStore';
import { AppView } from '../../features/navigation/types';
import { Button } from '../ui/button';
import { SettingsModal } from '../settings/SettingsModal';
import { useAuthStore } from '../../features/auth/store/useAuthStore';

export function NavBar() {
    const { currentView, setView } = useViewStore();
    const { isAuthenticated, logout } = useAuthStore();

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
                        variant={currentView === AppView.Stats ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setView(AppView.Stats)}
                        className="gap-2 px-2 md:px-4"
                        title="Stats"
                    >
                        <BarChart3 className="w-4 h-4" />
                        <span className="hidden md:inline">Stats</span>
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <SettingsModal />
                {isAuthenticated && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={logout}
                        className="gap-2 px-2 md:px-4 text-muted-foreground hover:text-destructive"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden md:inline">Logout</span>
                    </Button>
                )}
            </div>
        </nav>
    );
}


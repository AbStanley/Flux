import { BookOpen, Dices, Library } from 'lucide-react';
import { useViewStore } from '../../features/navigation/store/useViewStore';
import { AppView } from '../../features/navigation/types';
import { Button } from '../ui/button';
import { SettingsModal } from '../settings/SettingsModal';

export function NavBar() {
    const { currentView, setView } = useViewStore();

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
                </div>
            </div>

            <SettingsModal />
        </nav>
    );
}

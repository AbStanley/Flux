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

                <div className="flex items-center gap-2">
                    <Button
                        variant={currentView === AppView.Reading ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setView(AppView.Reading)}
                        className="gap-2"
                    >
                        <BookOpen className="w-4 h-4" />
                        Reading
                    </Button>
                    <Button
                        variant={currentView === AppView.WordManager ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setView(AppView.WordManager)}
                        className="gap-2"
                    >
                        <Library className="w-4 h-4" />
                        Words
                    </Button>
                    <Button
                        variant={currentView === AppView.LearningMode ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setView(AppView.LearningMode)}
                        className="gap-2"
                    >
                        <Dices className="w-4 h-4" />
                        Arena
                    </Button>
                </div>
            </div>

            <SettingsModal />
        </nav>
    );
}

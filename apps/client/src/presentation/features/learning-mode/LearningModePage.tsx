import { useGameStore } from './store/useGameStore';
import { GameShell } from './GameShell';
import { MultipleChoiceGame } from './games/MultipleChoiceGame';
import { BuildWordGame } from './games/build-word/BuildWordGame';
import { AudioDictationGame } from './games/dictation/AudioDictationGame';
import { SentenceScrambleGame } from './games/scramble/SentenceScrambleGame';
import { StoryGame } from './games/story/StoryGame';
import { ClozeGame } from './games/cloze/ClozeGame';
import { GameLoading } from './components/GameLoading';
import { GameSetup } from './components/GameSetup';

export function LearningModePage() {
    const { status, config } = useGameStore();

    const renderGame = () => {
        switch (config.mode) {
            case 'build-word':
                return <BuildWordGame />;
            case 'dictation':
                return <AudioDictationGame />;
            case 'scramble':
                return <SentenceScrambleGame />;
            case 'story':
                return <StoryGame />;
            case 'cloze':
                return <ClozeGame />;
            default:
                return <MultipleChoiceGame />;
        }
    };

    if (status === 'playing' || status === 'finished') {
        return (
            <GameShell>
                {renderGame()}
            </GameShell>
        );
    }

    if (status === 'loading') {
        return <GameLoading />;
    }

    return (
        <div className="container py-8 space-y-8 animate-in fade-in">
            <GameSetup />
        </div>
    );
};

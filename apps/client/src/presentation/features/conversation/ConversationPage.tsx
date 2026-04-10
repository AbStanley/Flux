import { useConversationStore } from './store/useConversationStore';
import { SetupScreen } from './components/SetupScreen';
import { ChatScreen } from './components/ChatScreen';

export function ConversationPage() {
    const { status } = useConversationStore();

    if (status === 'setup') return <SetupScreen />;
    return <ChatScreen />;
}

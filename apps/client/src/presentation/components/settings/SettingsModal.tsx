import { useState, useEffect } from 'react';
import { Settings, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { useTheme } from '@/presentation/providers/useTheme';
import { useSettingsStore } from '@/presentation/features/settings/store/useSettingsStore';
import { ThemeBuilder } from './ThemeBuilder';
import { ModelManager } from './ModelManager';
import { ThemeSection, FontSection, SizeSection } from './SettingsSubSections';
import { defaultClient } from '@/infrastructure/api/api-client';

interface UserProfile {
    id: string;
    email: string;
    aiRequestsToday: number;
    dailyAiLimit: number;
    tokensToday?: number;
    tokensTotal?: number;
}

export function SettingsModal({ open, onOpenChange, hideTrigger }: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    hideTrigger?: boolean;
} = {}) {
    const { theme, setTheme } = useTheme();
    const { font, fontSize, setFont, setFontSize, customThemes, removeCustomTheme } = useSettingsStore();

    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        if (open) {
            defaultClient.get<UserProfile>('/api/auth/me')
                .then(data => {
                    if (data && typeof data === 'object' && 'id' in data) {
                        setProfile(data);
                    }
                })
                .catch(err => {
                    console.log('Not authenticated or failed to load profile:', err);
                    setProfile(null);
                });
        }
    }, [open]);

    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [editingThemeId, setEditingThemeId] = useState<string | null>(null);

    const handleEditTheme = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingThemeId(id);
        setIsBuilderOpen(true);
    };

    const handleDeleteTheme = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this theme?')) {
            removeCustomTheme(id);
            if (theme === id) setTheme('light');
        }
    };

    const handleCreateTheme = () => {
        setEditingThemeId(null);
        setIsBuilderOpen(true);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                {!hideTrigger && (
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full w-10 h-10 bg-background/50 hover:bg-background/80 backdrop-blur-sm border border-border/50"
                        >
                            <Settings className="h-5 w-5" />
                            <span className="sr-only">Settings</span>
                        </Button>
                    </DialogTrigger>
                )}
                <DialogContent
                    className="w-full max-w-full sm:max-w-md max-h-[85vh] sm:max-h-[90vh] flex flex-col gap-0 p-0 left-0 right-0 bottom-0 top-auto translate-x-0 translate-y-0 sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:bottom-auto rounded-t-2xl sm:rounded-lg border-b-0 sm:border-b data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-left-0 data-[state=closed]:slide-out-to-left-0 sm:data-[state=open]:slide-in-from-top-[48%] sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=closed]:slide-out-to-left-1/2"
                    aria-describedby={undefined}
                >
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle>Reader Settings</DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <ThemeSection
                            theme={theme}
                            setTheme={setTheme}
                            customThemes={customThemes}
                            onEdit={handleEditTheme}
                            onDelete={handleDeleteTheme}
                            onCreate={handleCreateTheme}
                        />
                        <FontSection font={font} setFont={setFont} />
                        <SizeSection fontSize={fontSize} setFontSize={setFontSize} />
                        {profile && (
                            <div className="border-t pt-4">
                                <h3 className="text-xs md:text-sm font-medium mb-1.5 md:mb-3 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                                    AI Usage Credits
                                </h3>
                                <div className="rounded-md border p-3 bg-muted/30 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Requests Used Today</span>
                                        <span className="font-semibold">
                                            {profile.dailyAiLimit === -1
                                                ? `${profile.aiRequestsToday} / Unlimited`
                                                : `${profile.aiRequestsToday} / ${profile.dailyAiLimit}`}
                                        </span>
                                    </div>
                                    {profile.dailyAiLimit !== -1 && (
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-300 rounded-full"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        (profile.aiRequestsToday / profile.dailyAiLimit) * 100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    )}
                                    <div className="flex justify-between text-xs border-t pt-2 mt-2">
                                        <span className="text-muted-foreground">Tokens Used Today</span>
                                        <span className="font-semibold">
                                            {(profile.tokensToday ?? 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Total Tokens Consumed</span>
                                        <span className="font-semibold">
                                            {(profile.tokensTotal ?? 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground pt-1">
                                        {profile.dailyAiLimit === -1
                                            ? "You have unlimited AI features access (owner override)."
                                            : "Limits reset daily. Need more credits? Contact the administrator."}
                                    </p>
                                </div>
                            </div>
                        )}
                        <ModelManager />
                    </div>
                </DialogContent>
            </Dialog>

            <ThemeBuilder
                isOpen={isBuilderOpen}
                onClose={() => setIsBuilderOpen(false)}
                editThemeId={editingThemeId}
            />
        </>
    );
}

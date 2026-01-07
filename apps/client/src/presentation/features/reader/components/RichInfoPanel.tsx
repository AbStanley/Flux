import { RichDetailsContent } from './rich-details/RichDetailsContent';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { X, Trash2 } from "lucide-react";
import type { RichDetailsTab } from '../store/useTranslationStore';

interface RichInfoPanelProps {
    isOpen: boolean;
    tabs: RichDetailsTab[];
    activeTabId: string | null;
    onClose: () => void;
    onTabChange: (id: string) => void;
    onCloseTab: (id: string) => void;
    onRegenerate: (id: string) => void;
    onClearAll: () => void;
}
export const RichInfoPanel: React.FC<RichInfoPanelProps> = ({ isOpen, tabs, activeTabId, onClose, onTabChange, onCloseTab, onRegenerate, onClearAll }) => {
    if (!isOpen) return null;

    return (
        <Card className="fixed bottom-0 right-0 z-50 h-[60vh] w-full border-t shadow-2xl flex flex-col rounded-t-xl glass bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-in slide-in-from-bottom duration-300 min-[1200px]:static min-[1200px]:h-full min-[1200px]:w-full min-[1200px]:border min-[1200px]:shadow-sm min-[1200px]:rounded-xl min-[1200px]:z-0 min-[1200px]:bg-transparent min-[1200px]:backdrop-blur-none min-[1200px]:mt-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 border-b gap-2">
                <div className="flex-1 min-w-0 overflow-hidden">
                    {tabs.length > 0 && activeTabId ? (
                        <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 min-w-0 overflow-hidden">
                                <Tabs value={activeTabId} onValueChange={onTabChange} className="w-full">
                                    <ScrollArea
                                        className="w-full whitespace-nowrap pb-2"
                                        onWheel={(e) => {
                                            if (e.deltaY !== 0) {
                                                const viewport = e.currentTarget.querySelector('[data-radix-scroll-area-viewport]');
                                                if (viewport) {
                                                    viewport.scrollLeft += e.deltaY;
                                                    e.preventDefault();
                                                }
                                            }
                                        }}
                                    >
                                        <TabsList className="inline-flex w-max min-w-full justify-start h-auto p-1 bg-transparent gap-2">
                                            {tabs.map(tab => (
                                                <div key={tab.id} className="relative group shrink-0">
                                                    <TabsTrigger
                                                        value={tab.id}
                                                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-4 py-1.5 h-auto text-xs font-medium border border-transparent data-[state=active]:border-primary/20 transition-all flex items-center gap-2 pr-8"
                                                    >
                                                        <span className="truncate max-w-[120px]">{tab.text}</span>
                                                    </TabsTrigger>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onCloseTab(tab.id);
                                                        }}
                                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded-full p-0.5 transition-all"
                                                        title="Close Tab"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </TabsList>
                                    </ScrollArea>
                                </Tabs>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClearAll}
                                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                                title="Close All Tabs"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <CardTitle className="text-xl font-bold px-2 py-1">Details</CardTitle>
                    )}
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full px-6 pb-6 pt-4">
                    {tabs.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">
                            Select a word and click "More Info" to see details.
                        </div>
                    ) : (
                        tabs.map(tab => (
                            <div key={tab.id} className={activeTabId === tab.id ? 'block' : 'hidden'}>
                                <RichDetailsContent
                                    data={tab.data}
                                    isLoading={tab.isLoading}
                                    error={tab.error}
                                    onRegenerate={() => onRegenerate(tab.id)}
                                />
                            </div>
                        ))
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

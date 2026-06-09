import { useWordManager } from './hooks/useWordManager';
import { WordList } from './components/WordList';
import { EditWordDialog } from './components/EditWordDialog';
import { ExportDialog } from './components/ExportDialog';
import { Button } from '../../components/ui/button';
import { Plus, Download, Search } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

export function WordManager() {
    const {
        wordsState,
        phrasesState,
        error,
        isDialogOpen,
        setIsDialogOpen,
        isExportOpen,
        setIsExportOpen,
        editingWord,
        setEditingWord,
        searchQuery,
        setSearchQuery,
        sortOption,
        setSortOption,
        sourceLanguage,
        setSourceLanguage,
        targetLanguage,
        setTargetLanguage,
        availableLanguages,
        activeTab,
        setActiveTab,
        handleCreate,
        handleUpdate,
        handleDelete,
        openEditDialog,
        fetchWords
    } = useWordManager();

    const uniqueSourceLangs = Array.from(new Set(availableLanguages.map(l => l.sourceLanguage).filter(Boolean)));
    const uniqueTargetLangs = Array.from(new Set(availableLanguages.map(l => l.targetLanguage).filter(Boolean)));

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 md:space-y-8 pb-20 md:pb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                        Vocabulary Manager
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">Manage your collection.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="flex gap-2 ml-auto">
                        <Button variant="outline" size="sm" onClick={() => setIsExportOpen(true)} disabled={wordsState.total + phrasesState.total === 0}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button size="sm" onClick={() => { setEditingWord(undefined); setIsDialogOpen(true); }} className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Entry
                        </Button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-md bg-destructive/15 text-destructive font-medium animate-in fade-in slide-in-from-top-2 flex items-center justify-between">
                    <span>{error}</span>
                    <Button variant="outline" size="sm" onClick={() => { fetchWords('word', 1); fetchWords('phrase', 1); }}>
                        Retry
                    </Button>
                </div>
            )}

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Custom Tabs */}
                <div className="flex p-1 bg-muted/30 rounded-lg w-full md:w-fit gap-1 border">
                    <button
                        onClick={() => setActiveTab('word')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'word'
                            ? 'bg-background text-foreground shadow-sm scale-[1.02]'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }`}
                    >
                        Words
                        <span className="ml-2 text-xs opacity-60 bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">
                            {wordsState.total}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('phrase')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'phrase'
                            ? 'bg-background text-foreground shadow-sm scale-[1.02]'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }`}
                    >
                        Phrases
                        <span className="ml-2 text-xs opacity-60 bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">
                            {phrasesState.total}
                        </span>
                    </button>
                </div>

                {/* Search + Filters */}
                <div className="flex flex-col xl:flex-row gap-4 bg-card p-4 rounded-xl border shadow-sm">
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search vocabulary..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/50 transition-all w-full"
                        />
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full xl:w-auto">
                        <div className="grid grid-cols-2 sm:flex sm:flex-nowrap gap-2 w-full">
                            <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                                <SelectTrigger className="bg-background/50 h-9 text-xs sm:w-[130px]">
                                    <SelectValue placeholder="Source" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Source</SelectItem>
                                    {uniqueSourceLangs.map(lang => (
                                        <SelectItem key={`source-${lang}`} value={lang}>{lang}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                                <SelectTrigger className="bg-background/50 h-9 text-xs sm:w-[130px]">
                                    <SelectValue placeholder="Target" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Target</SelectItem>
                                    {uniqueTargetLangs.map(lang => (
                                        <SelectItem key={`target-${lang}`} value={lang}>{lang}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={sortOption} onValueChange={setSortOption}>
                                <SelectTrigger className="bg-background/50 h-9 text-xs col-span-2 sm:w-[160px]">
                                    <SelectValue placeholder="Sort" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date_desc">Newest First</SelectItem>
                                    <SelectItem value="date_asc">Oldest First</SelectItem>
                                    <SelectItem value="text_asc">Entry (A-Z)</SelectItem>
                                    <SelectItem value="text_desc">Entry (Z-A)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="min-h-[500px] transition-all duration-500">
                    <WordList
                        words={activeTab === 'word' ? wordsState.items : phrasesState.items}
                        onEdit={openEditDialog}
                        onDelete={(id) => handleDelete(id, activeTab)}
                        emptyMessage={activeTab === 'word' ? "No words found in your collection." : "No phrases found in your collection."}
                        hasMore={activeTab === 'word' ? wordsState.hasMore : phrasesState.hasMore}
                        isLoading={activeTab === 'word' ? (wordsState.isLoading || !wordsState.hasLoaded) : (phrasesState.isLoading || !phrasesState.hasLoaded)}
                        onLoadMore={() => fetchWords(
                            activeTab,
                            (activeTab === 'word' ? wordsState.page : phrasesState.page) + 1,
                            searchQuery,
                            sortOption,
                            sourceLanguage !== 'all' ? sourceLanguage : undefined,
                            targetLanguage !== 'all' ? targetLanguage : undefined
                        )}
                    />
                </div>
            </div>

            <EditWordDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSubmit={editingWord ? handleUpdate : handleCreate}
                initialData={editingWord}
                defaultType={activeTab}
            />

            <ExportDialog
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
            />
        </div>
    );
}

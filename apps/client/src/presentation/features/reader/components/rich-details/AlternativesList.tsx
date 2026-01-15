interface AlternativesListProps {
    alternatives: string[];
}

export function AlternativesList({ alternatives }: AlternativesListProps) {
    if (!alternatives || alternatives.length === 0) return null;

    return (
        <div>
            <h4 className="text-sm font-semibold mb-2">Alternatives</h4>
            <div className="flex flex-wrap gap-2">
                {alternatives.map((alt, i) => (
                    <span key={i} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                        {alt}
                    </span>
                ))}
            </div>
        </div>
    );
};

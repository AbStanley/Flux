

export interface Chapter {
    id: string;
    label: string;
    href: string;
    subitems?: Chapter[];
}

export const processToc = (items: any[]): Chapter[] => {
    return items.map(item => ({
        id: item.id,
        label: item.label.trim(),
        href: item.href,
        subitems: item.subitems ? processToc(item.subitems) : undefined
    }));
};

export const flattenToc = (items: Chapter[]): Chapter[] => {
    return items.reduce((acc: Chapter[], item) => {
        acc.push(item);
        if (item.subitems) acc.push(...flattenToc(item.subitems));
        return acc;
    }, []);
};

export const extractEpubText = async (book: any, selectedHrefs: Set<string>, toc: Chapter[]): Promise<string> => {
    if (!book || selectedHrefs.size === 0) return '';
    let fullText = '';

    const cleanToc = flattenToc(toc);

    // Filter and sort per TOC order
    const orderedHrefs = cleanToc
        .map(c => c.href)
        .filter(href => selectedHrefs.has(href));

    for (const href of orderedHrefs) {
        const hrefWithoutHash = href.split('#')[0];
        let spineItem = book.spine.get(hrefWithoutHash);

        if (!spineItem) {
            spineItem = book.spine.items.find((item: any) => item.href.endsWith(hrefWithoutHash) || hrefWithoutHash.endsWith(item.href));
        }

        if (spineItem) {
            try {
                const doc = await spineItem.load(book.load.bind(book));
                let text = '';
                let docElement: Document | HTMLElement | null = null;

                if (typeof doc === 'string') {
                    const parser = new DOMParser();
                    try {
                        docElement = parser.parseFromString(doc, "application/xhtml+xml");
                    } catch (e) {
                        docElement = parser.parseFromString(doc, "text/html");
                    }
                } else if (typeof doc === 'object' && doc !== null) {
                    docElement = doc as any;
                }

                if (docElement) {
                    // Normalize to a root element or body
                    let root: Element | null = null;
                    if (docElement instanceof Document) {
                        root = docElement.body || docElement.documentElement;
                    } else if (docElement instanceof HTMLElement) {
                        root = docElement;
                    }

                    if (root) {
                        const unwantedTags = ['style', 'script', 'link', 'meta', 'title', 'noscript', 'svg'];
                        unwantedTags.forEach(tag => {
                            const elements = root!.querySelectorAll(tag);
                            elements.forEach(el => el.remove());
                        });

                        text = root.textContent || "";
                    }
                }

                const title = cleanToc.find(c => c.href === href)?.label || 'Chapter';

                if (text && text.trim().length > 0) {
                    fullText += `### ${title}\n\n${text.trim()}\n\n`;
                } else {
                    console.warn(`Extracted text for ${href} was empty.`);
                }
            } catch (err) {
                console.error(`Failed to load content for ${href}`, err);
            } finally {
                spineItem.unload();
            }
        } else {
            console.warn(`Could not find spine item for href: ${href}`);
        }
    }
    return fullText;
};

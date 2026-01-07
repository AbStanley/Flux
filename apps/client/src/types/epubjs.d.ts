declare module 'epubjs' {
    export interface TocItem {
        id: string;
        href: string;
        label: string;
        subitems?: TocItem[];
    }

    export interface Navigation {
        toc: TocItem[];
    }

    export interface Book {
        ready: Promise<void>;
        loaded: {
            navigation: Promise<Navigation>;
        };
        destroy: () => void;
    }

    function ePub(data: ArrayBuffer | string, options?: any): Book;
    export default ePub;
}

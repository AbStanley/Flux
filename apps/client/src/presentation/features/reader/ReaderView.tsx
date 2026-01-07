import React from 'react';
import { ReaderMainPanel } from './components/ReaderMainPanel';
import { ReaderSidebar } from './components/ReaderSidebar';

export const ReaderView: React.FC = () => {
    return (
        <div className="relative flex flex-col min-[1200px]:flex-row w-full flex-1 h-full min-h-0 max-w-full mx-auto my-0 transition-all duration-300 gap-6">
            <ReaderMainPanel />
            <ReaderSidebar />
        </div>
    );
};




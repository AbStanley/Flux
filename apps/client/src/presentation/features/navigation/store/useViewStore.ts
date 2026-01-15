import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppView } from '../types';

interface ViewState {
    currentView: AppView;
    setView: (view: AppView) => void;
}

export const useViewStore = create<ViewState>()(
    persist(
        (set) => ({
            currentView: AppView.Reading,
            setView: (view) => set({ currentView: view }),
        }),
        { name: 'flux-view-storage' }
    )
);

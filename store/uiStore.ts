import { create } from 'zustand';

interface UIState {
    isDarkMode: boolean;
    isSidebarOpen: boolean; // Just in case we add one

    toggleTheme: () => void;
    setTheme: (isDark: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    isDarkMode: typeof window !== 'undefined' ? (localStorage.getItem('theme') === 'dark') : true,
    isSidebarOpen: false,

    toggleTheme: () => set((state) => {
        const newMode = !state.isDarkMode;
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', newMode ? 'dark' : 'light');
            const root = window.document.documentElement;
            if (newMode) root.classList.add('dark');
            else root.classList.remove('dark');
        }
        return { isDarkMode: newMode };
    }),

    setTheme: (isDark) => set(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            const root = window.document.documentElement;
            if (isDark) root.classList.add('dark');
            else root.classList.remove('dark');
        }
        return { isDarkMode: isDark };
    })
}));

'use client';

import React from 'react';

const STORAGE_KEY = 'sidebar-collapsed';

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue>({
  collapsed: false,
  toggle: () => {},
});

export const useSidebar = () => React.useContext(SidebarContext);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);

  // Se lee despues de montar para no generar mismatch de hidratacion.
  React.useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === '1');
    } catch {}
  }, []);

  const toggle = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {}
      return next;
    });
  }, []);

  // Ctrl/Cmd + B alterna el sidebar
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function SidebarAside({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <aside
      className={`fixed z-30 hidden h-screen overflow-hidden border-r border-divider bg-default-50/50 shadow-sm transition-[width] duration-300 ease-in-out dark:border-zinc-700/50 md:block ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {children}
    </aside>
  );
}

export function SidebarContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={`flex min-h-screen min-w-0 flex-col transition-[margin] duration-300 ease-in-out ${
        collapsed ? 'md:ml-[72px]' : 'md:ml-64'
      }`}
    >
      {children}
    </div>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/ops/cn";

type TabsContextValue = {
  value: string;
  setValue: (next: string) => void;
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string) {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error(`<${component}> must be rendered inside <Tabs>`);
  }
  return ctx;
}

type TabsProps = {
  /** Controlled active tab value. Pair with `onValueChange`. */
  value?: string;
  /** Initial active tab value when uncontrolled. */
  defaultValue: string;
  onValueChange?: (next: string) => void;
  className?: string;
  children: ReactNode;
};

export default function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: TabsProps) {
  const baseId = useId();
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const active = isControlled ? value : internal;

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) setInternal(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const ctx = useMemo<TabsContextValue>(
    () => ({ value: active, setValue, baseId }),
    [active, setValue, baseId],
  );

  return (
    <TabsContext.Provider value={ctx}>
      <div className={cn("flex flex-col", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

type TabListProps = HTMLAttributes<HTMLDivElement>;

function TabList({ className, children, ...rest }: TabListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-6 border-b border-zimx-line",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

type TabProps = {
  value: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

function Tab({ value, disabled, className, children }: TabProps) {
  const { value: active, setValue, baseId } = useTabsContext("Tabs.Tab");
  const isActive = active === value;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const list = event.currentTarget.parentElement;
    if (!list) return;
    const tabs = Array.from(
      list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])'),
    );
    const currentIndex = tabs.indexOf(event.currentTarget);
    if (currentIndex < 0) return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(currentIndex + delta + tabs.length) % tabs.length];
    next?.focus();
    next?.click();
  };

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-controls={`${baseId}-panel-${value}`}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => setValue(value)}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative -mb-px border-b-2 py-3 font-mono text-[12px] uppercase tracking-tag",
        "transition-colors focus:outline-none focus-visible:text-zimx-ink",
        isActive
          ? "border-zimx-ink text-zimx-ink"
          : "border-transparent text-zimx-mute hover:text-zimx-ink",
        disabled && "opacity-40 pointer-events-none",
        className,
      )}
    >
      {children}
    </button>
  );
}

type TabPanelProps = {
  value: string;
  className?: string;
  children: ReactNode;
};

function TabPanel({ value, className, children }: TabPanelProps) {
  const { value: active, baseId } = useTabsContext("Tabs.Panel");
  const isActive = active === value;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      hidden={!isActive}
      className={cn(isActive && "pt-6", className)}
    >
      {isActive ? children : null}
    </div>
  );
}

Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

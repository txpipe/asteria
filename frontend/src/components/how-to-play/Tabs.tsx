/** biome-ignore-all lint/suspicious/noArrayIndexKey: Tabs are fixed, it wont generate any issue */
import { useState, useMemo, Children, isValidElement } from 'react';
import clsx from 'clsx';

import type { PropsWithChildren, ReactNode } from 'react';

interface TabProps extends PropsWithChildren {
  label: string;
  disabled?: boolean;
  rightAction?: ReactNode;
}

interface TabsProps extends PropsWithChildren {
  defaultActiveTab?: number;
  onTabChange?: (index: number) => void;
  className?: string;
  tabsClassName?: string;
  contentClassName?: string;
}

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

export default function Tabs({
  children,
  defaultActiveTab = 0,
  onTabChange,
  className = '',
  tabsClassName = '',
  contentClassName = '',
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);

  // Extract tab information from children
  const tabs = useMemo(() => {
    const tabItems: Array<{ label: string; disabled?: boolean; content: ReactNode; rightAction?: ReactNode }> = [];

    Children.forEach(children, (child) => {
      if (isValidElement(child) && child.type === Tab) {
        const { label, disabled, children: content, rightAction } = child.props as TabProps;
        tabItems.push({ label, disabled, content, rightAction });
      }
    });

    return tabItems;
  }, [children]);

  const handleTabClick = (index: number) => {
    if (tabs[index]?.disabled) return;

    setActiveTab(index);
    onTabChange?.(index);
  };

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className={clsx('bg-[#131313] rounded-lg p-6 flex flex-col relative', className)}>
      {/* Tab Navigation */}
      <div
        className={clsx('relative flex border-b border-[#3E3E3E]', tabsClassName)}
        role="tablist"
        aria-orientation="horizontal"
      >
        {tabs.map((tab, index) => (
          <button
            type="button"
            key={`tab-${index}`}
            role="tab"
            aria-selected={activeTab === index}
            aria-controls={`tabpanel-${index}`}
            id={`tab-${index}`}
            tabIndex={activeTab === index ? 0 : -1}
            disabled={tab.disabled}
            className={clsx(
              'px-4 py-2 font-medium text-sm border-b-4 transition-colors duration-200',
              'focus:outline-hidden',
              'cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
              'border-transparent text-[#A0A0A0] hover:text-[#FFF75D]/50 hover:border-[#FFF75D]/50',
              'aria-selected:border-[#FFF75D] aria-selected:text-[#FFF75D]',
            )}
            onClick={() => handleTabClick(index)}
          >
            {tab.label}
          </button>
        ))}
        {tabs[activeTab]?.rightAction && (
          <div className="absolute top-0 right-0 h-full flex items-center">{tabs[activeTab].rightAction}</div>
        )}
      </div>

      {/* Tab Content */}
      <div className={clsx('flex flex-1', contentClassName)}>
        {tabs.map((tab, index) => (
          <div
            key={`tabpanel-${index}`}
            role="tabpanel"
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            data-selected={activeTab === index}
            hidden={activeTab !== index}
            tabIndex={index}
            className={clsx("w-full", activeTab === index ? "block" : "hidden")}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}

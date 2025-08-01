// Context
import { TooltipContext } from '@/context/TooltipContext';

// Hooks
import { type TooltipOptions, useTooltip } from '@/hooks/useTooltip';

export function Tooltip({
  children,
  ...options
}: { children: React.ReactNode } & TooltipOptions) {
  // This can accept any props as options, e.g. `placement`,
  // or other positioning options.
  const tooltip = useTooltip(options);
  return (
    <TooltipContext.Provider value={tooltip}>
      {children}
    </TooltipContext.Provider>
  );
}
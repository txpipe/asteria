import { forwardRef } from 'react';
import { FloatingPortal, useMergeRefs } from '@floating-ui/react';

// Context
import { useTooltipContext } from '@/context/TooltipContext';

export const TooltipContent = forwardRef<
  HTMLDivElement,
  React.HTMLProps<HTMLDivElement>
>(function TooltipContent({ style, ...props }, propRef) {
  const context = useTooltipContext();
  const ref = useMergeRefs([context.refs.setFloating, propRef]);

  if (!context.open) return null;

  return (
    <FloatingPortal>
      <div
        ref={ref}
        style={{
          ...context.floatingStyles,
          ...style
        }}
        className="bg-[#0E0E0E] rounded-md border border-white/12 p-3 text-base text-[#F1E9D9]/80"
        {...context.getFloatingProps(props)}
      />
    </FloatingPortal>
  );
});
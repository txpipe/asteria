import { cloneElement, forwardRef, isValidElement } from 'react';
import { useMergeRefs } from '@floating-ui/react';

// Context
import { useTooltipContext } from '@/context/TooltipContext';

export const TooltipTrigger = forwardRef<
  HTMLElement,
  React.HTMLProps<HTMLElement> & { asChild?: boolean }
>(function TooltipTrigger({ children, asChild = false, ...props }, propRef) {
  const context = useTooltipContext();
  const isChildrenValid = isValidElement(children);
  const childrenRef = isChildrenValid ? (children as React.ReactElement & { ref?: React.Ref<HTMLElement> }).ref : null;
  const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

  // `asChild` allows the user to pass any element as the anchor
  if (asChild && isChildrenValid) {
    return cloneElement(
      children,
      context.getReferenceProps({
        ref,
        ...props,
        ...(children.props as Record<string, unknown>),
        "data-state": context.open ? "open" : "closed"
      } as React.HTMLProps<HTMLElement> & { "data-state": string }),
    );
  }

  return (
    <button
      ref={ref}
      // The user can style the trigger based on the state
      data-state={context.open ? "open" : "closed"}
      {...context.getReferenceProps(props)}
    >
      {children}
    </button>
  );
});
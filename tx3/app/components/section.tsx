import clsx from 'clsx';
import type { PropsWithChildren } from 'react';

interface SectionProps {
  className?: string;
}

export function Section({ children, className }: PropsWithChildren<SectionProps>) {
  return (
    <section
      className={clsx('min-h-dvh overflow-y-scroll overflow-x-hidden snap-start flex flex-col items-center py-8', className)}
    >
      {children}
    </section>
  );
}

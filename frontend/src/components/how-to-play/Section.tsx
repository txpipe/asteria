import clsx from 'clsx';
import type { PropsWithChildren } from 'react';

interface SectionProps {
  title?: string;
  className?: string;
  id: string;
}

export default function Section({ children, title, className, id }: PropsWithChildren<SectionProps>) {
  return (
    <section
      id={id}
      className={clsx('h-[calc(100dvh-64px)] overflow-y-hidden overflow-x-hidden snap-start flex', className)}
    >
      <div className="flex flex-col gap-6 items-center m-16 w-[50dvw] overflow-hidden bg-[#0A0A0A]/80 rounded-[20px] border p-6 border-[#07F3E6]">
        {title && <h2 className="font-monocraft text-xl text-[#07F3E6]">{title}</h2>}
        {children}
      </div>
    </section>
  );
}

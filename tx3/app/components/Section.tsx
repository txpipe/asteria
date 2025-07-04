import clsx from 'clsx';
import { useEffect, useRef, type PropsWithChildren } from 'react';

interface SectionProps {
  title?: string;
  className?: string;
  id: string;
}

export function Section({ children, title, className, id }: PropsWithChildren<SectionProps>) {
  return (
    <section
      id={id}
      className={clsx('h-dvh overflow-y-hidden overflow-x-hidden snap-start flex', className)}
    >
      <div className="flex flex-col gap-6 items-center ml-15 mr-4 my-16 w-[50dvw] overflow-hidden bg-[#0A0A0A]/80 rounded-[20px] border p-6 border-primary-50">
        {title && <h2 className="text-xl text-primary-50">{title}</h2>}
        {children}
      </div>
    </section>
  );
}

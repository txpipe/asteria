import clsx from 'clsx';
import type { PropsWithChildren } from 'react';

interface AlertProps extends PropsWithChildren {
  type: 'success' | 'error';
  title?: string;
  className?: string;
}

export function Alert({ type, children, className, title }: AlertProps) {
  return (
    <div
      className={clsx(
        'w-full border-l px-4 py-3 rounded-2xl wrap-break-word text-[#F1E9D9]/60 flex flex-col max-h-fit',
        {
          'bg-[#4ADE80]/4 border-[#4ADE80]': type === 'success',
          'bg-[#F87171]/4 border-[#F87171] text-[#F87171]/60': type === 'error',
          'min-h-32': !!title,
          'min-h-12': !title,
        },
        className,
      )}
    >
      {title && (
        <h3
          className={clsx('font-semibold mb-4', {
            'text-[#4ADE80]': type === 'success',
            'text-[#F87171]': type === 'error',
          })}
        >
          {title}
        </h3>
      )}
      <div className="overflow-y-scroll max-h-fit pr-2">{children}</div>
    </div>
  );
}

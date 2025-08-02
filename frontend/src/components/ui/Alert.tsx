import clsx from 'clsx';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';

interface AlertProps extends PropsWithChildren {
  type: 'success' | 'error';
  title?: string;
  className?: string;
}

export default function Alert({ type, children, className, title }: AlertProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showGradient, setShowGradient] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (contentRef.current) {
        const element = contentRef.current;
        const hasVerticalScroll = element.scrollHeight > element.clientHeight;
        const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
        
        setShowGradient(hasVerticalScroll && !isAtBottom);
      }
    };

    const handleScroll = () => {
      checkScroll();
    };

    checkScroll();
    
    // Observar cambios en el contenido
    const observer = new ResizeObserver(checkScroll);
    if (contentRef.current) {
      observer.observe(contentRef.current);
      contentRef.current.addEventListener('scroll', handleScroll);
    }

    return () => {
      observer.disconnect();
      if (contentRef.current) {
        contentRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return (
    <div
      className={clsx(
        'w-full border-l px-4 py-3 rounded-lg break-words text-[#F1E9D9]/60 flex flex-col relative',
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
          className={clsx('font-mono font-semibold mb-4', {
            'text-[#4ADE80]': type === 'success',
            'text-[#F87171]': type === 'error',
          })}
        >
          {title}
        </h3>
      )}
      <div className="relative min-h-0">
        <div ref={contentRef} className="h-full overflow-auto pr-2">{children}</div>
        {showGradient && (
          <div className="absolute bottom-0 left-0 right-2 top-0 pointer-events-none bg-gradient-to-t from-[#151B17] to-transparent to-45%" />
        )}
      </div>
    </div>
  );
}

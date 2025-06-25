import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';

interface AsteriaMapProps {
  className?: string;
  apiUrl: string;
  shipyardPolicyId: string;
  fuelPolicyId: string;
  shipAddress: string;
  fuelAddress: string;
  asteriaAddress: string;
}

const baseURL = 'https://asteria.txpipe.io/visualizer/index.html';

export function AsteriaMap({
  apiUrl,
  className,
  shipyardPolicyId,
  fuelPolicyId,
  shipAddress,
  fuelAddress,
  asteriaAddress,
}: AsteriaMapProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const [hideLoader, setHideLoader] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasBeenVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px',
      },
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, []);

  const src = useMemo(() => {
    const url = new URL(baseURL);
    url.searchParams.set('apiUrl', apiUrl);
    url.searchParams.set('shipyardPolicyId', shipyardPolicyId);
    url.searchParams.set('fuelPolicyId', fuelPolicyId);
    url.searchParams.set('shipAddress', shipAddress);
    url.searchParams.set('fuelAddress', fuelAddress);
    url.searchParams.set('asteriaAddress', asteriaAddress);
    return url.toString();
  }, [apiUrl, shipyardPolicyId, fuelPolicyId, shipAddress, fuelAddress, asteriaAddress]);

  return (
    <div ref={elementRef} className={clsx('relative', className)}>
      {hasBeenVisible && (
        <iframe
          title="asteria map"
          src={src}
          className="w-full h-full"
          onLoad={() => setHideLoader(true)}
        />
      )}
      {!hideLoader && (
        <div className="absolute animate-spin block w-8 h-8 border-2 border-t-transparent border-[#07F3E6] rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      )}
    </div>
  );
}

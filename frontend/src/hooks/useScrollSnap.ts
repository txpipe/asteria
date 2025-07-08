import { useEffect, useState } from 'react';

export function useScrollSnap(containerSelector: string = 'main') {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const handleScroll = () => {
      const sections = container.querySelectorAll('section[id]');
      const containerRect = container.getBoundingClientRect();
      
      let closestSection = '';
      let minDistance = Infinity;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const distance = Math.abs(rect.top - containerRect.top);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestSection = section.id;
        }
      });

      if (closestSection && closestSection !== activeSection) {
        setActiveSection(closestSection);
        const newHash = `#${closestSection}`;
        if (window.location.hash !== newHash) {
          window.history.replaceState(null, '', newHash);
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
      }
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', throttledScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', throttledScroll);
    };
  }, [activeSection, containerSelector]);

  return activeSection;
}
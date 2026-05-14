import { useEffect, useRef, useState } from 'react';

export function useReveal(delay = 0, threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setTimeout(() => setShow(true), delay);
      } else {
        setShow(false); // Hide it when out of view so it animates again when scrolled back
      }
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, show };
}

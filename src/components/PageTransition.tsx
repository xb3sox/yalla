import { ReactNode, useEffect, useState, useRef } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  transitionKey: string;
}

export function PageTransition({ children, transitionKey }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [currentChildren, setCurrentChildren] = useState(children);
  const prevKeyRef = useRef(transitionKey);

  useEffect(() => {
    // Only animate if the key actually changes
    if (prevKeyRef.current === transitionKey) {
      setCurrentChildren(children);
      const timer = setTimeout(() => {}, 0);
      return () => clearTimeout(timer);
    }

    prevKeyRef.current = transitionKey;
    setIsVisible(false);

    const timer = setTimeout(() => {
      setCurrentChildren(children);
      setIsVisible(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [transitionKey, children]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {currentChildren}
    </div>
  );
}

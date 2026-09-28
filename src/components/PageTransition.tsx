import { ReactNode, useEffect, useState } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  transitionKey: string;
}

export function PageTransition({ children, transitionKey }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentChildren, setCurrentChildren] = useState(children);

  useEffect(() => {
    // Fade out
    setIsVisible(false);
    
    // Wait for fade out, then change content and fade in
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

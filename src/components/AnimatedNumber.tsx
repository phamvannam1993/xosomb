'use client';

import './AnimatedNumber.css';

interface AnimatedNumberProps {
  number?: string;
  isLoading?: boolean;
}

export function AnimatedNumber({ number, isLoading }: AnimatedNumberProps) {
  if (isLoading || !number) {
    return (
      <span className="animated-number loading" aria-label="Đang chờ số">
        <span className="spinner" aria-hidden="true">⚙️</span>
      </span>
    );
  }

  return (
    <span className="animated-number animating" key={number}>
      {number.split('').map((digit, index) => (
        <span key={`${number}-${index}`} className="digit" style={{ animationDelay: `${index * 50}ms` }}>
          {digit}
        </span>
      ))}
    </span>
  );
}

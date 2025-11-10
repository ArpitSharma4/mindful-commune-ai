import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  [key: string]: any;
}

const Logo: React.FC<LogoProps> = ({ size = 40, className = '', ...props }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`text-teal-500 ${className}`}
      {...props}
    >
      {/* Leaf shape */}
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M256 32C256 32 32 128 32 288C32 448 256 480 256 480C256 480 480 448 480 288C480 128 256 32 256 32Z" 
        className="fill-current text-teal-400 dark:text-teal-500"
      />
      
      {/* Brain pattern details */}
      <path 
        d="M256 128C200 128 160 160 160 200C160 224 176 240 200 240C224 240 240 224 240 200" 
        className="stroke-current text-teal-600 dark:text-teal-700"
        strokeWidth="8" 
        strokeLinecap="round"
      />
      <path 
        d="M256 128C312 128 352 160 352 200C352 224 336 240 312 240C288 240 272 224 272 200" 
        className="stroke-current text-teal-600 dark:text-teal-700"
        strokeWidth="8" 
        strokeLinecap="round"
      />
      <path 
        d="M200 200C200 240 220 260 256 260C292 260 312 240 312 200" 
        className="stroke-current text-teal-600 dark:text-teal-700"
        strokeWidth="8" 
        strokeLinecap="round"
      />
      <path 
        d="M256 260V320" 
        className="stroke-current text-teal-600 dark:text-teal-700"
        strokeWidth="8" 
        strokeLinecap="round"
      />
      <path 
        d="M200 320H312" 
        className="stroke-current text-teal-600 dark:text-teal-700"
        strokeWidth="8" 
        strokeLinecap="round"
      />
      <path 
        d="M228 320V380" 
        className="stroke-current text-teal-600 dark:text-teal-700"
        strokeWidth="8" 
        strokeLinecap="round"
      />
      <path 
        d="M284 320V380" 
        className="stroke-current text-teal-600 dark:text-teal-700"
        strokeWidth="8" 
        strokeLinecap="round"
      />
    </svg>
  );
};

export default Logo;
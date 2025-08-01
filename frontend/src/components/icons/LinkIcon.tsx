interface LinkIconProps {
  className?: string;
}

// Tabler Icon
export default function LinkIcon({ className }: LinkIconProps) {
  return (
    <svg
      role="graphics-symbol"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 18 18"
    >
      <path d="M9 4.5H4.5C4.10218 4.5 3.72064 4.65804 3.43934 4.93934C3.15804 5.22064 3 5.60218 3 6V13.5C3 13.8978 3.15804 14.2794 3.43934 14.5607C3.72064 14.842 4.10218 15 4.5 15H12C12.3978 15 12.7794 14.842 13.0607 14.5607C13.342 14.2794 13.5 13.8978 13.5 13.5V9M8.25 9.75L15 3M15 3H11.25M15 3V6.75" stroke="#F1E9D9" stroke-opacity="0.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  );
}

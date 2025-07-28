interface CloseIconProps {
  className?: string;
}

// Tabler Icon
export function CloseIcon({ className }: CloseIconProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 16 16"
    >
      <title>Close</title>
      <path d="M13.1998 2.80005L2.7998 13.2" stroke="#F1E9D9" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.7998 2.80005L13.1998 13.2" stroke="#F1E9D9" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

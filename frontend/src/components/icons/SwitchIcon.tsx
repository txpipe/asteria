interface SwitchIconProps {
  className?: string;
}

// Tabler Icon
export default function SwitchIcon({ className }: SwitchIconProps) {
  return (
    <svg
      role="graphics-symbol"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path stroke="none" d="M0 0h24v24H0z" />
      <path d="M3 17h5l1.67-2.386m3.66-5.227L15 7h6" />
      <path d="m18 4 3 3-3 3M3 7h5l7 10h6" />
      <path d="m18 20 3-3-3-3" />
    </svg>
  );
}

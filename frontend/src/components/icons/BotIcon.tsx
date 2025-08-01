interface BotIconProps {
  className?: string;
  strokeWidth?: number;
}

export default function BotIcon({ className, strokeWidth = 1.5 }: BotIconProps) {
  return (
    <svg
      className={className}
      role="graphics-symbol"
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
    >
      <path stroke="none" d="M0 0h24v24H0z"/>
      <path d="M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>
      <path d="M9 16c1 .667 2 1 3 1s2-.333 3-1M9 7 8 3M15 7l1-4M9 12v-1M15 12v-1"/>
    </svg>
  )
}

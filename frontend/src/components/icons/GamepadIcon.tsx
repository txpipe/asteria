interface GamepadIcon {
  className?: string;
  strokeWidth?: number;
}

export default function GamepadIcon({ className, strokeWidth = 1.5 }: GamepadIcon) {
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
      <path d="M12 5h3.5a5 5 0 0 1 0 10H10l-4.015 4.227a2.3 2.3 0 0 1-3.923-2.035l1.634-8.173A5 5 0 0 1 8.6 5H12z"/>
      <path d="m14 15 4.07 4.284a2.3 2.3 0 0 0 3.925-2.023l-1.6-8.232M8 9v2M7 10h2M14 10h2"/>
    </svg>
  )
}
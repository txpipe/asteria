interface PlayIconProps {
  className?: string;
  strokeWidth?: number;
}

export default function PlayIcon({ className, strokeWidth = 1.5 }: PlayIconProps) {
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
      <path d="M7 4v16l13-8z"/>
    </svg>
  )
}

export function FactoriMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="factori-grad" x1="0.12" y1="0.04" x2="0.82" y2="1">
          <stop offset="0" stopColor="#5C86E6" />
          <stop offset="0.46" stopColor="#3DC3C0" />
          <stop offset="1" stopColor="#5EF0A6" />
        </linearGradient>
      </defs>
      <path
        fill="url(#factori-grad)"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24 3 42 13.5 42 34.5 24 45 6 34.5 6 13.5Z M19.5 15 31.5 15 31.5 20 24.5 20 24.5 23.5 29.5 23.5 29.5 28 24.5 28 24.5 34.5 19.5 34.5Z"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={
        "font-semibold tracking-tight text-ink " + (className ?? "")
      }
    >
      Factori
    </span>
  );
}

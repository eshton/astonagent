export function Logo({ size = 32 }: { size?: number }) {
  // Unique gradient id per render size avoids collisions when multiple logos
  // appear on one page.
  const gid = `aa-grad-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="0.55" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gid})`} />
      {/* Soft top highlight for depth */}
      <rect width="32" height="16" rx="9" fill="white" fillOpacity="0.08" />
      {/* Stylized double-A monogram (overlapping peaks) */}
      <path
        d="M6.5 23 L12 9.5 L17.5 23"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M14.5 23 L20 9.5 L25.5 23"
        stroke="white"
        strokeOpacity="0.85"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

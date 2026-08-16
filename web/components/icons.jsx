// Small inline line-icon set — kept dependency-free rather than pulling in
// an icon library for a handful of glyphs.

function base(props) {
  return {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...props,
  };
}

export function CargoIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M3 16.5l1.5-6h15l1.5 6" />
      <path d="M5.5 10.5V6h3v4.5M10 10.5V6h3v4.5M15 10.5V6h3v4.5" />
      <path d="M2.5 16.5h19L20 20H4l-1.5-3.5z" />
    </svg>
  );
}

export function TankerIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M2.5 15.5h19L20 19H4l-1.5-3.5z" />
      <rect x="6" y="9" width="12" height="6.5" rx="1.5" />
      <path d="M9 9V6.5h6V9" />
    </svg>
  );
}

export function CruiseIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M4 16l1.5-9h13L20 16" />
      <path d="M7 16V9M11 16V6M15 16V9" />
      <path d="M2.5 16.5h19L20 20H4l-1.5-3.5z" />
    </svg>
  );
}

export function AllTrafficIcon(props) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" />
    </svg>
  );
}

export function BellIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M6 9a6 6 0 1 1 12 0c0 3.5 1 5 1.5 6H4.5c.5-1 1.5-2.5 1.5-6z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function AnchorIcon(props) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v14M7 13a5 5 0 0 0 10 0M5 13H3M21 13h-2" />
    </svg>
  );
}

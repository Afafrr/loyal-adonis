interface IconProps {
  className?: string;
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox='0 0 20 20' fill='none' aria-hidden='true'>
      <path
        d='m7.5 4.5 5 5.5-5 5.5'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

export function SignOutIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox='0 0 24 24' fill='none' aria-hidden='true'>
      <path
        d='M14 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-3M10 12h11m0 0-3-3m3 3-3 3'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

interface Props {
  onClick: () => void;
}

export function SaveInviteButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Save the invite image"
      className="fixed z-50 w-9 h-9 rounded-full bg-black/70 border border-brass/60 flex items-center justify-center backdrop-blur-sm active:scale-95 transition-transform shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 10px)',
        right: 'calc(env(safe-area-inset-right, 0px) + 10px)',
      }}
    >
      <svg
        aria-hidden
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brass"
      >
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
    </button>
  );
}

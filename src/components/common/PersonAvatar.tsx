function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface PersonAvatarProps {
  name: string;
  color: string;
  size?: 'sm' | 'md';
}

/** Círculo de color con iniciales. Nunca se usa como único identificador: el nombre siempre acompaña. */
export function PersonAvatar({ name, color, size = 'md' }: PersonAvatarProps) {
  const sizeClass = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-9 w-9 text-xs';
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${sizeClass}`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}

type NumberBadgeProps = {
  value: string;
  tone?: 'normal' | 'special';
};

export function NumberBadge({ value, tone = 'normal' }: NumberBadgeProps) {
  return (
    <span className={tone === 'special' ? 'numberBadge special' : 'numberBadge'}>
      {value}
    </span>
  );
}

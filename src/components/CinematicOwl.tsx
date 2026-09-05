type Props = {
  className?: string;
};

export function CinematicOwl({ className = "" }: Props) {
  return (
    <span className={`cinematic-owl ${className}`.trim()} aria-hidden="true">
      <span className="cinematic-owl-sprite" />
      <i className="cinematic-owl-rim" />
    </span>
  );
}

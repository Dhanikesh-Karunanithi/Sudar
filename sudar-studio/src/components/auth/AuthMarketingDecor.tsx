/** Shared background layers for Studio login / signup marketing column (aligned with teachwithsudar). */
export function AuthMarketingDecor() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(255,69,0,0.14),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[45%] w-[70%] bg-[radial-gradient(ellipse,rgba(255,122,69,0.06),transparent_65%)]"
        aria-hidden
      />
    </>
  )
}

/**
 * Sudar mark — geometry MUST match `assets/sudar logo/Sudar_Logo.svg` (path `d` and transforms).
 * Do not approximate with rects/rx; that causes seams and a broken central star.
 */

export type SudarLogoMarkVariant = "on-light" | "on-dark";

export type SudarLogoMarkProps = {
  /** Square canvas edge length (viewBox is 210×210). */
  size?: number;
  /** on-light: black pills, white star (default file). on-dark: white pills, star matches #050505 hero. */
  variant?: SudarLogoMarkVariant;
  className?: string;
};

const PILL_PATH =
  "M32,0 L138,0 C155.673,0 170,14.3269 170,32 C170,49.6731 155.673,64 138,64 L32,64 C14.3269,64 0,49.6731 0,32 C0,14.3269 14.3269,0 32,0";

const STAR_PATH =
  "M50,2 C51,49 51,49 98,50 C51,51 51,51 50,98 C49,51 49,51 2,50 C49,49 49,49 50,2";

export function SudarLogoMark({
  size = 256,
  variant = "on-light",
  className,
}: SudarLogoMarkProps) {
  const pillFill = variant === "on-light" ? "#000000" : "#ffffff";
  const starFill = variant === "on-light" ? "#ffffff" : "#050505";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="407 -5 210 210"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label="Sudar"
      className={className}
    >
      <metadata>
        {`SUDAR_LOGO_GEOMETRY_LOCK: Do not edit path d attributes or transform values—they are
paired with fill-rule evenodd and must stay in sync with assets/sudar logo/Sudar_Logo.svg.
The mark is two rounded capsules offset vertically; the centre is a four-point concave star
(white path on-light, dark fill on-dark)—never replace with separate rects or a loose overlay
or you will get hairline cracks and a wrong star. To recolour, only change fill on the three
groups; do not change geometry.`}
      </metadata>
      <g fillRule="evenodd">
        <g fill={pillFill} transform="translate(407,100)">
          <path d={PILL_PATH} />
        </g>
        <g fill={pillFill} transform="translate(447,36)">
          <path d={PILL_PATH} />
        </g>
        <g fill={starFill} transform="matrix(0.9,0,0,0.9,467,55)">
          <path fillRule="nonzero" d={STAR_PATH} />
        </g>
      </g>
    </svg>
  );
}

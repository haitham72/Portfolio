import Image from "next/image";

interface PosterImageProps {
  src: string | null;
  alt: string;
  className?: string;
  gradient?: string;
  sizes?: string;
  priority?: boolean;
}

/** Fills its container; renders a gradient placeholder div when src is null — never a broken <img>. */
export default function PosterImage({ src, alt, className = "", gradient, sizes, priority }: PosterImageProps) {
  if (!src) {
    return <div className={`relative ${className}`} style={{ background: gradient }} aria-hidden />;
  }
  return (
    <div className={`relative ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes ?? "100vw"} priority={priority} className="object-cover" />
    </div>
  );
}

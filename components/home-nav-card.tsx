import Link from "next/link";

type HomeNavCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
};

export function HomeNavCard({
  eyebrow,
  title,
  description,
  href,
  cta,
}: HomeNavCardProps) {
  return (
    <article className="nav-card">
      <p className="nav-card-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="button button-primary" href={href}>
        {cta}
      </Link>
    </article>
  );
}

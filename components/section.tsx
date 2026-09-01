import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { Reveal } from "@/components/motion";

export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel = "View all",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <Reveal className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition hover:gap-2.5"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </Reveal>
  );
}

export function PageHeader({
  title,
  description,
  breadcrumb,
}: {
  title: string;
  description?: string;
  breadcrumb?: { label: string; href?: string }[];
}) {
  return (
    <div className="border-b border-line bg-surface">
      <div className="container-page py-8">
        {breadcrumb && (
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-primary">
                  Home
                </Link>
              </li>
              {breadcrumb.map((crumb) => (
                <li key={crumb.label} className="flex items-center gap-1.5">
                  <span aria-hidden="true">/</span>
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-primary">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-ink">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-3xl text-sm text-ink">{description}</p>
        )}
      </div>
    </div>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page max-w-3xl py-10 [&_a]:text-primary [&_a]:underline [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-semibold [&_li]:mb-1.5 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_p]:text-ink [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5">
      {children}
    </div>
  );
}

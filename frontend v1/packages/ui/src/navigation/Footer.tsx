import Link from "next/link";

const columns = [
  {
    title: "Discover",
    links: [
      { href: "/collections", label: "Collections" },
      { href: "/categories", label: "Categories" },
      { href: "/creators", label: "Creators" },
      { href: "/occasions", label: "Occasions & Festivals" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/become-a-creator", label: "Become a Creator" },
      { href: "/help", label: "Help Center" },
      { href: "/contact", label: "Contact Support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms of Service" },
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/refunds", label: "Refund & Cancellation Policy" },
      { href: "/legal/cookies", label: "Cookie Policy" },
    ],
  },
] as const;

/** Full-width, multi-column on desktop; stacked on mobile
 * (06-design-system.md §6.9). Present on every public page. */
export function Footer() {
  return (
    <footer className="border-t border-border bg-background-subtle">
      <div className="mx-auto max-w-(--container-content-xl) px-[var(--space-200)] py-[var(--space-800)] lg:px-[var(--space-600)]">
        <div className="grid grid-cols-2 gap-[var(--space-400)] md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <p className="font-serif text-[18px] text-text-primary">Dreams by Kalakaaar</p>
            <p className="mt-2 max-w-xs text-[13px] text-text-secondary">
              A marketplace for handmade craft, connecting independent creators with people who
              value the story behind what they buy.
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-[13px] font-medium text-text-primary">{column.title}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-[13px] text-text-secondary hover:text-text-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-[var(--space-600)] text-[12px] text-text-secondary">
          © {new Date().getFullYear()} Dreams by Kalakaaar. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

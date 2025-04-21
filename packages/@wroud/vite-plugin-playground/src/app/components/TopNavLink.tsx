interface Props {
  href: string;
  children: React.ReactNode;
}
export function TopNavLink({ href, children }: Props) {
  return (
    <li className="twp:md:hidden">
      <a
        className="twp:block twp:py-1 twp:text-sm twp:text-zinc-600 twp:transition twp:hover:text-zinc-900 twp:dark:text-zinc-400 twp:dark:hover:text-white"
        href={href}
      >
        {children}
      </a>
    </li>
  );
}

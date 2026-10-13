"use client";
import NextLink from "next/link";
import {
  usePathname,
  useRouter,
  useParams as nextParams,
} from "next/navigation";
import type { ComponentProps, ReactNode } from "react";
export type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & {
  to: string;
};
export function Link({ to, ...props }: LinkProps) {
  return <NextLink href={to} {...props} />;
}
export function NavLink({
  to,
  className,
  children,
  ...props
}: Omit<LinkProps, "className"> & {
  className?: string | ((state: { isActive: boolean }) => string);
  children: ReactNode;
}) {
  const active = usePathname() === to;
  return (
    <NextLink
      href={to}
      className={
        typeof className === "function"
          ? className({ isActive: active })
          : className
      }
      aria-current={active ? "page" : undefined}
      {...props}
    >
      {children}
    </NextLink>
  );
}
export function useNavigate() {
  const router = useRouter();
  return (to: string) => router.push(to);
}
export function useLocation() {
  return { pathname: usePathname() };
}
export function useParams() {
  return nextParams<{ id: string }>();
}

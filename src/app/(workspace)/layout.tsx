import { redirect } from "next/navigation";
import { currentUser } from "../../server/auth";
import AppShell from "../../components/AppShell";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await currentUser())) redirect("/login");
  return <AppShell>{children}</AppShell>;
}

import { currentUser } from "../../../server/auth";
import AccessDeniedPage from "../../../screens/AccessDeniedPage";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (await currentUser())?.role === "admin" ? (
    children
  ) : (
    <AccessDeniedPage />
  );
}

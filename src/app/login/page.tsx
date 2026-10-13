import { redirect } from "next/navigation";
import { currentUser } from "../../server/auth";
import LoginPage from "../../screens/LoginPage";
export default async function Page() {
  if (await currentUser()) redirect("/dashboard");
  return <LoginPage />;
}

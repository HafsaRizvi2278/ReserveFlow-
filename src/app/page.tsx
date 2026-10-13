import { redirect } from "next/navigation";
import { currentUser } from "../server/auth";
export default async function Page() {
  redirect((await currentUser()) ? "/dashboard" : "/login");
}

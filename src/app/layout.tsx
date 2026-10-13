import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../index.css";
import { StoreProvider } from "./store";
export const metadata: Metadata = {
  title: "ReserveFlow",
  icons: { icon: "/favicon.svg" },
  description: "Shared resource reservation management",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}

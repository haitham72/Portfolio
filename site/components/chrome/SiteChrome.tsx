"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import FrameHUD from "./FrameHUD";
import Cursor from "./Cursor";

// Header/FrameHUD link to anchors (#selected-work, #book, ...) that only
// exist on the homepage. On the auth-flow pages those links would just be
// dead — hide the chrome there rather than ship confusing no-op nav.
const CHROMELESS_ROUTES = ["/login", "/preview"];

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const chromeless = CHROMELESS_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (chromeless) return <>{children}</>;

  return (
    <>
      <Cursor />
      <Header />
      {children}
      <FrameHUD />
    </>
  );
}

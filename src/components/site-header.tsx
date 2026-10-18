import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export function SiteHeader({ showLogout = false }: { showLogout?: boolean }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand">
          衣橱镜像
        </Link>
        <nav className="nav-links">
          <Link href="/garments">我的衣柜</Link>
          {showLogout ? <LogoutButton /> : null}
        </nav>
      </div>
    </header>
  );
}

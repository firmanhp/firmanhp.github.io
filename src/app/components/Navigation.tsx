import Link from "next/link";
import styles from "./navigation.module.css";

export default function Navigation() {
  return (
    <nav className={`${styles.nav} sticky top-0 z-50 mb-8`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <h1 className={`text-xl font-bold ${styles.title}`}>
              FirmanHP
            </h1>
          </div>
          <div className="block">
            <div className="ml-10 flex items-baseline space-x-2">
              <Link href="/" className={`px-3 py-2 text-sm font-medium ${styles.navLink}`}>Home</Link>
              <Link href="/blog" className={`px-3 py-2 text-sm font-medium ${styles.navLink}`}>Blog</Link>
              <Link href="/projects" className={`px-3 py-2 text-sm font-medium ${styles.navLink}`}>Projects</Link>
              {/* <Link href="/about" className={`px-3 py-2 text-sm font-medium ${styles.navLink}`}>About</Link> */}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
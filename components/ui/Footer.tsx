import Logo from "@/components/ui/Logo";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-black/10 dark:border-white/15 bg-white/70 dark:bg-black/20 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 py-10 text-center">
        <div className="mb-3 flex items-center justify-center">
          <Logo />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">Your journey to better fitness starts here.</p>
        <nav className="flex items-center justify-center gap-6 text-sm">
          <Link href="#" className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">Privacy Policy</Link>
          <Link href="#" className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">Terms of Service</Link>
          <Link href="#" className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">Contact</Link>
        </nav>
        <p className="text-xs text-gray-500 mt-6">© {new Date().getFullYear()} Kinisi. All rights reserved.</p>
      </div>
    </footer>
  );
}

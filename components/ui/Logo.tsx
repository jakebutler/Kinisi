import Link from "next/link";
import { Baloo_2 } from "next/font/google";

const baloo = Baloo_2({ subsets: ["latin"], weight: "600", display: "swap" });

export default function Logo() {
  return (
    <Link href="/" className={`${baloo.className} text-2xl font-semibold`} style={{ color: "var(--brand-puce)" }}>
      Kinisi
    </Link>
  );
}

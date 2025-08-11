import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import HowItWorks from "@/components/home/HowItWorks";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)]">
      <Hero />
      <Features />
      <HowItWorks />
    </div>
  );
}

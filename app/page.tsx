import BetaSignupForm from "@/components/home/BetaSignupForm";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero */}
      <section className="aura-hero">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4" style={{ color: "var(--foreground)" }}>
              Move better with Kinisi
            </h1>
            <p className="text-base sm:text-lg text-zinc-700 dark:text-zinc-300 mb-6">
              Personalized, adaptive exercise programs crafted by AI and guided by your goals and feedback.
            </p>
            <div className="flex gap-3">
              <a
                href="/login"
                className="h-11 px-6 inline-flex items-center justify-center rounded-md text-white"
                style={{ backgroundColor: "var(--brand-puce)" }}
              >
                Sign In
              </a>
              <a
                href="/access"
                className="h-11 px-6 inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
              >
                Sign Up
              </a>
            </div>
          </div>
          <div className="md:justify-self-end">
            <BetaSignupForm />
          </div>
        </div>
      </section>
    </div>
  );
}

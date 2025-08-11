import BetaSignupForm from "@/components/home/BetaSignupForm";

export default function Hero() {
  return (
    <section className="aura-hero">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6" style={{ color: "var(--foreground)" }}>
            Your Perfect Exercise Program,
            <span className="block" style={{ color: "var(--brand-puce)" }}>Personalized</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-700 dark:text-zinc-300 max-w-xl">
            Take a quick survey, get a personalized assessment, and receive a custom exercise program that fits seamlessly into your calendar.
          </p>
        </div>
        <div className="md:justify-self-end" id="beta">
          <BetaSignupForm />
        </div>
      </div>
    </section>
  );
}

export default function Features() {
  return (
    <section id="features" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12" style={{ color: "var(--foreground)" }}>
          Why Choose Kinisi?
        </h2>

        <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          <div className="rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-white/80 dark:bg-black/20 backdrop-blur border border-black/10 dark:border-white/10">
            <div className="flex items-center mb-4">
              <div className="rounded-lg p-3 mr-4" style={{ backgroundColor: "var(--brand-apricot)" }}>
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>Lightning Fast Setup</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300">Get your personalized program in minutes, not hours. Our smart algorithm creates the perfect workout plan based on your unique needs.</p>
          </div>

          <div className="rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-white/80 dark:bg-black/20 backdrop-blur border border-black/10 dark:border-white/10">
            <div className="flex items-center mb-4">
              <div className="rounded-lg p-3 mr-4" style={{ backgroundColor: "var(--brand-rose)" }}>
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>Truly Personalized</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300">Every program is tailored to your fitness level, goals, schedule, and preferences. No generic one-size-fits-all solutions.</p>
          </div>

          <div className="rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-white/80 dark:bg-black/20 backdrop-blur border border-black/10 dark:border-white/10">
            <div className="flex items-center mb-4">
              <div className="rounded-lg p-3 mr-4" style={{ backgroundColor: "var(--brand-puce)" }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>Feedback-Driven</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300">Review your assessment and provide feedback to ensure your program perfectly matches your expectations and capabilities.</p>
          </div>

          <div className="rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-white/80 dark:bg-black/20 backdrop-blur border border-black/10 dark:border-white/10">
            <div className="flex items-center mb-4">
              <div className="rounded-lg p-3 mr-4" style={{ backgroundColor: "var(--brand-ash)" }}>
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>Seamless Scheduling</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300">Automatically sync your workouts with your calendar. Never miss a session with smart reminders and flexible rescheduling.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

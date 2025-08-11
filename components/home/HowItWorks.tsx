export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white/60 dark:bg-white/5 backdrop-blur-sm py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12" style={{ color: "var(--foreground)" }}>
          How Kinisi Works
        </h2>

        <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {/* Step 1 */}
          <div className="text-center group">
            <div className="rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200" style={{ backgroundColor: "var(--brand-apricot)" }}>
              <svg className="w-10 h-10 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-3" style={{ color: "var(--foreground)" }}>Quick Survey</h3>
            <p className="text-gray-700 dark:text-gray-300">Answer a few simple questions about your fitness goals, experience level, and preferences in just 2–3 minutes.</p>
          </div>

          {/* Step 2 */}
          <div className="text-center group">
            <div className="rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200" style={{ backgroundColor: "var(--brand-rose)" }}>
              <svg className="w-10 h-10 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-3" style={{ color: "var(--foreground)" }}>Personalized Assessment</h3>
            <p className="text-gray-700 dark:text-gray-300">Get a detailed assessment of your fitness profile with recommendations you can review and provide feedback on.</p>
          </div>

          {/* Step 3 */}
          <div className="text-center group">
            <div className="rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200" style={{ backgroundColor: "var(--brand-puce)" }}>
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-3" style={{ color: "var(--foreground)" }}>Calendar Integration</h3>
            <p className="text-gray-700 dark:text-gray-300">Receive your custom exercise program and easily add it to your calendar with one‑click scheduling.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

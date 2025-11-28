import Link from "next/link";

export default function LandingPage() {
  const cards = [
    {
      title: "Superadmin Control",
      href: "/superadmin",
      description:
        "Create departments, assign profiles, and publish the knowledge that powers every user chat.",
      badge: "Admin hub",
    },
    {
      title: "User Workspace",
      href: "/user",
      description:
        "Log in as a teammate, browse curated playbooks, and ask questions with role-aware replies.",
      badge: "User view",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-16">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1 text-xs font-semibold text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Live onboarding assistant
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold">
            Choose your Onbuddy workspace
          </h1>
          <p className="text-slate-300 max-w-3xl mx-auto text-lg">
            Jump into the tailored view for superadmins or teammates. Both experiences share the same local data, so changes in
            one panel are immediately reflected in the other.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl transition hover:-translate-y-1 hover:border-emerald-300/60 hover:shadow-emerald-400/20"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-300">
                  {card.badge}
                </span>
                <svg
                  className="h-6 w-6 text-emerald-300 transition group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0-6.75-6.75M19.5 12l-6.75 6.75" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-semibold">{card.title}</h2>
              <p className="mt-2 text-slate-300 leading-relaxed">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

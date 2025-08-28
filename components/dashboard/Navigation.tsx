import React from "react";
import Link from "next/link";

export default function Navigation({ programId }: { programId?: string | null }) {
  const tiles = [
    {
      title1: "Intake",
      title2: "Survey",
      href: "/survey",
    },
    {
      title1: "Personalized",
      title2: "Assessment",
      href: "/assessment",
    },
    {
      title1: "Exercise Program",
      title2: "+ Schedule",
      href: programId ? `/program/${programId}/calendar` : undefined,
    },
  ];

  return (
    <div className="w-full flex justify-between items-stretch gap-3" aria-label="Primary navigation">
      {tiles.map((t, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-3 flex-1 text-center hover:shadow-lg transition-shadow">
          {t.href ? (
            <Link
              className="w-full h-full flex flex-col justify-center items-center text-sm font-medium text-gray-700 hover:text-[var(--brand-puce)] transition-colors"
              href={t.href}
            >
              <span>{t.title1}</span>
              <span>{t.title2}</span>
            </Link>
          ) : (
            <button
              className="w-full h-full flex flex-col justify-center items-center text-sm font-medium text-gray-400 cursor-not-allowed"
              disabled
              title="Program not available yet"
            >
              <span>{t.title1}</span>
              <span>{t.title2}</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

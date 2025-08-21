/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { createSupabaseServerClient } from "@/utils/supabaseServer";
import { getProgramById } from "@/utils/programDataHelpers";
import ProgramCalendar from "@/components/program/ProgramCalendar";
import { redirect } from "next/navigation";

export default async function ProgramCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Program Calendar</h1>
        <p className="text-red-600">Missing program id.</p>
        <div className="mt-4"><Link href="/dashboard" className="text-[var(--brand-puce)] underline">Back to dashboard</Link></div>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let program: any = null;
  try {
    program = await getProgramById(id, supabase);
  } catch {
    // ignore
  }
  if (!program) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Program Calendar</h1>
        <p className="text-gray-700">Program not found.</p>
        <div className="mt-4"><Link href="/dashboard" className="text-[var(--brand-puce)] underline">Back to dashboard</Link></div>
      </div>
    );
  }

  const programJson = program.program_json || {};

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Program Calendar</h1>
        <div className="flex items-center gap-2">
          <Link href={`/program/${id}`} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">Back to Program</Link>
          <Link href="/dashboard" className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">Dashboard</Link>
        </div>
      </div>
      <ProgramCalendar program={programJson} programId={id} />
    </div>
  );
}

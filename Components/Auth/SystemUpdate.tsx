import CardShell from "../ui/CardShell";

const UPDATES = [
  { date: "2026-02-05", text: "Stability improvements deployed. Monitoring looks healthy." },
  { date: "2026-02-03", text: "Scheduled maintenance completed successfully." },
  { date: "2026-01-30", text: "New regions supported. Documentation updated." },
  { date: "2026-01-25", text: "Support channels refreshed. See Help Center for details." },
];

export default function SystemUpdate() {
  return (
    <CardShell
      title="System updates"
      subtitle="Recent announcements and operational status."
    >
      <div className="space-y-5 max-h-[520px] overflow-y-auto pr-2">
        {UPDATES.map((u, i) => (
          <div key={i} className="group">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-cyan-200/90 bg-cyan-500/10 border border-cyan-400/20 px-2 py-0.5 rounded-full">
                {u.date}
              </span>
              <div className="h-px bg-white/10 flex-1 group-hover:bg-cyan-400/30 transition-colors" />
            </div>
            <p className="mt-2 text-sm text-slate-300 group-hover:text-white transition-colors">
              {u.text}
            </p>
          </div>
        ))}

        <div className="pt-6 mt-6 border-t border-white/10">
          <h3 className="text-sm font-semibold text-white">Policies</h3>
          <ul className="mt-3 text-xs text-slate-400 space-y-2 list-disc pl-5">
            <li>Accounts may be temporarily locked after repeated failed logins.</li>
            <li>Security events are logged for abuse prevention and auditing.</li>
            <li>Use strong passwords and enable multi-factor authentication.</li>
          </ul>
        </div>
      </div>
    </CardShell>
  );
}

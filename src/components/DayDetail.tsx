import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface DayStats {
  doors: number;
  conversations: number;
  leads: number;
  appointments: number;
  wins: number;
}

interface DayDetailProps {
  date: string;
  stats: DayStats;
  open: boolean;
  onClose: () => void;
  onUpdate: (date: string, stats: DayStats) => void;
  onReset: (date: string) => void;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

const FUNNEL = [
  { key: "doors" as const, label: "Doors Knocked", icon: "🚪" },
  { key: "conversations" as const, label: "Conversations", icon: "💬" },
  { key: "leads" as const, label: "Leads", icon: "📋" },
  { key: "appointments" as const, label: "Appointments", icon: "📅" },
  { key: "wins" as const, label: "Wins", icon: "🏆" },
];

function getNote(stats: DayStats): string {
  if (stats.doors === 0) return "No activity logged this day.";
  const convRate = stats.doors > 0 ? (stats.conversations / stats.doors) * 100 : 0;
  const winRate = stats.leads > 0 ? (stats.wins / stats.leads) * 100 : 0;

  if (stats.wins >= 3) return "Outstanding day. Multiple closes.";
  if (winRate > 40 && stats.leads >= 2) return "High close rate. Quality conversations.";
  if (convRate > 50) return "Great engagement. Over half your doors turned into conversations.";
  if (stats.doors >= 40) return "Massive volume day. Grinding hard.";
  if (stats.doors >= 25) return "Solid effort. Above-average volume.";
  if (convRate < 20 && stats.doors > 10) return "Low conversion. Consider adjusting your pitch.";
  return "Standard day. Keep building momentum.";
}

export default function DayDetail({ date, stats, open, onClose, onUpdate, onReset }: DayDetailProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DayStats>(stats);

  const maxVal = useMemo(() => Math.max(stats.doors, 1), [stats.doors]);
  const note = useMemo(() => getNote(stats), [stats]);

  const convRate = stats.doors > 0 ? ((stats.conversations / stats.doors) * 100).toFixed(0) : "—";
  const closeRate = stats.leads > 0 ? ((stats.wins / stats.leads) * 100).toFixed(0) : "—";

  const handleStartEdit = () => {
    setDraft({ ...stats });
    setEditing(true);
  };

  const handleSave = () => {
    onUpdate(date, draft);
    setEditing(false);
  };

  const handleReset = () => {
    onReset(date);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(false); onClose(); } }}>
      <DialogContent className="max-w-md border-2 border-foreground bg-card p-0 gap-0">
        <DialogHeader className="px-5 py-3 border-b-2 border-foreground">
          <DialogTitle className="text-sm font-bold uppercase tracking-tight">
            {formatDate(date)}
          </DialogTitle>
          <DialogDescription className="text-xs font-mono text-muted-foreground">
            {editing ? "Edit your numbers" : "Daily performance breakdown"}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4">
          {editing ? (
            <div className="space-y-3">
              {FUNNEL.map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <span className="text-sm w-5 text-center">{item.icon}</span>
                  <span className="text-xs font-mono text-muted-foreground w-28 shrink-0">{item.label}</span>
                  <input
                    type="number"
                    min={0}
                    value={draft[item.key]}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [item.key]: Math.max(0, parseInt(e.target.value) || 0) }))}
                    className="flex-1 h-8 px-2 bg-muted border border-foreground/20 text-sm font-mono font-bold tabular-nums text-right focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {FUNNEL.map((item) => {
                  const val = stats[item.key];
                  const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                  return (
                    <div key={item.key} className="flex items-center gap-3">
                      <span className="text-sm w-5 text-center">{item.icon}</span>
                      <span className="text-xs font-mono text-muted-foreground w-28 shrink-0">{item.label}</span>
                      <div className="flex-1 h-4 bg-muted overflow-hidden relative">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: val > 0 ? "var(--heatmap-4)" : "transparent",
                          }}
                        />
                      </div>
                      <span className="text-sm font-mono font-bold tabular-nums w-8 text-right">{val}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 pt-1">
                <div className="flex-1 bg-muted px-3 py-2">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Conv Rate</div>
                  <div className="text-lg font-bold font-mono tabular-nums">{convRate}%</div>
                </div>
                <div className="flex-1 bg-muted px-3 py-2">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Close Rate</div>
                  <div className="text-lg font-bold font-mono tabular-nums">{closeRate}%</div>
                </div>
              </div>

              <div className="pt-1">
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Notes</div>
                <p className="text-sm font-mono text-foreground">{note}</p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-foreground/10">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleStartEdit}
                  className="flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                  ✏️ Edit Day
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-muted text-destructive hover:bg-destructive/10 transition-colors"
                >
                  🗑 Reset Day
                </button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
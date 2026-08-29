import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

// generic add/edit/delete/reorder list editor, used for experience, education,
// skills groups, certifications etc so we're not rebuilding this 4 times.
// fields: [{ key, label, type: 'text' | 'textarea' | 'list' }] — 'list' is
// stored as a string array but edited as a comma-separated input
export default function RepeatableFieldEditor({ items = [], fields, onChange, addLabel = "Add entry", emptyItem }) {
  const update = (i, key, value) => {
    const next = items.map((it, idx) => (idx === i ? { ...it, [key]: value } : it));
    onChange(next);
  };

  const add = () => onChange([...items, emptyItem()]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <AnimatePresence initial={false}>
        {items.map((item, i) => (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="rounded-xl border border-ink/10 bg-white/60 p-4 mb-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-ink/40">
                #{i + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-1 rounded text-ink/40 hover:text-signal disabled:opacity-20 transition-colors"
                  title="Move up"
                >
                  <ChevronUp size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  className="p-1 rounded text-ink/40 hover:text-signal disabled:opacity-20 transition-colors"
                  title="Move down"
                >
                  <ChevronDown size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="p-1 rounded text-red-400 hover:text-red-600 transition-colors"
                  title="Remove"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {fields.map((f) => (
                <label
                  key={f.key}
                  className={`text-sm ${f.type === "textarea" || f.type === "list" ? "sm:col-span-2" : ""}`}
                >
                  <span className="block text-ink/50 mb-1">{f.label}</span>
                  {f.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={item[f.key] || ""}
                      onChange={(e) => update(i, f.key, e.target.value)}
                      className="focus-ring w-full rounded-lg border border-ink/15 bg-white/80 px-3 py-2"
                    />
                  ) : f.type === "list" ? (
                    <input
                      value={(item[f.key] || []).join(", ")}
                      onChange={(e) =>
                        update(
                          i,
                          f.key,
                          e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      placeholder="Comma separated"
                      className="focus-ring w-full rounded-lg border border-ink/15 bg-white/80 px-3 py-2"
                    />
                  ) : (
                    <input
                      value={item[f.key] || ""}
                      onChange={(e) => update(i, f.key, e.target.value)}
                      className="focus-ring w-full rounded-lg border border-ink/15 bg-white/80 px-3 py-2"
                    />
                  )}
                </label>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-signal hover:underline"
      >
        <Plus size={15} /> {addLabel}
      </button>
    </div>
  );
}

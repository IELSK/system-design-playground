import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { ArchitectureSummary } from "../types/architecture";

export default function MyArchitecturesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ArchitectureSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    try {
      const res = await api.get<{ architectures: ArchitectureSummary[] }>(
        "/architectures",
      );
      setItems(res.data.architectures);
      setError(null);
    } catch {
      setError("Failed to load architectures");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this architecture? This cannot be undone.")) return;
    try {
      await api.delete(`/architectures/${id}`);
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("Failed to delete");
    }
  }

  async function togglePublic(arch: ArchitectureSummary) {
    try {
      const res = await api.patch<{ architecture: ArchitectureSummary }>(
        `/architectures/${arch.id}`,
        { isPublic: !arch.isPublic },
      );
      setItems((prev) =>
        prev.map((a) =>
          a.id === arch.id
            ? { ...a, isPublic: res.data.architecture.isPublic }
            : a,
        ),
      );
    } catch {
      alert("Failed to update");
    }
  }

  function copyShareLink(id: string) {
    const url = `${window.location.origin}/a/${id}`;
    navigator.clipboard.writeText(url);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">My Architectures</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your saved system designs
            </p>
          </div>
          <Link
            to="/"
            className="px-3 py-1.5 text-xs font-semibold rounded bg-indigo-600 text-white hover:bg-indigo-500"
          >
            ← Editor
          </Link>
        </div>

        {loading && (
          <p className="text-sm text-gray-500 italic">Loading...</p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {!loading && items.length === 0 && (
          <div className="border border-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-sm mb-3">
              No saved architectures yet.
            </p>
            <Link
              to="/"
              className="text-indigo-400 hover:text-indigo-300 text-sm"
            >
              Create your first one →
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((arch) => (
            <div
              key={arch.id}
              className="border border-gray-800 rounded-lg p-4 bg-gray-900/50 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-100 truncate">
                  {arch.name}
                </h3>
                {arch.isPublic && (
                  <span className="shrink-0 px-1.5 py-0.5 text-[9px] uppercase tracking-wide rounded bg-emerald-900/40 text-emerald-400 border border-emerald-800/60">
                    Public
                  </span>
                )}
              </div>

              {arch.description && (
                <p className="text-[11px] text-gray-500 line-clamp-2">
                  {arch.description}
                </p>
              )}

              <p className="text-[10px] text-gray-600 mt-auto">
                Updated {new Date(arch.updatedAt).toLocaleString()}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-800">
                <button
                  onClick={() => navigate(`/?id=${arch.id}`)}
                  className="px-2 py-1 text-[11px] rounded bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  Open
                </button>
                <button
                  onClick={() => togglePublic(arch)}
                  className="px-2 py-1 text-[11px] rounded border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
                >
                  {arch.isPublic ? "Make private" : "Make public"}
                </button>
                {arch.isPublic && (
                  <button
                    onClick={() => copyShareLink(arch.id)}
                    className="px-2 py-1 text-[11px] rounded border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
                  >
                    Copy link
                  </button>
                )}
                <button
                  onClick={() => handleDelete(arch.id)}
                  className="ml-auto px-2 py-1 text-[11px] rounded border border-red-900/60 bg-red-900/20 text-red-400 hover:bg-red-900/40"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

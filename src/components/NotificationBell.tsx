import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";

interface Notif {
  id: number;
  titre: string;
  message: string;
  is_read: boolean;
  match_id: number | null;
  created_at: string;
}

interface Props {
  onMatchClick?: (match_id: number) => void;
}

export default function NotificationBell({ onMatchClick }: Props) {
  const [count, setCount] = useState(0);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Polling toutes les 3 secondes
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fermer au clic dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchCount = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setCount(res.data.count);
    } catch {}
  };

  const fetchNotifs = async () => {
    try {
      const res = await api.get("/notifications/");
      setNotifs(res.data);
    } catch {}
  };

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open) await fetchNotifs();
  };

  const markRead = async (id: number, match_id: number | null) => {
    await api.post(`/notifications/${id}/read`);
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    fetchCount();
    if (match_id && onMatchClick) {
      onMatchClick(match_id);
      setOpen(false);
    }
  };

  const markAllRead = async () => {
    await api.post("/notifications/read-all");
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setCount(0);
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="relative w-9 h-9"
        onClick={handleOpen}
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-card border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <span className="text-sm font-semibold">Notifications</span>
            {count > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:underline"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto divide-y">
            {notifs.length === 0 ? (
              <li className="py-8 text-center text-sm text-muted-foreground">
                Aucune notification
              </li>
            ) : (
              notifs.map((n) => (
                <li
                  key={n.id}
                  onClick={() => markRead(n.id, n.match_id)}
                  className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    !n.is_read ? "bg-primary/5" : ""
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      !n.is_read ? "bg-primary" : "bg-transparent"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.titre}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

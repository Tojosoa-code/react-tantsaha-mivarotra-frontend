import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Badge } from "@/components/ui/badge";
import NegociationChat from "@/components/NegociationChat";
import {
  MessageCircle,
  Package,
  Clock,
  CheckCircle2,
  Heart,
  Loader2,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface Conversation {
  match_id: number;
  match_statut: string;
  product_name: string;
  product_unite: string;
  contact_nom: string;
  contact_telephone?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  score: number;
}

function statutIcon(statut: string) {
  switch (statut) {
    case "interested":
      return <Heart className="w-3.5 h-3.5 text-blue-500" />;
    case "negotiating":
      return <MessageCircle className="w-3.5 h-3.5 text-violet-500" />;
    case "done":
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    default:
      return <Sparkles className="w-3.5 h-3.5 text-primary" />;
  }
}

function statutLabel(statut: string) {
  switch (statut) {
    case "interested":
      return "Intérêt exprimé";
    case "negotiating":
      return "Négociation en cours";
    case "done":
      return "Accord conclu";
    default:
      return "Nouveau contact";
  }
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export default function NegociationsPanel({ user }: { user: any }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);

  useEffect(() => {
    if (user) fetchConversations();
    const interval = setInterval(() => {
      if (user) fetchConversations();
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/matches/conversations");
      setConversations(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (loading && conversations.length === 0)
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );

  if (conversations.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="font-semibold text-sm">Aucune négociation en cours</p>
        <p className="text-xs text-muted-foreground mt-2 max-w-xs">
          Explorez les suggestions ou le marketplace et cliquez sur "Négocier"
          pour démarrer une transaction.
        </p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">
            {conversations.length} négociation
            {conversations.length > 1 ? "s" : ""}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Suivez et gérez toutes vos transactions en cours
          </p>
        </div>
        <Badge className="text-xs bg-violet-50 text-violet-600 border-violet-200">
          {conversations.filter((c) => c.unread_count > 0).length} non lue
          {conversations.filter((c) => c.unread_count > 0).length > 1
            ? "s"
            : ""}
        </Badge>
      </div>

      <div className="space-y-2">
        {conversations.map((conv) => (
          <div
            key={conv.match_id}
            onClick={() => setActiveChat(conv)}
            className={`group flex items-center gap-3 p-4 bg-card border rounded-xl cursor-pointer hover:border-primary/30 hover:shadow-md transition-all duration-200 ${
              conv.unread_count > 0 ? "border-primary/20 bg-primary/5" : ""
            }`}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-semibold text-base">
                {conv.contact_nom[0]}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-card rounded-full flex items-center justify-center border">
                {statutIcon(conv.match_statut)}
              </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <p className="text-sm font-semibold truncate">
                  {conv.contact_nom}
                </p>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  {timeAgo(conv.last_message_at)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <Package className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {conv.product_name}
                </span>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="text-[10px] text-muted-foreground">
                  {statutLabel(conv.match_statut)}
                </span>
              </div>
              {conv.last_message ? (
                <p className="text-xs text-muted-foreground truncate">
                  {conv.last_message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Démarrez la négociation →
                </p>
              )}
            </div>

            {/* Right */}
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              {conv.unread_count > 0 && (
                <span className="w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {conv.unread_count}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {/* Chat ouvert */}
      <NegociationChat
        open={!!activeChat}
        onClose={() => {
          setActiveChat(null);
          fetchConversations();
        }}
        matchId={activeChat?.match_id ?? null}
        contactNom={activeChat?.contact_nom ?? ""}
        productName={activeChat?.product_name ?? ""}
        productUnite={activeChat?.product_unite}
        contactTelephone={activeChat?.contact_telephone}
        matchStatut={activeChat?.match_statut}
      />
    </div>
  );
}

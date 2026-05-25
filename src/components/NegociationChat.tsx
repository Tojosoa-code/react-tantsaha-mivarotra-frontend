import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/axios";
import {
  Send,
  Loader2,
  Banknote,
  Scale,
  Calendar,
  CheckCircle2,
  MessageCircle,
  Handshake,
  Phone,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

interface Message {
  id: number;
  sender_nom: string;
  content: string;
  is_me: boolean;
  created_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  matchId: number | null;
  contactNom: string;
  productName: string;
  productUnite?: string;
  contactTelephone?: string;
  matchStatut?: string;
}

const QUICK_PROPOSALS = [
  {
    icon: Banknote,
    label: "Proposer un prix",
    template: (u: string) =>
      `Je vous propose un prix de _____ Ar/${u} pour ce produit.`,
  },
  {
    icon: Scale,
    label: "Proposer une quantité",
    template: (u: string) => `Je suis intéressé par _____ ${u} de ce produit.`,
  },
  {
    icon: Calendar,
    label: "Proposer une date",
    template: () => `Je souhaite finaliser cette transaction avant le _____.`,
  },
  {
    icon: Handshake,
    label: "Faire une offre globale",
    template: (u: string) =>
      `Je propose _____ ${u} à _____ Ar/${u}, livraison avant le _____. Êtes-vous disponible ?`,
  },
];

function statutLabel(statut?: string) {
  switch (statut) {
    case "interested":
      return {
        label: "Contact établi",
        color: "bg-blue-50 text-blue-600 border-blue-200",
      };
    case "negotiating":
      return {
        label: "Négociation en cours",
        color: "bg-violet-50 text-violet-600 border-violet-200",
      };
    case "done":
      return {
        label: "Accord conclu ✓",
        color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      };
    default:
      return {
        label: "Nouvelle conversation",
        color: "bg-primary/10 text-primary border-primary/20",
      };
  }
}

export default function NegociationChat({
  open,
  onClose,
  matchId,
  contactNom,
  productName,
  productUnite = "kg",
  contactTelephone,
  matchStatut,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showProposals, setShowProposals] = useState(true);
  const [currentStatut, setCurrentStatut] = useState(matchStatut);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !matchId) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [open, matchId]);

  useEffect(() => {
    setCurrentStatut(matchStatut);
  }, [matchStatut]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    if (!matchId) return;
    try {
      const res = await api.get(`/messages/${matchId}`);
      setMessages(res.data);
      if (res.data.length > 0) setCurrentStatut("negotiating");
    } catch {}
  };

  const sendMessage = async (content?: string) => {
    const text = (content ?? input).trim();
    if (!text || !matchId) return;
    setSending(true);
    try {
      const res = await api.post(`/messages/${matchId}`, { content: text });
      setMessages((prev) => [...prev, res.data]);
      setInput("");
      setCurrentStatut("negotiating");
    } catch {
      toast.error("Message non envoyé, veuillez réessayer");
    } finally {
      setSending(false);
    }
  };

  const handleQuickProposal = (template: (u: string) => string) => {
    setInput(template(productUnite));
    setShowProposals(false);
  };

  const handleConfirmDeal = async () => {
    if (!matchId) return;
    try {
      await api.post(`/messages/${matchId}`, {
        content: `✅ Accord conclu ! Je confirme notre transaction pour ${productName}. Merci de votre confiance.`,
      });
      await fetchMessages();
      setCurrentStatut("done");
      toast.success("Accord confirmé ! La transaction est enregistrée.");
    } catch {
      toast.error("Erreur lors de la confirmation");
    }
  };

  const statut = statutLabel(currentStatut);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md flex flex-col"
        style={{ height: "600px" }}
      >
        {/* Header */}
        <DialogHeader className="pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold text-sm flex-shrink-0">
                {contactNom[0]}
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold leading-tight">
                  {contactNom}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0">
                  Négociation · {productName}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {contactTelephone && (
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => window.open(`tel:${contactTelephone}`)}
                >
                  <Phone className="w-3.5 h-3.5" />
                </Button>
              )}
              <Badge className={`text-[10px] border ${statut.color}`}>
                {statut.label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 min-h-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Démarrez la négociation</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Utilisez les propositions rapides ci-dessous pour envoyer une
                  offre structurée à {contactNom}.
                </p>
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.is_me ? "justify-end" : "justify-start"} px-1`}
              >
                {!m.is_me && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary text-xs font-semibold mr-2 flex-shrink-0 mt-auto mb-1">
                    {contactNom[0]}
                  </div>
                )}
                <div
                  className={`max-w-[78%] ${m.is_me ? "items-end" : "items-start"} flex flex-col gap-1`}
                >
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.is_me
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1">
                    {new Date(m.created_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Propositions rapides */}
        <div className="flex-shrink-0 border-t pt-3 space-y-3">
          <button
            onClick={() => setShowProposals((v) => !v)}
            className="flex items-center gap-2 text-xs text-primary font-medium w-full hover:opacity-80 transition-opacity"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Propositions rapides
            {showProposals ? (
              <ChevronUp className="w-3 h-3 ml-auto" />
            ) : (
              <ChevronDown className="w-3 h-3 ml-auto" />
            )}
          </button>

          {showProposals && (
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_PROPOSALS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickProposal(p.template)}
                  className="flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-medium bg-muted/60 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 rounded-lg transition-all text-left"
                >
                  <p.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Votre proposition..."
              className="flex-1 text-sm h-9"
              disabled={sending}
            />
            <Button
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              onClick={() => sendMessage()}
              disabled={sending || !input.trim()}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Confirmer accord */}
          {currentStatut === "negotiating" && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              onClick={handleConfirmDeal}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Confirmer l'accord — transaction conclue
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
  MessageCircle,
  Phone,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShoppingCart,
  Info,
} from "lucide-react";
import CheckoutDialog from "@/components/CheckoutDialog";

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
  // Pour le checkout — nécessaire si acheteur veut commander
  offerId?: number;
  offerPrixUnitaire?: number;
  offerQuantite?: number;
  offerQuantiteRestante?: number;
  producteurNom?: string;
  producteurRegion?: string;
  isAcheteur?: boolean;
}

const QUICK_PROPOSALS = [
  {
    icon: Banknote,
    label: "Proposer un prix",
    template: (u: string) =>
      `Je vous propose _____ Ar/${u} pour ce produit. Est-ce que ce prix vous convient ?`,
  },
  {
    icon: Scale,
    label: "Proposer une quantité",
    template: (u: string) =>
      `Je suis intéressé par _____ ${u}. Pouvez-vous fournir cette quantité ?`,
  },
  {
    icon: Calendar,
    label: "Proposer une date",
    template: () =>
      `Je souhaite finaliser cette transaction avant le _____. Êtes-vous disponible ?`,
  },
  {
    icon: Banknote,
    label: "Offre globale",
    template: (u: string) =>
      `Je propose _____ ${u} à _____ Ar/${u}, disponible avant le _____. Nous pouvons nous retrouver à _____. Confirmez-vous ?`,
  },
];

function statutConfig(statut?: string) {
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
        label: "Accord conclu",
        color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      };
    default:
      return {
        label: "Nouveau contact",
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
  offerId,
  offerPrixUnitaire,
  offerQuantite,
  offerQuantiteRestante,
  producteurNom,
  producteurRegion,
  isAcheteur = false,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showProposals, setShowProposals] = useState(true);
  const [currentStatut, setCurrentStatut] = useState(matchStatut);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
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

  const statut = statutConfig(currentStatut);

  // Offre pour checkout
  const checkoutOffer = offerId
    ? {
        id: offerId,
        product_name: productName,
        product_unite: productUnite,
        quantite: offerQuantite ?? 0,
        quantite_restante: offerQuantiteRestante,
        prix_unitaire: offerPrixUnitaire ?? 0,
        producteur_nom: producteurNom ?? contactNom,
        producteur_telephone: contactTelephone,
        producteur_region: producteurRegion ?? "",
      }
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          className="w-[80vw] max-w-[80vw] flex flex-col p-0 gap-0"
          style={{ height: "85vh" }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold text-base flex-shrink-0 shadow-sm">
                {contactNom[0]}
              </div>
              <div>
                <DialogTitle className="text-base font-semibold leading-tight">
                  {contactNom}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5 flex items-center gap-2">
                  <span>{productName}</span>
                  <Badge
                    className={`text-[10px] border px-1.5 py-0 ${statut.color}`}
                  >
                    {statut.label}
                  </Badge>
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {contactTelephone && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs h-8"
                  onClick={() => window.open(`tel:${contactTelephone}`)}
                >
                  <Phone className="w-3.5 h-3.5" />
                  {contactTelephone}
                </Button>
              )}
            </div>
          </div>

          {/* ── Info acheteur ── */}
          {isAcheteur && checkoutOffer && (
            <div className="flex items-center gap-2.5 px-6 py-2.5 bg-blue-50 border-b border-blue-100 flex-shrink-0">
              <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Vous négociez les conditions. Quand vous êtes d'accord, utilisez
                le bouton{" "}
                <span className="font-semibold">"Passer ma commande"</span>{" "}
                ci-dessous pour officialiser l'achat.
              </p>
            </div>
          )}

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Démarrez la négociation</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Utilisez les propositions rapides ci-dessous pour envoyer
                    une offre structurée à {contactNom}.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.is_me ? "justify-end" : "justify-start"}`}
                >
                  {!m.is_me && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary text-sm font-semibold mr-2 flex-shrink-0 mt-auto mb-1">
                      {contactNom[0]}
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] flex flex-col gap-1 ${m.is_me ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
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

          {/* ── Footer ── */}
          <div className="border-t bg-card flex-shrink-0">
            {/* Propositions rapides */}
            <div className="px-6 pt-3 pb-2">
              <button
                onClick={() => setShowProposals((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-primary font-medium hover:opacity-80 transition-opacity"
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
                <div className="grid grid-cols-2 gap-2 mt-2.5">
                  {QUICK_PROPOSALS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickProposal(p.template)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-muted/60 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 rounded-lg transition-all text-left"
                    >
                      <p.icon className="w-3.5 h-3.5 flex-shrink-0" />
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input message */}
            <div className="flex gap-2 px-6 pb-3">
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
                className="flex-1 h-10"
                disabled={sending}
              />
              <Button
                size="icon"
                className="h-10 w-10 flex-shrink-0"
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

            {/* Bouton commander — ACHETEUR SEULEMENT */}
            {isAcheteur && checkoutOffer && (
              <div className="px-6 pb-4">
                <Button
                  className="w-full gap-2 h-11 bg-gradient-to-r from-primary to-primary/80 shadow-sm"
                  onClick={() => setCheckoutOpen(true)}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Passer ma commande suite à cette négociation
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout depuis le chat */}
      {checkoutOffer && (
        <CheckoutDialog
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          offer={checkoutOffer}
          onSuccess={() => {
            setCheckoutOpen(false);
            toast.success(
              "Commande envoyée ! Le producteur va confirmer sous 24h.",
            );
          }}
        />
      )}
    </>
  );
}

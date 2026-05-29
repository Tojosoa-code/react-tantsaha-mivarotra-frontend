import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Handshake,
  CheckCircle2,
  XCircle,
  Package,
  Info,
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
  offerId?: number;
  offerPrixUnitaire?: number;
  offerQuantite?: number;
  offerQuantiteRestante?: number;
  demandQuantite?: number;
  producteurNom?: string;
  producteurRegion?: string;
  isAcheteur?: boolean;
  onAccordAccepte?: () => void;
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
    case "accord_propose":
      return {
        label: "Accord proposé — En attente",
        color: "bg-amber-50 text-amber-600 border-amber-200",
      };
    case "accord_accepte":
      return {
        label: "Accord accepté ✓",
        color: "bg-emerald-50 text-emerald-600 border-emerald-200",
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

function isAccordMessage(content: string) {
  return (
    content.includes("PROPOSITION D'ACCORD") ||
    content.includes("ACCORD ACCEPTÉ") ||
    (content.startsWith("❌") && content.includes("refuse")) ||
    (content.startsWith("✅") && content.includes("J'accepte"))
  );
}

function AccordCard({ content }: { content: string; isMe: boolean }) {
  const isProposition = content.includes("PROPOSITION D'ACCORD");
  const isAccepte =
    content.includes("ACCORD ACCEPTÉ") ||
    (content.startsWith("✅") && content.includes("J'accepte"));
  const isRefuse = content.startsWith("❌");

  const bg = isProposition
    ? "bg-amber-50 border-amber-200"
    : isAccepte
      ? "bg-emerald-50 border-emerald-200"
      : "bg-red-50 border-red-200";

  const headerColor = isProposition
    ? "text-amber-700"
    : isAccepte
      ? "text-emerald-700"
      : "text-red-700";

  const lines = content.split("\n").filter((l) => l.trim());
  const bullets = lines.filter((l) => l.startsWith("•"));
  const headerLine = lines.find(
    (l) =>
      l.includes("PROPOSITION D'ACCORD") ||
      l.includes("ACCORD ACCEPTÉ") ||
      l.startsWith("✅") ||
      l.startsWith("❌"),
  );

  return (
    <div className={`border rounded-xl overflow-hidden text-xs max-w-xs ${bg}`}>
      <div
        className={`px-3 py-2 font-semibold flex items-center gap-1.5 ${headerColor}`}
      >
        {isProposition && <Handshake className="w-3.5 h-3.5" />}
        {isAccepte && <CheckCircle2 className="w-3.5 h-3.5" />}
        {isRefuse && <XCircle className="w-3.5 h-3.5" />}
        {headerLine ?? "Accord"}
      </div>
      {bullets.length > 0 && (
        <div className="px-3 pb-3 space-y-1">
          {bullets.map((b, i) => {
            const [key, ...rest] = b.replace("•", "").split(":");
            const val = rest.join(":").trim();
            return (
              <div key={i} className="flex justify-between gap-3">
                <span className="text-muted-foreground">{key.trim()}</span>
                <span className="font-medium text-right">{val}</span>
              </div>
            );
          })}
        </div>
      )}
      {lines
        .filter(
          (l) =>
            !l.startsWith("•") &&
            !l.includes("━") &&
            l !== headerLine &&
            l.trim(),
        )
        .map((l, i) => (
          <p key={i} className="px-3 pb-2 text-muted-foreground italic">
            {l}
          </p>
        ))}
    </div>
  );
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
  demandQuantite,
  isAcheteur = false,
  onAccordAccepte,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showProposals, setShowProposals] = useState(true);
  const [currentStatut, setCurrentStatut] = useState(matchStatut);

  // Mini-formulaire accord
  const [showAccordForm, setShowAccordForm] = useState(false);
  const [accordQte, setAccordQte] = useState("");
  const [accordPrix, setAccordPrix] = useState("");

  // Refus producteur
  const [showRefusInput, setShowRefusInput] = useState(false);
  const [raisonRefus, setRaisonRefus] = useState("");
  const [actionLoading, setActionLoading] = useState<
    "accept" | "refuse" | null
  >(null);

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

  // Pré-remplir le formulaire avec les valeurs de l'offre quand on l'ouvre
  useEffect(() => {
    if (showAccordForm) {
      setAccordQte(
        String(demandQuantite ?? offerQuantiteRestante ?? offerQuantite ?? ""),
      );
      setAccordPrix(String(offerPrixUnitaire ?? ""));
    }
  }, [showAccordForm]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    if (!matchId) return;
    try {
      const res = await api.get(`/messages/${matchId}`);
      setMessages(res.data);
      if (res.data.length > 0 && currentStatut === "interested")
        setCurrentStatut("negotiating");
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
      if (currentStatut === "interested") setCurrentStatut("negotiating");
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

  const handleProposeAccord = async () => {
    if (!matchId) return;
    const qte = parseFloat(accordQte);
    const prix = parseFloat(accordPrix);
    if (!qte || qte <= 0) return toast.error("Quantité invalide");
    if (!prix || prix <= 0) return toast.error("Prix invalide");

    setActionLoading("accept");
    try {
      await api.post(`/matches/${matchId}/propose-accord`, {
        quantite: qte,
        prix_unitaire: prix,
      });
      setCurrentStatut("accord_propose");
      setShowAccordForm(false);
      await fetchMessages();
      toast.success("Proposition d'accord envoyée !");
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Erreur lors de la proposition");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptAccord = async () => {
    if (!matchId) return;
    setActionLoading("accept");
    try {
      await api.post(`/matches/${matchId}/accept-accord`);
      setCurrentStatut("accord_accepte");
      await fetchMessages();
      onAccordAccepte?.();
      toast.success(
        "Accord accepté ! La commande a été créée automatiquement.",
      );
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefuseAccord = async () => {
    if (!matchId) return;
    setActionLoading("refuse");
    try {
      await api.post(`/matches/${matchId}/refuse-accord`, {
        raison: raisonRefus.trim() || null,
      });
      setCurrentStatut("negotiating");
      setShowRefusInput(false);
      setRaisonRefus("");
      await fetchMessages();
      toast.info("Proposition refusée. L'acheteur peut en faire une nouvelle.");
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const statut = statutConfig(currentStatut);
  const canProposeAccord =
    isAcheteur &&
    (currentStatut === "negotiating" || currentStatut === "interested") &&
    offerId;
  const canAcceptOrRefuse = !isAcheteur && currentStatut === "accord_propose";

  // Calcul total en temps réel dans le formulaire
  const totalAccord =
    parseFloat(accordQte) > 0 && parseFloat(accordPrix) > 0
      ? parseFloat(accordQte) * parseFloat(accordPrix)
      : null;

  return (
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

        {/* ── Bandeau contexte offre (acheteur) ── */}
        {isAcheteur && offerId && (
          <div className="flex items-start gap-2.5 px-6 py-2.5 bg-blue-50 border-b border-blue-100 flex-shrink-0">
            <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Vous négociez avec{" "}
              <span className="font-semibold">{contactNom}</span> pour{" "}
              <span className="font-semibold">{productName}</span> —{" "}
              {offerPrixUnitaire?.toLocaleString("fr-FR")} Ar/{productUnite},
              stock {offerQuantiteRestante ?? offerQuantite} {productUnite}.
              Discutez des conditions puis proposez un accord formel.
            </p>
          </div>
        )}

        {/* ── Bandeau accord en attente (producteur) ── */}
        {canAcceptOrRefuse && !showRefusInput && (
          <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 border-b border-amber-200 flex-shrink-0">
            <Handshake className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800 flex-1 font-medium">
              {contactNom} vous a proposé un accord. Acceptez ou refusez
              ci-dessous.
            </p>
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              onClick={handleAcceptAccord}
              disabled={actionLoading !== null}
            >
              {actionLoading === "accept" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Accepter
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 border-red-300 text-red-600 hover:bg-red-50 text-xs"
              onClick={() => setShowRefusInput(true)}
              disabled={actionLoading !== null}
            >
              <XCircle className="w-3.5 h-3.5" />
              Refuser
            </Button>
          </div>
        )}

        {/* ── Zone de refus (producteur) ── */}
        {showRefusInput && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex-shrink-0 space-y-2">
            <p className="text-xs text-red-700 font-medium">
              Raison du refus (optionnel) :
            </p>
            <Textarea
              value={raisonRefus}
              onChange={(e) => setRaisonRefus(e.target.value)}
              placeholder="Ex : prix trop bas, quantité insuffisante..."
              className="text-xs h-16 resize-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-8 gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs"
                onClick={handleRefuseAccord}
                disabled={actionLoading !== null}
              >
                {actionLoading === "refuse" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                Confirmer le refus
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={() => {
                  setShowRefusInput(false);
                  setRaisonRefus("");
                }}
              >
                Annuler
              </Button>
            </div>
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
                  {isAcheteur
                    ? `Discutez des conditions avec ${contactNom}, puis proposez un accord formel quand vous êtes prêt.`
                    : `Attendez la première proposition de ${contactNom} ou envoyez un message pour démarrer.`}
                </p>
              </div>
              {offerId && (
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/60 rounded-xl text-xs text-muted-foreground border">
                  <Package className="w-4 h-4 flex-shrink-0" />
                  <span>
                    <span className="font-medium text-foreground">
                      {productName}
                    </span>{" "}
                    — {offerPrixUnitaire?.toLocaleString("fr-FR")} Ar/
                    {productUnite} · Stock :{" "}
                    {offerQuantiteRestante ?? offerQuantite} {productUnite}
                  </span>
                </div>
              )}
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
                  {isAccordMessage(m.content) ? (
                    <AccordCard content={m.content} isMe={m.is_me} />
                  ) : (
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        m.is_me
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      }`}
                    >
                      {m.content}
                    </div>
                  )}
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
          {/* ── Mini-formulaire accord (acheteur) ── */}
          {showAccordForm && canProposeAccord && (
            <div className="px-6 pt-3 pb-2 bg-amber-50 border-b border-amber-200 space-y-3">
              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                <Handshake className="w-3.5 h-3.5" />
                Détails de votre accord
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                    Quantité ({productUnite})
                  </label>
                  <Input
                    type="number"
                    value={accordQte}
                    onChange={(e) => setAccordQte(e.target.value)}
                    placeholder="ex: 200"
                    className="h-9 text-sm"
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                    Prix unitaire (Ar/{productUnite})
                  </label>
                  <Input
                    type="number"
                    value={accordPrix}
                    onChange={(e) => setAccordPrix(e.target.value)}
                    placeholder="ex: 800"
                    className="h-9 text-sm"
                    min={0}
                  />
                </div>
              </div>
              {totalAccord !== null && (
                <div className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-amber-200 text-xs">
                  <span className="text-muted-foreground">Total estimé</span>
                  <span className="font-bold text-amber-700 text-sm">
                    {totalAccord.toLocaleString("fr-FR")} Ar
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  className="flex-1 h-9 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs"
                  onClick={handleProposeAccord}
                  disabled={actionLoading !== null || !accordQte || !accordPrix}
                >
                  {actionLoading === "accept" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Handshake className="w-3.5 h-3.5" />
                  )}
                  Envoyer la proposition
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 text-xs"
                  onClick={() => setShowAccordForm(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Propositions rapides */}
          {currentStatut !== "accord_propose" &&
            currentStatut !== "accord_accepte" && (
              <div className="px-6 pt-3 pb-2">
                <button
                  onClick={() => setShowProposals((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-primary font-medium hover:opacity-80 transition-opacity w-full"
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
            )}

          {/* Input message */}
          {currentStatut !== "accord_propose" &&
            currentStatut !== "accord_accepte" && (
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
            )}

          {/* Bouton ouvrir le formulaire accord — ACHETEUR */}
          {canProposeAccord && !showAccordForm && (
            <div className="px-6 pb-4">
              <Button
                className="w-full gap-2 h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm"
                onClick={() => setShowAccordForm(true)}
              >
                <Handshake className="w-4 h-4" />
                Proposer un accord
              </Button>
            </div>
          )}

          {/* Accord accepté */}
          {currentStatut === "accord_accepte" && (
            <div className="px-6 pb-4 pt-3">
              <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-700 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Accord accepté — Commande créée automatiquement
              </div>
            </div>
          )}

          {/* Attente réponse acheteur */}
          {isAcheteur && currentStatut === "accord_propose" && (
            <div className="px-6 pb-4 pt-3">
              <div className="flex items-center justify-center gap-2 py-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-700 text-xs font-medium">
                <Handshake className="w-4 h-4" />
                Proposition envoyée — En attente de la réponse du producteur
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

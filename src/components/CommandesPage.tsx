import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/axios";
import {
  Package,
  MapPin,
  Phone,
  Banknote,
  Scale,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ShoppingCart,
  Truck,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  CreditCard,
  ThumbsUp,
  ThumbsDown,
  Wallet,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Transaction {
  id: number;
  statut: string;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
  mode_paiement?: string;
  raison_refus?: string;
  raison_litige?: string;
  temps_restant?: string;
  created_at: string;
  confirmed_at?: string;
  paid_at?: string;
  preparation_at?: string;
  completed_at?: string;
  product: { nom: string; unite: string; categorie: string };
  offer: { id: number; quantite: number; quantite_restante?: number };
  acheteur: { nom: string; telephone?: string; region: string };
  producteur: { nom: string; telephone?: string; region: string };
}

interface Revenus {
  solde_coffre: number;
  total_gagne: number;
  nb_transactions_completees: number;
  nb_transactions_en_cours: number;
}

interface Props {
  user: any;
  onRefresh: () => void;
}

const MODES_PAIEMENT = [
  { value: "mvola", label: "MVola", emoji: "📱" },
  { value: "orange_money", label: "Orange Money", emoji: "🟠" },
  { value: "virement", label: "Virement bancaire", emoji: "🏦" },
  { value: "especes", label: "Espèces à la livraison", emoji: "💵" },
];

function statutConfig(statut: string) {
  switch (statut) {
    case "pending":
      return {
        label: "En attente de confirmation",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <Clock className="w-3 h-3" />,
      };
    case "confirmed":
      return {
        label: "Confirmée — Paiement requis",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <CreditCard className="w-3 h-3" />,
      };
    case "paid":
      return {
        label: "Payée — En préparation",
        color: "bg-violet-50 text-violet-700 border-violet-200",
        icon: <Wallet className="w-3 h-3" />,
      };
    case "en_preparation":
      return {
        label: "Prête — En attente de réception",
        color: "bg-orange-50 text-orange-700 border-orange-200",
        icon: <Truck className="w-3 h-3" />,
      };
    case "completee":
      return {
        label: "Terminée",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <CheckCircle2 className="w-3 h-3" />,
      };
    case "litige":
      return {
        label: "Litige — Remboursé",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: <AlertCircle className="w-3 h-3" />,
      };
    case "refused":
      return {
        label: "Refusée",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: <XCircle className="w-3 h-3" />,
      };
    case "cancelled":
      return {
        label: "Annulée",
        color: "bg-gray-100 text-gray-600 border-gray-200",
        icon: <XCircle className="w-3 h-3" />,
      };
    case "expired":
      return {
        label: "Expirée",
        color: "bg-gray-100 text-gray-600 border-gray-200",
        icon: <AlertCircle className="w-3 h-3" />,
      };
    default:
      return {
        label: statut,
        color: "bg-gray-100 text-gray-600 border-gray-200",
        icon: <Clock className="w-3 h-3" />,
      };
  }
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Barre de progression du statut ───────────────────────────────────────────
function StatutProgress({ statut }: { statut: string }) {
  const steps = [
    { key: "pending", label: "Commandée" },
    { key: "confirmed", label: "Confirmée" },
    { key: "paid", label: "Payée" },
    { key: "en_preparation", label: "Prête" },
    { key: "completee", label: "Reçue" },
  ];

  const activeIndex = steps.findIndex((s) => s.key === statut);
  const isNegative = ["refused", "cancelled", "expired", "litige"].includes(
    statut,
  );

  if (isNegative) return null;

  return (
    <div className="flex items-center gap-0 mb-4">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                i <= activeIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < activeIndex ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-[10px] mt-1 text-center leading-tight ${i <= activeIndex ? "text-primary font-medium" : "text-muted-foreground"}`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-0.5 flex-1 mx-1 mb-4 transition-all ${i < activeIndex ? "bg-primary" : "bg-border"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Card transaction ──────────────────────────────────────────────────────────
function TransactionCard({
  t,
  isProd,
  onConfirm,
  onRefuse,
  onPay,
  onReady,
  onComplete,
  onLitige,
}: {
  t: Transaction;
  isProd: boolean;
  onConfirm: (id: number) => void;
  onRefuse: (t: Transaction) => void;
  onPay: (t: Transaction) => void;
  onReady: (id: number) => void;
  onComplete: (id: number) => void;
  onLitige: (t: Transaction) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statut = statutConfig(t.statut);
  const contact = isProd ? t.acheteur : t.producteur;
  const isUrgent = t.statut === "pending" && isProd;

  return (
    <div
      className={`bg-card border rounded-2xl overflow-hidden transition-all ${isUrgent ? "border-amber-300 shadow-sm shadow-amber-100" : ""}`}
    >
      {/* Header cliquable */}
      <div
        className="flex items-center gap-3 p-5 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            t.statut === "pending"
              ? "bg-amber-100"
              : t.statut === "confirmed"
                ? "bg-blue-100"
                : t.statut === "paid"
                  ? "bg-violet-100"
                  : t.statut === "en_preparation"
                    ? "bg-orange-100"
                    : t.statut === "completee"
                      ? "bg-emerald-100"
                      : "bg-muted"
          }`}
        >
          <Package
            className={`w-6 h-6 ${
              t.statut === "pending"
                ? "text-amber-600"
                : t.statut === "confirmed"
                  ? "text-blue-600"
                  : t.statut === "paid"
                    ? "text-violet-600"
                    : t.statut === "en_preparation"
                      ? "text-orange-600"
                      : t.statut === "completee"
                        ? "text-emerald-600"
                        : "text-muted-foreground"
            }`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm truncate">{t.product.nom}</p>
            <Badge
              className={`text-[10px] gap-1 border flex-shrink-0 ${statut.color}`}
            >
              {statut.icon}
              {statut.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Scale className="w-3 h-3" />
              {t.quantite} {t.product.unite}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 font-semibold text-green-600">
              <Banknote className="w-3 h-3" />
              {t.prix_total.toLocaleString()} Ar
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {contact.nom}
            </span>
          </div>
          {isUrgent && t.temps_restant && (
            <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Répondez dans {t.temps_restant}
            </p>
          )}
          {!isProd && t.statut === "confirmed" && (
            <p className="text-[11px] text-blue-600 font-medium mt-1 flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              Paiement requis pour finaliser
            </p>
          )}
        </div>

        <div className="text-muted-foreground flex-shrink-0">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Détails */}
      {expanded && (
        <div className="border-t bg-muted/10 p-5 space-y-5">
          {/* Progression */}
          <StatutProgress statut={t.statut} />

          {/* Infos commande */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-card rounded-xl border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                Produit
              </p>
              <p className="font-semibold text-sm">{t.product.nom}</p>
              <p className="text-xs text-muted-foreground">
                {t.product.categorie}
              </p>
            </div>
            <div className="p-3 bg-card rounded-xl border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                Quantité
              </p>
              <p className="font-semibold text-sm">
                {t.quantite} {t.product.unite}
              </p>
            </div>
            <div className="p-3 bg-card rounded-xl border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                Prix unitaire
              </p>
              <p className="font-semibold text-sm text-green-600">
                {t.prix_unitaire.toLocaleString()} Ar
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl border border-green-200">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                Total
              </p>
              <p className="font-bold text-green-700">
                {t.prix_total.toLocaleString()} Ar
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="p-4 bg-card rounded-xl border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
              {isProd ? "Acheteur" : "Producteur"}
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{contact.nom}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {contact.region}
                </p>
                {contact.telephone && (
                  <p className="text-xs font-semibold text-primary flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />
                    {contact.telephone}
                  </p>
                )}
              </div>
              {contact.telephone && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs h-8"
                  onClick={() => window.open(`tel:${contact.telephone}`)}
                >
                  <Phone className="w-3 h-3" />
                  Appeler
                </Button>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Commandée le {formatDate(t.created_at)}</p>
            {t.confirmed_at && <p>Confirmée le {formatDate(t.confirmed_at)}</p>}
            {t.paid_at && (
              <p>
                Payée le {formatDate(t.paid_at)} via {t.mode_paiement}
              </p>
            )}
            {t.preparation_at && <p>Prête le {formatDate(t.preparation_at)}</p>}
            {t.completed_at && <p>Reçue le {formatDate(t.completed_at)}</p>}
          </div>

          {/* Raison refus/litige */}
          {t.raison_refus && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700">
                  Motif du refus
                </p>
                <p className="text-xs text-red-600 mt-0.5">{t.raison_refus}</p>
              </div>
            </div>
          )}

          {t.raison_litige && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700">
                  Problème signalé
                </p>
                <p className="text-xs text-red-600 mt-0.5">{t.raison_litige}</p>
              </div>
            </div>
          )}

          {/* ── Actions producteur ── */}
          {isProd && (
            <div className="space-y-2">
              {t.statut === "pending" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5 text-sm border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => onRefuse(t)}
                  >
                    <XCircle className="w-4 h-4" />
                    Refuser
                  </Button>
                  <Button
                    className="flex-1 gap-1.5 text-sm"
                    onClick={() => onConfirm(t.id)}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmer la commande
                  </Button>
                </div>
              )}
              {t.statut === "paid" && (
                <Button
                  className="w-full gap-1.5 text-sm bg-orange-500 hover:bg-orange-600"
                  onClick={() => onReady(t.id)}
                >
                  <Truck className="w-4 h-4" />
                  Commande prête pour livraison / retrait
                </Button>
              )}
            </div>
          )}

          {/* ── Actions acheteur ── */}
          {!isProd && (
            <div className="space-y-2">
              {t.statut === "confirmed" && (
                <Button
                  className="w-full gap-1.5 text-sm bg-gradient-to-r from-primary to-primary/80"
                  onClick={() => onPay(t)}
                >
                  <CreditCard className="w-4 h-4" />
                  Payer maintenant — {t.prix_total.toLocaleString()} Ar
                </Button>
              )}
              {t.statut === "en_preparation" && (
                <div className="space-y-2">
                  <Button
                    className="w-full gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onComplete(t.id)}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    J'ai bien reçu ma commande ✓
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-1.5 text-sm border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => onLitige(t)}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    Signaler un problème
                  </Button>
                </div>
              )}
              {t.statut === "paid" && (
                <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl">
                  <p className="text-xs text-violet-700 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Paiement sécurisé dans le coffre-fort. En attente que le
                    producteur prépare votre commande.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Widget revenus producteur ─────────────────────────────────────────────────
function RevenusWidget({ revenus }: { revenus: Revenus }) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* Coffre-fort */}
      <div className="p-5 bg-gradient-to-br from-violet-50 to-violet-100/50 border border-violet-200 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-violet-200 rounded-lg flex items-center justify-center">
            <Wallet className="w-4 h-4 text-violet-700" />
          </div>
          <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
            En coffre-fort
          </p>
        </div>
        <p className="text-2xl font-bold text-violet-800">
          {revenus.solde_coffre.toLocaleString()} Ar
        </p>
        <p className="text-xs text-violet-600 mt-1">
          {revenus.nb_transactions_en_cours} transaction
          {revenus.nb_transactions_en_cours > 1 ? "s" : ""} en cours
        </p>
        <p className="text-[10px] text-violet-500 mt-1">
          Sécurisé · libéré après validation du client
        </p>
      </div>

      {/* Total gagné */}
      <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-emerald-200 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
            Total gagné
          </p>
        </div>
        <p className="text-2xl font-bold text-emerald-800">
          {revenus.total_gagne.toLocaleString()} Ar
        </p>
        <p className="text-xs text-emerald-600 mt-1">
          {revenus.nb_transactions_completees} transaction
          {revenus.nb_transactions_completees > 1 ? "s" : ""} complétée
          {revenus.nb_transactions_completees > 1 ? "s" : ""}
        </p>
        <p className="text-[10px] text-emerald-500 mt-1">
          Validé · disponible pour retrait
        </p>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function CommandesPage({ user, onRefresh }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [revenus, setRevenus] = useState<Revenus | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  // Dialogs
  const [refuseOpen, setRefuseOpen] = useState(false);
  const [ligiteOpen, setLigiteOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [selectedT, setSelectedT] = useState<Transaction | null>(null);
  const [raison, setRaison] = useState("");
  const [modePaiement, setModePaiement] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const isProd = user?.role === "producteur";

  useEffect(() => {
    if (user) {
      fetchTransactions();
      if (isProd) fetchRevenus();
    }
    const interval = setInterval(() => {
      if (user) {
        fetchTransactions();
        if (isProd) fetchRevenus();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const endpoint = isProd
        ? "/transactions/commandes-recues"
        : "/transactions/mes-commandes";
      const res = await api.get(endpoint);
      setTransactions(res.data);
      onRefresh?.();
    } catch {
      toast.error("Impossible de charger les commandes");
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenus = async () => {
    try {
      const res = await api.get("/transactions/revenus");
      setRevenus(res.data);
    } catch {}
  };

  const handleConfirm = async (id: number) => {
    setActionLoading(true);
    try {
      await api.post(`/transactions/${id}/confirm`);
      toast.success(
        "✅ Commande confirmée ! L'acheteur va procéder au paiement.",
      );
      fetchTransactions();
      onRefresh?.();
      if (isProd) fetchRevenus();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefuse = async () => {
    if (!selectedT) return;
    setActionLoading(true);
    try {
      await api.post(`/transactions/${selectedT.id}/refuse`, {
        raison: raison.trim() || null,
      });
      toast.success("Commande refusée. L'acheteur a été notifié.");
      setRefuseOpen(false);
      setRaison("");
      fetchTransactions();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async () => {
    if (!selectedT || !modePaiement) {
      toast.error("Veuillez choisir un mode de paiement");
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/transactions/${selectedT.id}/pay`, {
        mode_paiement: modePaiement,
      });
      toast.success(
        "💰 Paiement effectué ! Votre argent est sécurisé dans le coffre-fort.",
      );
      setPayOpen(false);
      setModePaiement("");
      fetchTransactions();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReady = async (id: number) => {
    setActionLoading(true);
    try {
      await api.post(`/transactions/${id}/ready`);
      toast.success("📦 L'acheteur a été notifié que sa commande est prête.");
      fetchTransactions();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (id: number) => {
    setActionLoading(true);
    try {
      await api.post(`/transactions/${id}/complete`);
      toast.success(
        "🎉 Réception confirmée ! Transaction terminée avec succès.",
      );
      fetchTransactions();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLitige = async () => {
    if (!selectedT || !raison.trim()) {
      toast.error("Veuillez décrire le problème");
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/transactions/${selectedT.id}/litige`, {
        raison: raison.trim(),
      });
      toast.success("Problème signalé. Votre paiement sera remboursé.");
      setLigiteOpen(false);
      setRaison("");
      fetchTransactions();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const FILTERS = [
    { key: "all", label: "Toutes" },
    { key: "pending", label: "En attente" },
    { key: "confirmed", label: "À payer" },
    { key: "paid", label: "Payées" },
    { key: "en_preparation", label: "Prêtes" },
    { key: "completee", label: "Terminées" },
  ];

  const filtered =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.statut === filter);

  const pendingCount = transactions.filter(
    (t) => t.statut === "pending",
  ).length;
  const confirmedCount = transactions.filter(
    (t) => t.statut === "confirmed",
  ).length;

  if (loading && transactions.length === 0)
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-base">
            {isProd ? "Commandes reçues" : "Mes commandes"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isProd
              ? "Gérez vos commandes et suivez vos revenus en temps réel"
              : "Suivez l'état de vos achats auprès des producteurs locaux"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            fetchTransactions();
            if (isProd) fetchRevenus();
          }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualiser
        </Button>
      </div>

      {/* Widget revenus — producteur seulement */}
      {isProd && revenus && <RevenusWidget revenus={revenus} />}

      {/* Alertes urgentes */}
      {isProd && pendingCount > 0 && (
        <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            <span className="font-semibold">
              {pendingCount} commande{pendingCount > 1 ? "s" : ""} en attente
            </span>{" "}
            — Répondez dans les 24h pour maintenir la confiance de vos
            acheteurs.
          </p>
        </div>
      )}

      {!isProd && confirmedCount > 0 && (
        <div className="flex items-center gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
          <CreditCard className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            <span className="font-semibold">
              {confirmedCount} commande{confirmedCount > 1 ? "s" : ""} confirmée
              {confirmedCount > 1 ? "s" : ""}
            </span>{" "}
            — En attente de votre paiement pour finaliser.
          </p>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const count =
            f.key === "all"
              ? transactions.length
              : transactions.filter((t) => t.statut === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filter === f.key
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border hover:border-primary/30 hover:text-primary"
              }`}
            >
              {f.label}
              {count > 0 && (
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${filter === f.key ? "bg-white/20" : "bg-muted"}`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
            {isProd ? (
              <Truck className="w-8 h-8 text-muted-foreground" />
            ) : (
              <ShoppingCart className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">
              Aucune commande dans cette catégorie
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {isProd
                ? "Vos commandes apparaîtront ici dès qu'un acheteur commandera."
                : "Parcourez le marketplace pour passer votre première commande."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <TransactionCard
              key={t.id}
              t={t}
              isProd={isProd}
              onConfirm={handleConfirm}
              onRefuse={(t) => {
                setSelectedT(t);
                setRefuseOpen(true);
              }}
              onPay={(t) => {
                setSelectedT(t);
                setPayOpen(true);
              }}
              onReady={handleReady}
              onComplete={handleComplete}
              onLitige={(t) => {
                setSelectedT(t);
                setLigiteOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* ── Dialog Refus ── */}
      <Dialog
        open={refuseOpen}
        onOpenChange={(v) => {
          if (!v) {
            setRefuseOpen(false);
            setRaison("");
          }
        }}
      >
        <DialogContent className="w-[80vw] max-w-[80vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              Refuser cette commande
            </DialogTitle>
            <DialogDescription>
              {selectedT &&
                `${selectedT.quantite} ${selectedT.product.unite} de ${selectedT.product.nom} — ${selectedT.prix_total.toLocaleString()} Ar`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Raison du refus{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  (optionnel)
                </span>
              </label>
              <Textarea
                value={raison}
                onChange={(e) => setRaison(e.target.value)}
                placeholder="Ex : Je n'ai plus la quantité disponible..."
                className="resize-none"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Sans raison, un message automatique sera envoyé à l'acheteur.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setRefuseOpen(false);
                  setRaison("");
                }}
                disabled={actionLoading}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 gap-1.5 bg-red-600 hover:bg-red-700 text-white border-0"
                onClick={handleRefuse}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Confirmer le refus
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Paiement ── */}
      <Dialog
        open={payOpen}
        onOpenChange={(v) => {
          if (!v) {
            setPayOpen(false);
            setModePaiement("");
          }
        }}
      >
        <DialogContent className="w-[80vw] max-w-[80vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-primary" />
              </div>
              Procéder au paiement
            </DialogTitle>
            <DialogDescription>
              {selectedT &&
                `${selectedT.quantite} ${selectedT.product.unite} de ${selectedT.product.nom}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            {/* Récap */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-green-700 font-medium">
                  Montant total à payer
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  Sécurisé dans le coffre-fort jusqu'à réception
                </p>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {selectedT?.prix_total.toLocaleString()} Ar
              </p>
            </div>

            {/* Mode de paiement */}
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Choisissez un mode de paiement
              </p>
              <div className="grid grid-cols-2 gap-3">
                {MODES_PAIEMENT.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setModePaiement(m.value)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      modePaiement === m.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold">{m.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Simulation
                      </p>
                    </div>
                    {modePaiement === m.value && (
                      <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Info coffre-fort */}
            <div className="flex items-start gap-2.5 p-3 bg-violet-50 border border-violet-200 rounded-xl">
              <Wallet className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-violet-700">
                Votre paiement sera sécurisé dans notre coffre-fort et ne sera
                libéré au producteur qu'après votre confirmation de réception.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setPayOpen(false);
                  setModePaiement("");
                }}
                disabled={actionLoading}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 gap-1.5"
                onClick={handlePay}
                disabled={actionLoading || !modePaiement}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                {actionLoading ? "Traitement..." : "Confirmer le paiement"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Litige ── */}
      <Dialog
        open={ligiteOpen}
        onOpenChange={(v) => {
          if (!v) {
            setLigiteOpen(false);
            setRaison("");
          }
        }}
      >
        <DialogContent className="w-[80vw] max-w-[80vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              Signaler un problème
            </DialogTitle>
            <DialogDescription>
              {selectedT &&
                `Commande : ${selectedT.quantite} ${selectedT.product.unite} de ${selectedT.product.nom}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-700 font-medium">
                ⚠️ En signalant un problème, votre commande sera annulée et
                votre paiement de{" "}
                <span className="font-bold">
                  {selectedT?.prix_total.toLocaleString()} Ar
                </span>{" "}
                vous sera remboursé.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Décrivez le problème <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={raison}
                onChange={(e) => setRaison(e.target.value)}
                placeholder="Ex : Le produit reçu n'est pas conforme à l'annonce, mauvaise qualité..."
                className="resize-none"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setLigiteOpen(false);
                  setRaison("");
                }}
                disabled={actionLoading}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 gap-1.5 bg-red-600 hover:bg-red-700 text-white border-0"
                onClick={handleLitige}
                disabled={actionLoading || !raison.trim()}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                Confirmer le signalement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

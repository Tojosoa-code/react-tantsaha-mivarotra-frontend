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
  raison_refus?: string;
  temps_restant?: string;
  expires_at?: string;
  created_at: string;
  confirmed_at?: string;
  completed_at?: string;
  product: {
    nom: string;
    unite: string;
    categorie: string;
  };
  offer: {
    id: number;
    quantite: number;
    quantite_restante?: number;
  };
  acheteur: {
    nom: string;
    telephone?: string;
    region: string;
  };
  producteur: {
    nom: string;
    telephone?: string;
    region: string;
  };
}

interface Props {
  user: any;
}

function statutConfig(statut: string) {
  switch (statut) {
    case "pending":
      return {
        label: "En attente",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <Clock className="w-3 h-3" />,
      };
    case "confirmed":
      return {
        label: "Confirmée",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <CheckCircle2 className="w-3 h-3" />,
      };
    case "completed":
      return {
        label: "Terminée",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <CheckCircle2 className="w-3 h-3" />,
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

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Card transaction ──────────────────────────────────────────────────────────
function TransactionCard({
  t,
  isProd,
  onConfirm,
  onRefuse,
  onComplete,
}: {
  t: Transaction;
  isProd: boolean;
  onConfirm: (id: number) => void;
  onRefuse: (t: Transaction) => void;
  onComplete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statut = statutConfig(t.statut);
  const contact = isProd ? t.acheteur : t.producteur;

  return (
    <div
      className={`bg-card border rounded-xl overflow-hidden transition-all ${
        t.statut === "pending" ? "border-amber-200 shadow-sm" : ""
      }`}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Icône produit */}
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
            t.statut === "pending"
              ? "bg-amber-100"
              : t.statut === "confirmed"
                ? "bg-blue-100"
                : t.statut === "completed"
                  ? "bg-emerald-100"
                  : "bg-muted"
          }`}
        >
          <Package
            className={`w-5 h-5 ${
              t.statut === "pending"
                ? "text-amber-600"
                : t.statut === "confirmed"
                  ? "text-blue-600"
                  : t.statut === "completed"
                    ? "text-emerald-600"
                    : "text-muted-foreground"
            }`}
          />
        </div>

        {/* Infos principales */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
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
          {/* Timer pour pending */}
          {t.statut === "pending" && t.temps_restant && (
            <div className="flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3 text-amber-600" />
              <span className="text-[11px] text-amber-600 font-medium">
                {isProd
                  ? `Répond dans ${t.temps_restant}`
                  : `Expire dans ${t.temps_restant}`}
              </span>
            </div>
          )}
        </div>

        {/* Expand arrow */}
        <div className="text-muted-foreground flex-shrink-0">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Détails expandés */}
      {expanded && (
        <div className="border-t bg-muted/20 p-4 space-y-4">
          {/* Détails commande */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-card rounded-lg border space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Produit
              </p>
              <p className="text-sm font-semibold">{t.product.nom}</p>
              <p className="text-xs text-muted-foreground">
                {t.product.categorie}
              </p>
            </div>
            <div className="p-3 bg-card rounded-lg border space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Quantité
              </p>
              <p className="text-sm font-semibold">
                {t.quantite} {t.product.unite}
              </p>
            </div>
            <div className="p-3 bg-card rounded-lg border space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Prix unitaire
              </p>
              <p className="text-sm font-semibold text-green-600">
                {t.prix_unitaire.toLocaleString()} Ar
              </p>
            </div>
            <div className="p-3 bg-card rounded-lg border space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Total
              </p>
              <p className="text-sm font-bold text-green-600">
                {t.prix_total.toLocaleString()} Ar
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="p-3 bg-card rounded-lg border space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {isProd ? "Acheteur" : "Producteur"}
            </p>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  {contact.nom}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" />
                  {contact.region}
                </p>
                {contact.telephone && (
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
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
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Commandée le {formatDate(t.created_at)}</p>
            {t.confirmed_at && <p>Confirmée le {formatDate(t.confirmed_at)}</p>}
            {t.completed_at && <p>Terminée le {formatDate(t.completed_at)}</p>}
          </div>

          {/* Raison refus */}
          {t.statut === "refused" && t.raison_refus && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700">
                  Motif du refus
                </p>
                <p className="text-xs text-red-600 mt-0.5">{t.raison_refus}</p>
              </div>
            </div>
          )}

          {/* Actions producteur — pending */}
          {isProd && t.statut === "pending" && (
            <div className="flex gap-2 pt-1">
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

          {/* Action acheteur — confirmed */}
          {!isProd && t.statut === "confirmed" && (
            <Button
              className="w-full gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onComplete(t.id)}
            >
              <CheckCircle2 className="w-4 h-4" />
              J'ai reçu ma commande — Confirmer la réception
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function CommandesPage({ user }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [refuseDialog, setRefuseDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [raison, setRaison] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const isProd = user?.role === "producteur";

  useEffect(() => {
    if (user) fetchTransactions();
    const interval = setInterval(() => {
      if (user) fetchTransactions();
    }, 15000);
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
    } catch {
      toast.error("Impossible de charger les commandes");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: number) => {
    setActionLoading(true);
    try {
      await api.post(`/transactions/${id}/confirm`);
      toast.success("✅ Commande confirmée ! L'acheteur a été notifié.");
      fetchTransactions();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail ?? "Erreur lors de la confirmation",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefuse = async () => {
    if (!selectedTransaction) return;
    setActionLoading(true);
    try {
      await api.post(`/transactions/${selectedTransaction.id}/refuse`, {
        raison: raison.trim() || null,
      });
      toast.success("Commande refusée. L'acheteur a été notifié.");
      setRefuseDialog(false);
      setRaison("");
      setSelectedTransaction(null);
      fetchTransactions();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erreur lors du refus");
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
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const openRefuse = (t: Transaction) => {
    setSelectedTransaction(t);
    setRefuseDialog(true);
  };

  const filtered =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.statut === filter);

  const counts = {
    all: transactions.length,
    pending: transactions.filter((t) => t.statut === "pending").length,
    confirmed: transactions.filter((t) => t.statut === "confirmed").length,
    completed: transactions.filter((t) => t.statut === "completed").length,
  };

  if (loading && transactions.length === 0)
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">
            {isProd ? "Commandes reçues" : "Mes commandes"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isProd
              ? "Gérez les commandes de vos acheteurs en temps réel"
              : "Suivez l'état de vos achats auprès des producteurs"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={fetchTransactions}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualiser
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "Toutes", count: counts.all },
          { key: "pending", label: "En attente", count: counts.pending },
          { key: "confirmed", label: "Confirmées", count: counts.confirmed },
          { key: "completed", label: "Terminées", count: counts.completed },
        ].map((f) => (
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
            {f.count > 0 && (
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  filter === f.key ? "bg-white/20" : "bg-muted"
                }`}
              >
                {f.count}
              </span>
            )}
          </button>
        ))}
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
              {filter === "all"
                ? isProd
                  ? "Aucune commande reçue"
                  : "Aucune commande passée"
                : "Aucune commande dans cette catégorie"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {isProd
                ? "Vos commandes apparaîtront ici dès qu'un acheteur commandera l'un de vos produits."
                : "Parcourez le marketplace pour trouver des producteurs et passer votre première commande."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Alerte commandes en attente */}
          {isProd && counts.pending > 0 && (
            <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                <span className="font-semibold">
                  {counts.pending} commande{counts.pending > 1 ? "s" : ""} en
                  attente
                </span>{" "}
                — Répondez dans les 24h pour ne pas décevoir vos acheteurs.
              </p>
            </div>
          )}

          {filtered.map((t) => (
            <TransactionCard
              key={t.id}
              t={t}
              isProd={isProd}
              onConfirm={handleConfirm}
              onRefuse={openRefuse}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}

      {/* Dialog refus */}
      <Dialog
        open={refuseDialog}
        onOpenChange={(v) => {
          if (!v) {
            setRefuseDialog(false);
            setRaison("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              Refuser cette commande
            </DialogTitle>
            <DialogDescription>
              {selectedTransaction && (
                <>
                  Commande de {selectedTransaction.quantite}{" "}
                  {selectedTransaction.product.unite} de{" "}
                  {selectedTransaction.product.nom} par{" "}
                  {selectedTransaction.acheteur.nom}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Raison du refus{" "}
                <span className="text-muted-foreground font-normal">
                  (facultatif)
                </span>
              </label>
              <Textarea
                value={raison}
                onChange={(e) => setRaison(e.target.value)}
                placeholder="Ex : Je n'ai plus la quantité disponible, stock écoulé..."
                className="resize-none text-sm"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Si vous ne mettez rien, un message automatique sera envoyé à
                l'acheteur.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setRefuseDialog(false);
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
                {actionLoading ? "Envoi..." : "Confirmer le refus"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

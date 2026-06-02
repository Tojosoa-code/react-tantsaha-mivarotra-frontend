import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import NegociationChat from "@/components/NegociationChat";
import CheckoutDialog from "@/components/CheckoutDialog";
import {
  Package,
  MapPin,
  Navigation,
  Scale,
  Banknote,
  Loader2,
  Sparkles,
  Users,
  RefreshCw,
  ShoppingCart,
  MessageCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ArrowRight,
  Leaf,
  Truck,
  Home,
  Star,
  Phone,
  RotateCcw,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Contact {
  id: number;
  nom: string;
  region: string;
  telephone?: string;
  role: "producteur" | "acheteur";
  // Acheteur
  quantite_demandee?: number;
  budget_max?: number;
  livraison_souhaitee?: boolean;
  frequence?: string;
  date_souhaitee?: string;
  description?: string;
  // Producteur
  offer_id?: number;
  quantite_disponible?: number;
  quantite_restante?: number;
  prix_unitaire?: number;
  livraison_possible?: boolean;
  retrait_possible?: boolean;
  date_fin?: string;
}

interface MaRecolte {
  offer_id: number;
  product_name: string;
  product_unite: string;
  product_categorie: string;
  quantite: number;
  quantite_restante?: number;
  prix_unitaire: number;
  livraison_possible: boolean;
  retrait_possible: boolean;
  date_fin?: string;
  description?: string;
}

interface MaRecherche {
  demand_id: number;
  product_name: string;
  product_unite: string;
  product_categorie: string;
  quantite: number;
  budget_max?: number;
  livraison_souhaitee: boolean;
  frequence: string;
  date_souhaitee?: string;
  description?: string;
}

interface Suggestion {
  match_id: number;
  match_statut: string;
  score: number;
  distance_km: number;
  // Producteur
  ma_recolte?: MaRecolte;
  // Acheteur
  ma_recherche?: MaRecherche;
  contact: Contact;
  valeur_potentielle?: number;
  economie_potentielle?: number;
  score_details: string[];
  prix_compatible: boolean;
  quantite_suffisante: boolean;
  livraison_compatible: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function frequenceLabel(f?: string) {
  switch (f) {
    case "hebdomadaire":
      return "Besoin hebdomadaire";
    case "mensuel":
      return "Besoin mensuel";
    case "regulier":
      return "Besoin régulier";
    default:
      return "Achat unique";
  }
}

function statutBadge(statut: string) {
  switch (statut) {
    case "interested":
      return (
        <Badge className="text-[10px] gap-1 bg-blue-50 text-blue-600 border-blue-200">
          <CheckCircle2 className="w-2.5 h-2.5" />
          Proposition envoyée
        </Badge>
      );
    case "negotiating":
      return (
        <Badge className="text-[10px] gap-1 bg-violet-50 text-violet-600 border-violet-200">
          <MessageCircle className="w-2.5 h-2.5" />
          Négociation en cours
        </Badge>
      );
    case "done":
      return (
        <Badge className="text-[10px] gap-1 bg-emerald-50 text-emerald-600 border-emerald-200">
          <CheckCircle2 className="w-2.5 h-2.5" />
          Accord conclu
        </Badge>
      );
    default:
      return (
        <Badge className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/20">
          <Sparkles className="w-2.5 h-2.5" />
          Nouvelle opportunité
        </Badge>
      );
  }
}

function deadlineBadge(dateStr?: string) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff < 0)
    return (
      <Badge variant="destructive" className="text-[10px]">
        Expiré
      </Badge>
    );
  if (diff <= 3)
    return (
      <Badge className="text-[10px] bg-red-50 text-red-600 border-red-200">
        <AlertCircle className="w-2.5 h-2.5 mr-1" />
        Urgent · {diff}j
      </Badge>
    );
  if (diff <= 7)
    return (
      <Badge className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">
        <Clock className="w-2.5 h-2.5 mr-1" />
        {diff}j restants
      </Badge>
    );
  return (
    <Badge variant="secondary" className="text-[10px]">
      {new Date(dateStr).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      })}
    </Badge>
  );
}

// ── Card Producteur ───────────────────────────────────────────────────────────
function CardProducteur({
  s,
  onPropose,
  onNegociate,
  onDetail,
  proposeLoading,
}: {
  s: Suggestion;
  onPropose: (s: Suggestion) => void;
  onNegociate: (s: Suggestion) => void;
  onDetail: (s: Suggestion) => void;
  proposeLoading: number | null;
}) {
  const r = s.ma_recolte!;
  const c = s.contact;

  return (
    <div
      className="bg-card border rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer"
      onClick={() => onDetail(s)}
    >
      {/* Bande supérieure — ma récolte */}
      <div className="px-5 pt-4 pb-3 bg-primary/5 border-b border-primary/10">
        <p className="text-[10px] text-primary font-semibold uppercase tracking-wide mb-1.5">
          Votre récolte
        </p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/15 rounded-lg flex items-center justify-center flex-shrink-0">
              <Leaf className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">{r.product_name}</p>
              <p className="text-xs text-muted-foreground">
                {r.quantite.toLocaleString()} {r.product_unite} ·{" "}
                {r.prix_unitaire.toLocaleString()} Ar/{r.product_unite}
              </p>
            </div>
          </div>
          {statutBadge(s.match_statut)}
        </div>
      </div>

      {/* Flèche centrale */}
      <div className="flex items-center justify-center py-2 bg-muted/20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-px w-12 bg-border" />
          <ArrowRight className="w-3.5 h-3.5 text-primary" />
          <span className="text-primary font-medium">correspond à</span>
          <div className="h-px w-12 bg-border" />
        </div>
      </div>

      {/* Bande inférieure — ce que l'acheteur cherche */}
      <div className="px-5 pt-3 pb-4">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-2">
          Ce que cherche {c.nom}
        </p>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
            {c.nom[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{c.nom}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3" />
              {c.region}
              <span className="mx-1">·</span>
              <Navigation className="w-3 h-3" />
              {s.distance_km} km
            </div>
            {/* Détails de la demande */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg">
                <Scale className="w-3 h-3" />
                {c.quantite_demandee?.toLocaleString()} {r.product_unite}{" "}
                demandés
              </span>
              {c.budget_max && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-lg">
                  <Banknote className="w-3 h-3" />
                  Budget {c.budget_max.toLocaleString()} Ar/{r.product_unite}
                </span>
              )}
              {c.frequence && c.frequence !== "unique" && (
                <span className="inline-flex items-center gap-1 text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-lg">
                  <RotateCcw className="w-3 h-3" />
                  {frequenceLabel(c.frequence)}
                </span>
              )}
              {c.livraison_souhaitee && (
                <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-lg">
                  <Truck className="w-3 h-3" />
                  Livraison souhaitée
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Compatibilité */}
        <div className="flex gap-2 mt-3 pt-3 border-t">
          <div
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg flex-1 justify-center ${s.prix_compatible ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}
          >
            {s.prix_compatible ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3" />
            )}
            Prix {s.prix_compatible ? "compatible" : "trop élevé"}
          </div>
          <div
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg flex-1 justify-center ${s.quantite_suffisante ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
          >
            {s.quantite_suffisante ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {s.quantite_suffisante ? "Stock suffisant" : "Stock partiel"}
          </div>
          <div
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg flex-1 justify-center ${s.livraison_compatible ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}
          >
            {s.livraison_compatible ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3" />
            )}
            {s.livraison_compatible ? "Livraison OK" : "Livraison incompatible"}
          </div>
        </div>

        {/* Valeur potentielle */}
        {s.valeur_potentielle && (
          <div className="mt-3 p-2.5 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
            <span className="text-xs text-green-700">
              Valeur potentielle de cette vente
            </span>
            <span className="text-sm font-bold text-green-700">
              {s.valeur_potentielle.toLocaleString()} Ar
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 text-xs h-9 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => onPropose(s)}
            disabled={proposeLoading === s.match_id || s.match_statut !== "new"}
          >
            {proposeLoading === s.match_id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Star className="w-3.5 h-3.5" />
            )}
            {s.match_statut !== "new"
              ? "Proposition envoyée"
              : "Proposer mon offre"}
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5 text-xs h-9"
            onClick={() => onNegociate(s)}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Négocier
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Card Acheteur ─────────────────────────────────────────────────────────────
function CardAcheteur({
  s,
  onCommander,
  onNegociate,
  onDetail,
}: {
  s: Suggestion;
  onCommander: (s: Suggestion) => void;
  onNegociate: (s: Suggestion) => void;
  onDetail: (s: Suggestion) => void;
}) {
  const r = s.ma_recherche!;
  const c = s.contact;

  return (
    <div
      className="bg-card border rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer"
      onClick={() => onDetail(s)}
    >
      {/* Bande supérieure — ma recherche */}
      <div className="px-5 pt-4 pb-3 bg-blue-50/60 border-b border-blue-100">
        <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide mb-1.5">
          Votre recherche
        </p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-sm">{r.product_name}</p>
              <p className="text-xs text-muted-foreground">
                {r.quantite.toLocaleString()} {r.product_unite} recherchés
                {r.budget_max &&
                  ` · Budget ${r.budget_max.toLocaleString()} Ar/${r.product_unite}`}
              </p>
            </div>
          </div>
          {statutBadge(s.match_statut)}
        </div>
      </div>

      {/* Flèche centrale */}
      <div className="flex items-center justify-center py-2 bg-muted/20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-px w-12 bg-border" />
          <ArrowRight className="w-3.5 h-3.5 text-primary" />
          <span className="text-primary font-medium">trouvé chez</span>
          <div className="h-px w-12 bg-border" />
        </div>
      </div>

      {/* Bande inférieure — ce que le producteur propose */}
      <div className="px-5 pt-3 pb-4">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-2">
          Ce que propose {c.nom}
        </p>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
            {c.nom[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{c.nom}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3" />
              {c.region}
              <span className="mx-1">·</span>
              <Navigation className="w-3 h-3" />
              {s.distance_km} km
            </div>
            {/* Détails de l'offre */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-lg font-semibold">
                <Banknote className="w-3 h-3" />
                {c.prix_unitaire?.toLocaleString()} Ar/{r.product_unite}
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-lg">
                <Scale className="w-3 h-3" />
                {c.quantite_disponible?.toLocaleString()} {r.product_unite}{" "}
                disponibles
              </span>
              {c.livraison_possible && (
                <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-lg">
                  <Truck className="w-3 h-3" />
                  Livraison possible
                </span>
              )}
              {c.retrait_possible && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-lg">
                  <Home className="w-3 h-3" />
                  Retrait sur place
                </span>
              )}
              {c.date_fin && deadlineBadge(c.date_fin)}
            </div>
          </div>
        </div>

        {/* Compatibilité */}
        <div className="flex gap-2 mt-3 pt-3 border-t">
          <div
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg flex-1 justify-center ${s.prix_compatible ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
          >
            {s.prix_compatible ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {s.prix_compatible ? "Sous votre budget" : "Légèrement au-dessus"}
          </div>
          <div
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg flex-1 justify-center ${s.quantite_suffisante ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
          >
            {s.quantite_suffisante ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {s.quantite_suffisante ? "Quantité suffisante" : "Stock partiel"}
          </div>
          <div
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg flex-1 justify-center ${s.livraison_compatible ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
          >
            {s.livraison_compatible ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {s.livraison_compatible ? "Mode livraison OK" : "À vérifier"}
          </div>
        </div>

        {/* Économie potentielle */}
        {s.economie_potentielle && s.economie_potentielle > 0 && (
          <div className="mt-3 p-2.5 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
            <span className="text-xs text-green-700">
              Vous économisez vs votre budget
            </span>
            <span className="text-sm font-bold text-green-700">
              {s.economie_potentielle.toLocaleString()} Ar
            </span>
          </div>
        )}

        {/* Téléphone */}
        {c.telephone && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-dashed">
            <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-xs font-semibold text-primary">
              {c.telephone}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            className="flex-1 gap-1.5 text-xs h-9 bg-gradient-to-r from-primary to-primary/80"
            onClick={() => onCommander(s)}
            disabled={!c.offer_id}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Commander maintenant
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 text-xs h-9"
            onClick={() => onNegociate(s)}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Négocier le prix
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function SuggestionsTab({
  user,
  onRefresh,
}: {
  user: any;
  onRefresh?: () => void;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatData, setChatData] = useState<Suggestion | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<Suggestion | null>(null);
  const [proposeLoading, setProposeLoading] = useState<number | null>(null);
  const isProd = user?.role === "producteur";

  useEffect(() => {
    if (user) fetchSuggestions();
  }, [user]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/matches/suggestions?limit=20");
      setSuggestions(res.data.suggestions ?? []);
    } catch {
      toast.error("Impossible de charger les suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handlePropose = async (s: Suggestion) => {
    setProposeLoading(s.match_id);
    try {
      await api.post(`/matches/${s.match_id}/interested`);
      toast.success(`Proposition envoyée à ${s.contact.nom} !`);
      setSuggestions((prev) =>
        prev.map((x) =>
          x.match_id === s.match_id ? { ...x, match_statut: "interested" } : x,
        ),
      );
      onRefresh?.();
      setSelected((prev) =>
        prev?.match_id === s.match_id
          ? { ...prev, match_statut: "interested" }
          : prev,
      );
    } catch {
      toast.error("Erreur, veuillez réessayer");
    } finally {
      setProposeLoading(null);
    }
  };

  const openChat = (s: Suggestion) => {
    setChatData(s);
    setChatOpen(true);
    setSelected(null);
  };

  const openCheckout = (s: Suggestion) => {
    setCheckoutData(s);
    setCheckoutOpen(true);
    setSelected(null);
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Notre algorithme analyse les meilleures correspondances pour vous…
        </p>
      </div>
    );

  if (suggestions.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center">
          <Users className="w-10 h-10 text-muted-foreground" />
        </div>
        <div>
          <p className="font-bold text-lg">Aucune suggestion pour le moment</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {isProd
              ? "Publiez une récolte — notre algorithme trouvera automatiquement les acheteurs dont les besoins correspondent."
              : "Publiez une recherche — notre algorithme trouvera automatiquement les producteurs qui ont ce qu'il vous faut."}
          </p>
        </div>
        <Button variant="outline" onClick={fetchSuggestions} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </Button>
      </div>
    );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">
            {suggestions.length} opportunité{suggestions.length > 1 ? "s" : ""}{" "}
            identifiée{suggestions.length > 1 ? "s" : ""}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isProd
              ? "Voici les acheteurs dont les besoins correspondent exactement à vos récoltes"
              : "Voici les producteurs locaux qui ont ce que vous recherchez"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSuggestions}
          className="gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualiser
        </Button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {suggestions.map((s) =>
          isProd ? (
            <CardProducteur
              key={s.match_id}
              s={s}
              onPropose={handlePropose}
              onNegociate={openChat}
              onDetail={setSelected}
              proposeLoading={proposeLoading}
            />
          ) : (
            <CardAcheteur
              key={s.match_id}
              s={s}
              onCommander={openCheckout}
              onNegociate={openChat}
              onDetail={setSelected}
            />
          ),
        )}
      </div>

      {/* ── Dialog détail ── */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="w-[80vw] max-w-[80vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-5 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-xl shadow-sm">
                {selected?.contact.nom[0]}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  {selected?.contact.nom}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-0.5">
                  {selected && statutBadge(selected.match_statut)}
                  <span className="text-xs text-muted-foreground">
                    · {selected?.distance_km} km · {selected?.contact.region}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selected && (
            <div className="space-y-6 pt-4">
              {/* Ma récolte / Ma recherche */}
              <div
                className={`p-5 rounded-2xl border ${isProd ? "bg-primary/5 border-primary/20" : "bg-blue-50/60 border-blue-100"}`}
              >
                <p
                  className={`text-xs font-bold uppercase tracking-wide mb-3 ${isProd ? "text-primary" : "text-blue-600"}`}
                >
                  {isProd
                    ? "Votre récolte concernée"
                    : "Votre recherche concernée"}
                </p>
                {isProd && selected.ma_recolte && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Produit
                      </p>
                      <p className="font-bold mt-0.5">
                        {selected.ma_recolte.product_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Quantité
                      </p>
                      <p className="font-bold mt-0.5">
                        {selected.ma_recolte.quantite.toLocaleString()}{" "}
                        {selected.ma_recolte.product_unite}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Prix
                      </p>
                      <p className="font-bold text-green-600 mt-0.5">
                        {selected.ma_recolte.prix_unitaire.toLocaleString()} Ar/
                        {selected.ma_recolte.product_unite}
                      </p>
                    </div>
                  </div>
                )}
                {!isProd && selected.ma_recherche && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Produit
                      </p>
                      <p className="font-bold mt-0.5">
                        {selected.ma_recherche.product_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Quantité
                      </p>
                      <p className="font-bold mt-0.5">
                        {selected.ma_recherche.quantite.toLocaleString()}{" "}
                        {selected.ma_recherche.product_unite}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Budget
                      </p>
                      <p className="font-bold text-blue-600 mt-0.5">
                        {selected.ma_recherche.budget_max?.toLocaleString() ??
                          "Non défini"}{" "}
                        Ar
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Compatibilité détaillée */}
              <div className="p-5 bg-muted/30 rounded-2xl border">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
                  Pourquoi cette correspondance ?
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className={`p-3 rounded-xl text-center ${selected.prix_compatible ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}
                  >
                    {selected.prix_compatible ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                    )}
                    <p
                      className={`text-xs font-semibold ${selected.prix_compatible ? "text-green-700" : "text-amber-700"}`}
                    >
                      {selected.prix_compatible
                        ? "Prix compatible"
                        : "Prix à négocier"}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-xl text-center ${selected.quantite_suffisante ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}
                  >
                    {selected.quantite_suffisante ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                    )}
                    <p
                      className={`text-xs font-semibold ${selected.quantite_suffisante ? "text-green-700" : "text-amber-700"}`}
                    >
                      {selected.quantite_suffisante
                        ? "Quantité OK"
                        : "Stock partiel"}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-xl text-center ${selected.livraison_compatible ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}
                  >
                    {selected.livraison_compatible ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                    )}
                    <p
                      className={`text-xs font-semibold ${selected.livraison_compatible ? "text-green-700" : "text-amber-700"}`}
                    >
                      {selected.livraison_compatible
                        ? "Livraison OK"
                        : "À vérifier"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 mt-3">
                  {selected.score_details?.map((d, i) => (
                    <p
                      key={i}
                      className="text-xs text-muted-foreground flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {d}
                    </p>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div className="p-5 bg-muted/30 rounded-2xl border">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
                  Contact
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{selected.contact.nom}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {selected.contact.region} · {selected.distance_km} km
                    </p>
                    {selected.contact.telephone && (
                      <p className="text-sm font-semibold text-primary flex items-center gap-1.5 mt-1">
                        <Phone className="w-3.5 h-3.5" />
                        {selected.contact.telephone}
                      </p>
                    )}
                  </div>
                  {selected.contact.telephone && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() =>
                        window.open(`tel:${selected.contact.telephone}`)
                      }
                    >
                      <Phone className="w-4 h-4" />
                      Appeler
                    </Button>
                  )}
                </div>
              </div>

              {/* Valeur / Économie */}
              {(selected.valeur_potentielle ||
                selected.economie_potentielle) && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-700 font-medium">
                      {selected.valeur_potentielle
                        ? "Valeur potentielle de cette transaction"
                        : "Économie réalisée vs votre budget"}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {(
                      selected.valeur_potentielle ??
                      selected.economie_potentielle
                    )?.toLocaleString()}{" "}
                    Ar
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t">
                {isProd ? (
                  <>
                    <Button
                      className="flex-1 gap-2 h-12"
                      variant="outline"
                      onClick={() => handlePropose(selected)}
                      disabled={
                        proposeLoading === selected.match_id ||
                        selected.match_statut !== "new"
                      }
                    >
                      {proposeLoading === selected.match_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Star className="w-4 h-4" />
                      )}
                      {selected.match_statut !== "new"
                        ? "Proposition déjà envoyée"
                        : "Proposer mon offre"}
                    </Button>
                    <Button
                      className="flex-1 gap-2 h-12"
                      onClick={() => openChat(selected)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Négocier
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="flex-1 gap-2 h-12 bg-gradient-to-r from-primary to-primary/80"
                      onClick={() => openCheckout(selected)}
                      disabled={!selected.contact.offer_id}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Commander maintenant
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 h-12"
                      onClick={() => openChat(selected)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Négocier le prix
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat */}
      <NegociationChat
        open={chatOpen}
        onClose={() => {
          setChatOpen(false);
          setChatData(null);
        }}
        matchId={chatData?.match_id ?? null}
        contactNom={chatData?.contact.nom ?? ""}
        productName={
          isProd
            ? (chatData?.ma_recolte?.product_name ?? "")
            : (chatData?.ma_recherche?.product_name ?? "")
        }
        productUnite={
          isProd
            ? chatData?.ma_recolte?.product_unite
            : chatData?.ma_recherche?.product_unite
        }
        contactTelephone={chatData?.contact.telephone}
        matchStatut={chatData?.match_statut}
        isAcheteur={!isProd}
        offerId={chatData?.contact.offer_id}
        offerPrixUnitaire={chatData?.contact.prix_unitaire}
        offerQuantite={chatData?.contact.quantite_disponible}
        offerQuantiteRestante={chatData?.contact.quantite_restante}
        producteurNom={chatData?.contact.nom}
        producteurRegion={chatData?.contact.region}
      />

      {/* Checkout */}
      {checkoutData?.contact.offer_id && (
        <CheckoutDialog
          open={checkoutOpen}
          onClose={() => {
            setCheckoutOpen(false);
            setCheckoutData(null);
          }}
          offer={{
            id: checkoutData.contact.offer_id,
            product_name: checkoutData.ma_recherche?.product_name ?? "",
            product_unite: checkoutData.ma_recherche?.product_unite ?? "kg",
            quantite: checkoutData.contact.quantite_disponible ?? 0,
            quantite_restante: checkoutData.contact.quantite_restante,
            prix_unitaire: checkoutData.contact.prix_unitaire ?? 0,
            producteur_nom: checkoutData.contact.nom,
            producteur_telephone: checkoutData.contact.telephone,
            producteur_region: checkoutData.contact.region,
          }}
          onSuccess={() => {
            setCheckoutOpen(false);
            fetchSuggestions();
            onRefresh?.();
            toast.success(
              "Commande envoyée ! Le producteur va confirmer sous 24h.",
            );
          }}
        />
      )}
    </div>
  );
}

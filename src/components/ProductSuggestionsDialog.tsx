import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/axios";
import {
  Package,
  MapPin,
  Navigation,
  Scale,
  Banknote,
  Heart,
  MessageCircle,
  Loader2,
  Sparkles,
  TrendingUp,
  Phone,
  Star,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";

interface Suggestion {
  match_id: number;
  match_statut: string;
  score: number;
  distance_km: number;
  product_name: string;
  product_unite: string;
  contact_nom: string;
  contact_region: string;
  contact_telephone?: string;
  contact_quantite: number;
  contact_prix?: number;
  contact_budget?: number;
  contact_date?: string;
  contact_date_fin?: string;
  contact_role: string;
  score_details: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  productId: number | null;
  productName: string;
  user: any;
  onNegociate: (suggestion: Suggestion) => void;
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 80)
    return (
      <div className="flex flex-col items-center px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
        <span className="text-xl font-bold text-emerald-600 leading-none">
          {Math.round(score)}
        </span>
        <span className="text-[9px] text-emerald-500 mt-0.5 uppercase tracking-wide">
          Match
        </span>
      </div>
    );
  if (score >= 60)
    return (
      <div className="flex flex-col items-center px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
        <span className="text-xl font-bold text-amber-600 leading-none">
          {Math.round(score)}
        </span>
        <span className="text-[9px] text-amber-500 mt-0.5 uppercase tracking-wide">
          Match
        </span>
      </div>
    );
  return (
    <div className="flex flex-col items-center px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl">
      <span className="text-xl font-bold text-orange-500 leading-none">
        {Math.round(score)}
      </span>
      <span className="text-[9px] text-orange-400 mt-0.5 uppercase tracking-wide">
        Match
      </span>
    </div>
  );
}

function statutBadge(statut: string) {
  switch (statut) {
    case "interested":
      return (
        <Badge className="text-[10px] gap-1 bg-blue-50 text-blue-600 border-blue-200">
          <Heart className="w-2.5 h-2.5" />
          Intéressé
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
      <Badge variant="destructive" className="text-[10px] gap-1">
        <X className="w-2.5 h-2.5" />
        Expiré
      </Badge>
    );
  if (diff <= 3)
    return (
      <Badge className="text-[10px] gap-1 bg-red-50 text-red-600 border-red-200">
        <AlertCircle className="w-2.5 h-2.5" />
        Urgent · {diff}j
      </Badge>
    );
  if (diff <= 7)
    return (
      <Badge className="text-[10px] gap-1 bg-amber-50 text-amber-600 border-amber-200">
        <Clock className="w-2.5 h-2.5" />
        {diff}j restants
      </Badge>
    );
  return null;
}

export default function ProductSuggestionsDialog({
  open,
  onClose,
  productId,
  productName,
  user,
  onNegociate,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [interestedLoading, setInterestedLoading] = useState<number | null>(
    null,
  );
  const isProd = user?.role === "producteur";

  useEffect(() => {
    if (!open || !productId) return;
    fetchSuggestions();
  }, [open, productId]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/matches/for-product/${productId}`);
      setSuggestions(res.data.suggestions ?? []);
    } catch {
      toast.error("Impossible de charger les opportunités");
    } finally {
      setLoading(false);
    }
  };

  const handleInterested = async (s: Suggestion) => {
    if (s.match_statut !== "new") return;
    setInterestedLoading(s.match_id);
    try {
      await api.post(`/matches/${s.match_id}/interested`);
      toast.success(`✓ ${s.contact_nom} a été notifié de votre intérêt`);
      setSuggestions((prev) =>
        prev.map((x) =>
          x.match_id === s.match_id ? { ...x, match_statut: "interested" } : x,
        ),
      );
    } catch {
      toast.error("Une erreur est survenue, veuillez réessayer");
    } finally {
      setInterestedLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Opportunités pour — {productName}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {isProd
                  ? "Acheteurs prêts à acquérir ce produit près de chez vous"
                  : "Producteurs locaux qui proposent ce produit en ce moment"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">
                Analyse des meilleures correspondances…
              </p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  Aucune correspondance pour l'instant
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {isProd
                    ? "Dès qu'un acheteur recherche ce produit dans votre région, vous serez notifié automatiquement."
                    : "Dès qu'un producteur publie une offre pour ce produit, vous serez alerté en temps réel."}
                </p>
              </div>
            </div>
          ) : (
            suggestions.map((s) => (
              <div
                key={s.match_id}
                className="group bg-card border rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all duration-200"
              >
                {/* Header card */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-semibold text-base flex-shrink-0">
                    {s.contact_nom[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {s.contact_nom}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {s.contact_role}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {statutBadge(s.match_statut)}
                      {deadlineBadge(s.contact_date_fin || s.contact_date)}
                    </div>
                  </div>
                  <ScoreBadge score={s.score} />
                </div>

                {/* Infos clés */}
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/50 rounded-lg">
                    <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs truncate">{s.contact_region}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/50 rounded-lg">
                    <Navigation className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs">{s.distance_km} km</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/50 rounded-lg">
                    <Scale className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs">
                      {s.contact_quantite} {s.product_unite}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 rounded-lg">
                    <Banknote className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs font-semibold text-emerald-700">
                      {(s.contact_prix || s.contact_budget)?.toLocaleString()}{" "}
                      Ar
                    </span>
                  </div>
                </div>

                {/* Score details */}
                {s.score_details?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {s.score_details.map((d, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 bg-primary/5 text-primary rounded-full border border-primary/10"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                )}

                {/* Téléphone */}
                {s.contact_telephone && (
                  <div className="flex items-center gap-2 px-2.5 py-2 bg-muted/30 rounded-lg mb-3 border border-dashed">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold tracking-wide text-primary">
                      {s.contact_telephone}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {s.match_statut === "new" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => handleInterested(s)}
                      disabled={interestedLoading === s.match_id}
                    >
                      {interestedLoading === s.match_id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Heart className="w-3.5 h-3.5" />
                      )}
                      Je suis intéressé
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 text-xs h-8"
                    onClick={() => {
                      onNegociate(s);
                      onClose();
                    }}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {s.match_statut === "negotiating"
                      ? "Continuer la négociation"
                      : "Démarrer une négociation"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {suggestions.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <p className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-primary">
                  {suggestions.length} correspondance
                  {suggestions.length > 1 ? "s" : ""}
                </span>{" "}
                trouvée{suggestions.length > 1 ? "s" : ""} par notre algorithme
                de matching — classées par score de compatibilité
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

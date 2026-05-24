import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import ChatDialog from "@/components/ChatDialog";
import {
  Package,
  MapPin,
  Phone,
  Star,
  TrendingUp,
  Users,
  Calendar,
  Banknote,
  Scale,
  Loader2,
  RefreshCw,
  Navigation,
  Heart,
  MessageCircle,
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
  my_quantite: number;
  my_prix?: number;
  my_budget?: number;
  my_date_fin?: string;
  my_date?: string;
  contact_id: number;
  contact_nom: string;
  contact_region: string;
  contact_telephone?: string;
  contact_quantite: number;
  contact_prix?: number;
  contact_budget?: number;
  contact_date?: string;
  contact_date_fin?: string;
  contact_role: "producteur" | "acheteur";
  score_details: string[];
}

function scoreColor(score: number) {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  return "text-orange-500";
}

function scoreBg(score: number) {
  if (score >= 80) return "bg-green-50 border-green-200";
  if (score >= 60) return "bg-amber-50 border-amber-200";
  return "bg-orange-50 border-orange-200";
}

function statutBadge(statut: string) {
  switch (statut) {
    case "interested":
      return (
        <Badge className="text-xs gap-1 bg-blue-100 text-blue-700 border-blue-200">
          <Heart className="w-2.5 h-2.5" /> Intéressé
        </Badge>
      );
    case "negotiating":
      return (
        <Badge className="text-xs gap-1 bg-purple-100 text-purple-700 border-purple-200">
          <MessageCircle className="w-2.5 h-2.5" /> En négociation
        </Badge>
      );
    case "done":
      return (
        <Badge className="text-xs gap-1 bg-green-100 text-green-700 border-green-200">
          <CheckCircle2 className="w-2.5 h-2.5" /> Conclu
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="text-xs gap-1">
          <Star className="w-2.5 h-2.5" /> Nouveau
        </Badge>
      );
  }
}

function deadlineBadge(dateStr?: string) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff < 0)
    return (
      <Badge variant="destructive" className="text-xs gap-1">
        <X className="w-2.5 h-2.5" /> Expiré
      </Badge>
    );
  if (diff <= 3)
    return (
      <Badge className="text-xs gap-1 bg-red-100 text-red-700 border-red-200">
        <AlertCircle className="w-2.5 h-2.5" /> {diff}j restants
      </Badge>
    );
  if (diff <= 7)
    return (
      <Badge className="text-xs gap-1 bg-amber-100 text-amber-700 border-amber-200">
        <Clock className="w-2.5 h-2.5" /> {diff}j restants
      </Badge>
    );
  return null;
}

export default function SuggestionsTab({ user }: { user: any }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMatch, setChatMatch] = useState<Suggestion | null>(null);
  const [interestedLoading, setInterestedLoading] = useState<number | null>(
    null,
  );
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

  const handleInterested = async (s: Suggestion, e: React.MouseEvent) => {
    e.stopPropagation();
    if (s.match_statut !== "new") return;
    setInterestedLoading(s.match_id);
    try {
      await api.post(`/matches/${s.match_id}/interested`);
      toast.success(`${s.contact_nom} a été notifié de votre intérêt !`);
      setSuggestions((prev) =>
        prev.map((x) =>
          x.match_id === s.match_id ? { ...x, match_statut: "interested" } : x,
        ),
      );
      setSelected((prev) =>
        prev?.match_id === s.match_id
          ? { ...prev, match_statut: "interested" }
          : prev,
      );
    } catch {
      toast.error("Erreur, veuillez réessayer");
    } finally {
      setInterestedLoading(null);
    }
  };

  const handleChat = (s: Suggestion, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatMatch(s);
    setChatOpen(true);
    setSelected(null);
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Calcul des meilleures correspondances…
        </p>
      </div>
    );

  if (suggestions.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center">
          <Users className="w-7 h-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">Aucune suggestion pour le moment</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isProd
              ? "Publiez une offre — le système trouvera automatiquement les acheteurs."
              : "Publiez une demande — le système trouvera automatiquement les producteurs."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSuggestions}
          className="gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </Button>
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">
            {suggestions.length} correspondance
            {suggestions.length > 1 ? "s" : ""} trouvée
            {suggestions.length > 1 ? "s" : ""}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isProd
              ? "Acheteurs intéressés par vos produits"
              : "Producteurs qui correspondent à vos recherches"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSuggestions}
          className="gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </Button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((s) => (
          <div
            key={s.match_id}
            onClick={() => setSelected(s)}
            className="bg-card border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
          >
            {/* Top : produit + score */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">
                    {s.product_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.contact_nom}
                  </p>
                </div>
              </div>
              <div
                className={`flex flex-col items-center px-2.5 py-1.5 rounded-lg border ${scoreBg(s.score)}`}
              >
                <span
                  className={`text-lg font-semibold leading-none ${scoreColor(s.score)}`}
                >
                  {Math.round(s.score)}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  score
                </span>
              </div>
            </div>

            {/* Infos */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                <MapPin className="w-3 h-3" /> {s.contact_region}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                <Navigation className="w-3 h-3" /> {s.distance_km} km
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                <Scale className="w-3 h-3" /> {s.contact_quantite}{" "}
                {s.product_unite}
              </span>
              {s.contact_prix && (
                <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md">
                  <Banknote className="w-3 h-3" />
                  {s.contact_prix.toLocaleString()} Ar
                </span>
              )}
              {s.contact_budget && (
                <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                  <Banknote className="w-3 h-3" />
                  Budget {s.contact_budget.toLocaleString()} Ar
                </span>
              )}
            </div>

            {/* Bottom : statut + actions */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1 flex-wrap">
                {statutBadge(s.match_statut)}
                {deadlineBadge(s.contact_date_fin || s.contact_date)}
              </div>
              <div className="flex gap-1.5">
                {s.match_statut === "new" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-2.5 gap-1 border-primary/30 text-primary hover:bg-primary hover:text-white"
                    onClick={(e) => handleInterested(s, e)}
                    disabled={interestedLoading === s.match_id}
                  >
                    {interestedLoading === s.match_id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Heart className="w-3 h-3" />
                    )}
                    Intéressé
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2.5 gap-1"
                  onClick={(e) => handleChat(s, e)}
                >
                  <MessageCircle className="w-3 h-3" />
                  Négocier
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog détail */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
                <Star className="w-4 h-4" />
              </div>
              {selected?.product_name}
            </DialogTitle>
            <DialogDescription>
              {isProd
                ? "Acheteur intéressé par votre produit"
                : "Producteur correspondant à votre demande"}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 pt-1">
              {/* Score */}
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border ${scoreBg(selected.score)}`}
              >
                <TrendingUp
                  className={`w-5 h-5 ${scoreColor(selected.score)}`}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      Score de compatibilité
                    </span>
                    <span
                      className={`text-sm font-semibold ${scoreColor(selected.score)}`}
                    >
                      {Math.round(selected.score)} / 100
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${selected.score}%`,
                        background:
                          selected.score >= 80
                            ? "#16a34a"
                            : selected.score >= 60
                              ? "#d97706"
                              : "#f97316",
                      }}
                    />
                  </div>
                  {/* Explication du score */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selected.score_details?.map((d, i) => (
                      <span
                        key={i}
                        className="text-xs bg-white/70 px-2 py-0.5 rounded-full text-muted-foreground"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Infos contact */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-muted/40 rounded-lg border col-span-2">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Contact
                  </p>
                  <p className="text-sm font-semibold">
                    {selected.contact_nom}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {selected.contact_role}
                  </p>
                </div>
                <div className="p-2.5 bg-muted/40 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-0.5">Région</p>
                  <p className="text-sm font-medium">
                    {selected.contact_region}
                  </p>
                </div>
                <div className="p-2.5 bg-muted/40 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Distance
                  </p>
                  <p className="text-sm font-medium">
                    {selected.distance_km} km
                  </p>
                </div>
                <div className="p-2.5 bg-muted/40 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Quantité
                  </p>
                  <p className="text-sm font-medium">
                    {selected.contact_quantite} {selected.product_unite}
                  </p>
                </div>
                {selected.contact_prix && (
                  <div className="p-2.5 bg-muted/40 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Prix unitaire
                    </p>
                    <p className="text-sm font-semibold text-green-600">
                      {selected.contact_prix.toLocaleString()} Ar
                    </p>
                  </div>
                )}
                {selected.contact_budget && (
                  <div className="p-2.5 bg-muted/40 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Budget max
                    </p>
                    <p className="text-sm font-semibold text-blue-600">
                      {selected.contact_budget.toLocaleString()} Ar
                    </p>
                  </div>
                )}
                {/* Numéro de téléphone affiché en clair */}
                {selected.contact_telephone && (
                  <div className="p-2.5 bg-muted/40 rounded-lg border col-span-2">
                    <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Téléphone
                    </p>
                    <p className="text-sm font-semibold tracking-wide">
                      {selected.contact_telephone}
                    </p>
                  </div>
                )}
                {(selected.contact_date_fin || selected.contact_date) && (
                  <div className="p-2.5 bg-muted/40 rounded-lg border col-span-2">
                    <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Date limite
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {selected.contact_date_fin || selected.contact_date}
                      </p>
                      {deadlineBadge(
                        selected.contact_date_fin || selected.contact_date,
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Statut actuel */}
              <div className="flex items-center gap-2">
                {statutBadge(selected.match_statut)}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {selected.match_statut === "new" && (
                  <Button
                    className="flex-1 gap-1.5"
                    onClick={(e) => handleInterested(selected, e)}
                    disabled={interestedLoading === selected.match_id}
                  >
                    {interestedLoading === selected.match_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Heart className="w-4 h-4" />
                    )}
                    Je suis intéressé
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={(e) => handleChat(selected, e)}
                >
                  <MessageCircle className="w-4 h-4" />
                  Négocier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat */}
      <ChatDialog
        open={chatOpen}
        onClose={() => {
          setChatOpen(false);
          setChatMatch(null);
        }}
        matchId={chatMatch?.match_id ?? null}
        contactNom={chatMatch?.contact_nom ?? ""}
        productName={chatMatch?.product_name ?? ""}
      />
    </div>
  );
}

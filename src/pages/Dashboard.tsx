import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import CrudDialog from "@/components/CrudDialog";
import SuggestionsTab from "@/components/SuggestionsTab";
import NotificationBell from "@/components/NotificationBell";
import NegociationsPanel from "@/components/NegociationsPanel";
import NegociationChat from "@/components/NegociationChat";
import ProductSuggestionsDialog from "@/components/ProductSuggestionsDialog";
import CheckoutDialog from "@/components/CheckoutDialog";
import CommandesPage from "@/components/CommandesPage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import api from "@/lib/axios";
import {
  Home,
  PlusCircle,
  Search,
  Route,
  LogOut,
  ShoppingBag,
  Sprout,
  RefreshCw,
  ChevronDown,
  MapPin,
  Eye,
  Pencil,
  Trash2,
  Package,
  Scale,
  Banknote,
  Store,
  Flame,
  Users,
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  Star,
  X,
  MessageCircle,
  Sparkles,
  ShoppingCart,
  ArrowRight,
  Leaf,
  BarChart3,
  Loader2,
  Truck,
  RotateCcw,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { OrganicSproutLoader } from "@/components/ui/agriculture-loader-overlay";

interface SearchBarProps {
  value: string;
  onChange: (q: string) => void;
  suggestions: string[];
  suggestionsOpen: boolean;
  onSelectSuggestion: (s: string) => void;
  onClear: () => void;
  onFocus: () => void;
  placeholder: string;
  searchRef: React.RefObject<HTMLDivElement>;
}

function SearchBarWithTrie({
  value,
  onChange,
  suggestions,
  suggestionsOpen,
  onSelectSuggestion,
  onClear,
  onFocus,
  placeholder,
  searchRef,
}: SearchBarProps) {
  return (
    <div className="relative flex-1 max-w-md" ref={searchRef}>
      <Search className="absolute top-1.5 left-3 text-muted-foreground w-4 h-4 pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="pl-10 pr-9"
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          className="absolute right-6 top-10 text-muted-foreground hover:text-foreground z-10"
          onMouseDown={(e) => {
            e.preventDefault();
            onClear();
          }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {suggestionsOpen && suggestions.length > 0 && (
        <div className="top-full mt-1 w-full bg-card border rounded-xl shadow-xl overflow-y-auto">
          <div className="px-3 py-1.5 border-b bg-muted/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
              Suggestions
            </p>
          </div>
          <ul className="max-h-48 overflow-y-auto divide-y">
            {suggestions.map((s) => (
              <li
                key={s}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectSuggestion(s);
                }}
                className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-primary/5 transition-colors"
              >
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Search className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StandardPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pagesArr = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
  });
  return (
    <Card className="mt-6">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange(page - 1)}
              disabled={page === 1}
            >
              Précédent
            </Button>
            <div className="flex gap-1">
              {pagesArr.map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onChange(p)}
                  className="w-10"
                >
                  {p}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange(page + 1)}
              disabled={page === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    | "home"
    | "my-primary"
    | "all-primary"
    | "marketplace"
    | "suggestions"
    | "negociations"
    | "commandes"
    | "route"
  >("home");

  const [myItems, setMyItems] = useState<any[]>([]);
  const [primaryItems, setPrimaryItems] = useState<any[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);

  const [paginationData, setPaginationData] = useState({
    my: { total: 0, page: 1, total_pages: 0 },
    primary: { total: 0, page: 1, total_pages: 0 },
    market: { total: 0, page: 1, total_pages: 0 },
  });

  const [loading, setLoading] = useState(false);
  const [dropdowns, setDropdowns] = useState({ primary: false, market: false });

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [crudOpen, setCrudOpen] = useState(false);
  const [crudMode, setCrudMode] = useState<"create" | "edit">("create");
  const [crudItem, setCrudItem] = useState<any>(null);

  const [productSuggestionsOpen, setProductSuggestionsOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [selectedProductName, setSelectedProductName] = useState("");

  const [negociationOpen, setNegociationOpen] = useState(false);
  const [negociationData, setNegociationData] = useState<any>(null);

  // Négociation depuis marketplace
  const [marketNegociatOpen, setMarketNegociatOpen] = useState(false);
  const [marketNegociatData, setMarketNegociatData] = useState<any>(null);
  const [marketNegociatLoading, setMarketNegociatLoading] = useState<
    number | null
  >(null);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutOffer, setCheckoutOffer] = useState<any>(null);

  const [statsData, setStatsData] = useState({
    total_matches: 0,
    contacts_etablis: 0,
    negociations: 0,
    commandes_pending: 0,
  });

  // ── NOUVEAU : état revenus producteur ──
  const [revenus, setRevenus] = useState<{
    solde_coffre: number;
    total_gagne: number;
    nb_transactions_completees: number;
    nb_transactions_en_cours: number;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setSearchQuery("");
    setSearchSuggestions([]);
    setSearchOpen(false);
  }, [activeTab]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const isProd = user?.role === "producteur";

  const labels = {
    mySection: isProd ? "Mes récoltes" : "Mes recherches",
    newItem: isProd ? "Publier une récolte" : "Publier ma recherche",
    marketplace: isProd ? "Trouver des acheteurs" : "Trouver des producteurs",
    suggestions: isProd ? "Acheteurs intéressés" : "Producteurs recommandés",
    itemsLabel: isProd ? "récolte(s) publiée(s)" : "recherche(s) active(s)",
  };

  const primaryEndpoint = isProd ? "/offers" : "/demands";
  const myEndpoint = isProd ? "/users/me/offers" : "/users/me/demands";
  const marketEndpoint = isProd ? "/demands" : "/offers";

  // ── NOUVEAU : loadRevenus ──
  const loadRevenus = async () => {
    if (!isProd) return;
    try {
      const res = await api.get("/transactions/revenus");
      setRevenus(res.data);
    } catch {}
  };

  const refreshAll = useCallback(() => {
    loadStats();
    loadRevenus();
    if (activeTab === "my-primary") loadMyItems(paginationData.my.page);
    if (activeTab === "all-primary")
      loadPrimaryItems(paginationData.primary.page);
    if (activeTab === "marketplace")
      loadMarketplaceItems(paginationData.market.page);
  }, [activeTab, paginationData]);

  useEffect(() => {
    if (!user) return;
    loadStats();
    loadRevenus();
    if (activeTab === "my-primary") loadMyItems(1);
    if (activeTab === "all-primary") loadPrimaryItems(1);
    if (activeTab === "marketplace") loadMarketplaceItems(1);
  }, [activeTab, user]);

  const loadStats = async () => {
    try {
      const [matchRes, txRes] = await Promise.all([
        api.get("/matches/suggestions?limit=50"),
        isProd
          ? api.get("/transactions/commandes-recues")
          : api.get("/transactions/mes-commandes"),
      ]);
      const suggestions = matchRes.data.suggestions ?? [];
      const transactions = txRes.data ?? [];
      setStatsData({
        total_matches: matchRes.data.count ?? 0,
        contacts_etablis: suggestions.filter((s: any) =>
          ["interested", "negotiating", "done"].includes(s.match_statut),
        ).length,
        negociations: suggestions.filter(
          (s: any) => s.match_statut === "negotiating",
        ).length,
        commandes_pending: transactions.filter(
          (t: any) => t.statut === "pending",
        ).length,
      });
    } catch {}
  };

  const loadMyItems = async (page = 1) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get(`${myEndpoint}?page=${page}&page_size=12`);
      const items = res.data.items || res.data || [];
      setMyItems(items);
      setPaginationData((prev) => ({
        ...prev,
        my: {
          total: res.data.total ?? items.length,
          page,
          total_pages: res.data.total_pages ?? 1,
        },
      }));
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadPrimaryItems = async (page = 1) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get(
        `${primaryEndpoint}?page=${page}&page_size=12&exclude_current_user=true`,
      );
      setPrimaryItems(res.data.items || []);
      setPaginationData((prev) => ({
        ...prev,
        primary: {
          total: res.data.total ?? 0,
          page,
          total_pages: res.data.total_pages ?? 1,
        },
      }));
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadMarketplaceItems = async (page = 1) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get(`${marketEndpoint}?page=${page}&page_size=12`);
      setMarketplaceItems(res.data.items || []);
      setPaginationData((prev) => ({
        ...prev,
        market: {
          total: res.data.total ?? 0,
          page,
          total_pages: res.data.total_pages ?? 1,
        },
      }));
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setCrudItem(null);
    setCrudMode("create");
    setCrudOpen(true);
  };

  const handleEdit = (item: any) => {
    setCrudItem(item);
    setCrudMode("edit");
    setCrudOpen(true);
  };

  const handleDelete = async (itemId: number) => {
    if (!window.confirm("Confirmer la suppression ?")) return;
    try {
      await api.delete(`${isProd ? "/offers" : "/demands"}/${itemId}`);
      toast.success("Supprimé avec succès");
      loadMyItems(1);
      loadMarketplaceItems(1);
      loadStats();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleMarkEpuise = async (offerId: number) => {
    if (!window.confirm("Marquer ce produit comme épuisé ?")) return;
    try {
      await api.post(`/transactions/offer/${offerId}/epuise`);
      toast.success("Produit marqué comme épuisé");
      loadMyItems(1);
      loadMarketplaceItems(1);
      loadStats();
    } catch {
      toast.error("Erreur");
    }
  };

  const handleViewDetails = async (itemId: number) => {
    try {
      const endpoint =
        activeTab === "marketplace" ? marketEndpoint : primaryEndpoint;
      const res = await api.get(`${endpoint}/${itemId}`);
      setSelectedItem(res.data);
      setDetailsOpen(true);
    } catch {
      toast.error("Erreur de chargement");
    }
  };

  const handleCheckout = (item: any) => {
    const producteur = item.producteur;
    setCheckoutOffer({
      id: item.id,
      product_name: item.product?.nom ?? "",
      product_unite: item.product?.unite ?? "kg",
      quantite: parseFloat(item.quantite),
      quantite_restante: item.quantite_restante
        ? parseFloat(item.quantite_restante)
        : undefined,
      prix_unitaire: parseFloat(item.prix_unitaire),
      producteur_nom: producteur
        ? `${producteur.prenom} ${producteur.nom}`
        : "Producteur",
      producteur_telephone: producteur?.telephone,
      producteur_region: item.region,
    });
    setDetailsOpen(false);
    setCheckoutOpen(true);
  };

  const handleNegocierMarketplace = async (item: any) => {
    setMarketNegociatLoading(item.id);
    try {
      const res = await api.get(`/matches/for-product/${item.product_id}`);
      const suggestions = res.data.suggestions ?? [];
      if (suggestions.length === 0) {
        toast.error(
          isProd
            ? "Publiez d'abord une offre pour ce produit afin de pouvoir négocier"
            : "Publiez d'abord une recherche pour ce produit afin de pouvoir négocier",
        );
        return;
      }
      const match = suggestions[0];
      const contact = isProd ? item.acheteur : item.producteur;
      setMarketNegociatData({
        match_id: match.match_id,
        contact_nom: match.contact_nom,
        product_name: item.product?.nom ?? "",
        product_unite: item.product?.unite ?? "kg",
        contact_telephone: match.contact_telephone,
        match_statut: match.match_statut,
        offer_id: isProd ? null : item.id,
        offer_prix_unitaire: isProd ? null : parseFloat(item.prix_unitaire),
        offer_quantite: isProd ? null : parseFloat(item.quantite),
        offer_quantite_restante: item.quantite_restante
          ? parseFloat(item.quantite_restante)
          : null,
        producteur_nom: isProd
          ? `${user.prenom} ${user.nom}`
          : contact
            ? `${contact.prenom} ${contact.nom}`
            : "",
        producteur_region: item.region,
      });
      setMarketNegociatOpen(true);
    } catch {
      toast.error("Impossible d'ouvrir la négociation");
    } finally {
      setMarketNegociatLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("À bientôt !");
    navigate("/login");
  };

  const isExpired = (item: any): boolean => {
    const deadline = isProd ? item.date_dispo_fin : item.date_souhaitee;
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const isEpuise = (item: any): boolean => item.statut === "epuise";

  const DeadlineBadge = ({ item }: { item: any }) => {
    if (isEpuise(item))
      return (
        <Badge className="text-xs gap-1 bg-gray-100 text-gray-500 border-gray-200">
          <X className="w-2.5 h-2.5" />
          Épuisé
        </Badge>
      );
    const deadline = isProd ? item.date_dispo_fin : item.date_souhaitee;
    if (!deadline)
      return <span className="text-xs text-muted-foreground">—</span>;
    const diff = Math.ceil(
      (new Date(deadline).getTime() - Date.now()) / 86400000,
    );
    if (diff < 0)
      return (
        <Badge variant="destructive" className="text-xs gap-1">
          <X className="w-2.5 h-2.5" />
          Expiré
        </Badge>
      );
    if (diff <= 3)
      return (
        <Badge className="text-xs gap-1 bg-red-100 text-red-700 border-red-200">
          <AlertCircle className="w-2.5 h-2.5" />
          {diff}j
        </Badge>
      );
    if (diff <= 7)
      return (
        <Badge className="text-xs gap-1 bg-amber-100 text-amber-700 border-amber-200">
          <Clock className="w-2.5 h-2.5" />
          {diff}j
        </Badge>
      );
    return (
      <Badge variant="secondary" className="text-xs gap-1">
        <CheckCircle2 className="w-2.5 h-2.5 text-green-600" />
        {new Date(deadline).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        })}
      </Badge>
    );
  };

  const openProductSuggestions = (productId: number, productName: string) => {
    setSelectedProductId(productId);
    setSelectedProductName(productName);
    setProductSuggestionsOpen(true);
  };

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchSuggestions([]);
      setSearchOpen(false);
      return;
    }
    try {
      const res = await api.get(
        `/matches/search?prefix=${encodeURIComponent(q)}`,
      );
      const noms = (res.data ?? []).map((p: any) => p.nom);
      setSearchSuggestions(noms);
      setSearchOpen(noms.length > 0);
    } catch {}
  }, []);

  const filterBySearch = (items: any[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.product?.nom?.toLowerCase().includes(q) ||
        item.product?.categorie?.toLowerCase().includes(q) ||
        item.region?.toLowerCase().includes(q),
    );
  };

  const getDisplayUser = () => {
    if (!selectedItem) return null;
    if (activeTab === "marketplace")
      return isProd ? selectedItem.acheteur : selectedItem.producteur;
    return isProd ? selectedItem.producteur : selectedItem.acheteur;
  };
  const displayUser = getDisplayUser();

  // Polling toutes les 15 secondes pour synchronisation globale
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      loadStats();
      if (isProd) loadRevenus();
    }, 15000);
    return () => clearInterval(interval);
  }, [user, isProd]);

  if (!user)
    return (
      <div className="flex h-screen items-center justify-center">
        <OrganicSproutLoader text="Préparation de votre espace..." />
      </div>
    );

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-muted/20">
      {/* ── Sidebar ── */}
      <div className="w-72 border-r bg-card/95 backdrop-blur-sm flex flex-col shadow-lg">
        <div className="p-6 border-b flex items-center gap-3 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center text-primary-foreground shadow-md">
            <Sprout className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xl font-bold block">Tantsaha</span>
            <span className="text-xs text-muted-foreground">
              Plateforme agricole
            </span>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Button
            variant={activeTab === "home" ? "default" : "ghost"}
            className="w-full justify-start gap-3 hover:bg-primary/10"
            onClick={() => setActiveTab("home")}
          >
            <Home className="w-5 h-5" />
            Accueil
          </Button>

          <div
            onMouseEnter={() => setDropdowns((p) => ({ ...p, primary: true }))}
            onMouseLeave={() => setDropdowns((p) => ({ ...p, primary: false }))}
          >
            <Button
              variant={
                activeTab === "my-primary" || activeTab === "all-primary"
                  ? "default"
                  : "ghost"
              }
              className="w-full justify-start gap-3 hover:bg-primary/10"
            >
              {isProd ? (
                <Leaf className="w-5 h-5" />
              ) : (
                <ShoppingBag className="w-5 h-5" />
              )}
              <span className="flex-1 text-left">{labels.mySection}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${dropdowns.primary ? "rotate-180" : ""}`}
              />
            </Button>
            {dropdowns.primary && (
              <div className="pl-4 py-1 space-y-1 animate-in slide-in-from-top-2">
                <Button
                  variant={activeTab === "my-primary" ? "default" : "ghost"}
                  className="w-full justify-start gap-3 text-sm"
                  onClick={() => setActiveTab("my-primary")}
                >
                  <Package className="w-4 h-4" />
                  {isProd ? "Gérer mes récoltes" : "Gérer mes recherches"}
                </Button>
                <Button
                  variant={activeTab === "all-primary" ? "default" : "ghost"}
                  className="w-full justify-start gap-3 text-sm"
                  onClick={() => setActiveTab("all-primary")}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analyse du marché
                </Button>
              </div>
            )}
          </div>

          <div
            onMouseEnter={() => setDropdowns((p) => ({ ...p, market: true }))}
            onMouseLeave={() => setDropdowns((p) => ({ ...p, market: false }))}
          >
            <Button
              variant={activeTab === "marketplace" ? "default" : "ghost"}
              className="w-full justify-start gap-3 hover:bg-primary/10"
            >
              <Store className="w-5 h-5" />
              <span className="flex-1 text-left">{labels.marketplace}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${dropdowns.market ? "rotate-180" : ""}`}
              />
            </Button>
            {dropdowns.market && (
              <div className="pl-4 py-1 animate-in slide-in-from-top-2">
                <Button
                  variant={activeTab === "marketplace" ? "default" : "ghost"}
                  className="w-full justify-start gap-3 text-sm"
                  onClick={() => setActiveTab("marketplace")}
                >
                  <Flame className="w-4 h-4" />
                  {isProd ? "Demandes en cours" : "Récoltes disponibles"}
                </Button>
              </div>
            )}
          </div>

          <div className="pt-2 border-t space-y-1">
            <Button
              variant={activeTab === "suggestions" ? "default" : "ghost"}
              className="w-full justify-start gap-3 hover:bg-primary/10"
              onClick={() => setActiveTab("suggestions")}
            >
              <Sparkles className="w-5 h-5" />
              <span className="flex-1 text-left">{labels.suggestions}</span>
              {statsData.total_matches > 0 && (
                <span className="w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {statsData.total_matches > 9 ? "9+" : statsData.total_matches}
                </span>
              )}
            </Button>

            <Button
              variant={activeTab === "negociations" ? "default" : "ghost"}
              className="w-full justify-start gap-3 hover:bg-primary/10"
              onClick={() => setActiveTab("negociations")}
            >
              <MessageCircle className="w-5 h-5" />
              Négociations
            </Button>

            <Button
              variant={activeTab === "commandes" ? "default" : "ghost"}
              className="w-full justify-start gap-3 hover:bg-primary/10"
              onClick={() => setActiveTab("commandes")}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="flex-1 text-left">
                {isProd ? "Commandes reçues" : "Mes commandes"}
              </span>
              {statsData.commandes_pending > 0 && (
                <span className="w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {statsData.commandes_pending}
                </span>
              )}
            </Button>

            <Button
              variant={activeTab === "route" ? "default" : "ghost"}
              className="w-full justify-start gap-3 hover:bg-primary/10"
              onClick={() => setActiveTab("route")}
            >
              <Route className="w-5 h-5" />
              Optimisation de tournée
            </Button>
          </div>
        </div>

        <div className="p-4 border-t bg-muted/30">
          <div className="bg-card rounded-xl p-3 mb-3 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold shadow">
                {user.prenom?.[0]}
                {user.nom?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sm">
                  {user.prenom} {user.nom}
                </p>
                <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                  {isProd ? (
                    <Leaf className="w-3 h-3" />
                  ) : (
                    <ShoppingBag className="w-3 h-3" />
                  )}
                  {isProd ? "Producteur agricole" : "Acheteur professionnel"}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* ── Contenu principal ── */}
      <div className="flex-1 overflow-auto">
        <header className="h-16 border-b bg-card/95 backdrop-blur-sm px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {activeTab === "home" && `Bonjour, ${user.prenom} 👋`}
            {activeTab === "my-primary" &&
              (isProd ? "Mes récoltes" : "Mes recherches")}
            {activeTab === "all-primary" && "Analyse du marché"}
            {activeTab === "marketplace" && labels.marketplace}
            {activeTab === "suggestions" && labels.suggestions}
            {activeTab === "negociations" && "Négociations en cours"}
            {activeTab === "commandes" &&
              (isProd ? "Commandes reçues" : "Mes commandes")}
            {activeTab === "route" && "Optimisation de tournée"}
          </h1>
          <div className="flex items-center gap-2">
            <NotificationBell
              onMatchClick={() => setActiveTab("suggestions")}
            />
            <Button
              size="sm"
              variant="outline"
              className="gap-2 hover:bg-primary/10"
              onClick={() => {
                if (activeTab === "my-primary") loadMyItems(1);
                if (activeTab === "all-primary")
                  loadPrimaryItems(paginationData.primary.page);
                if (activeTab === "marketplace")
                  loadMarketplaceItems(paginationData.market.page);
                loadStats();
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </Button>
          </div>
        </header>

        <main className="p-8">
          {/* ── HOME ── */}
          {activeTab === "home" && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-8 text-primary-foreground">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-8 w-32 h-32 rounded-full bg-white" />
                  <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-white" />
                </div>
                <div className="relative">
                  <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 bg-white/20 rounded-full text-sm font-medium">
                    <Sprout className="w-4 h-4" />
                    {isProd ? "Espace producteur" : "Espace acheteur"}
                  </div>
                  <h2 className="text-3xl font-bold mb-2">
                    {isProd
                      ? "Vendez vos récoltes au juste prix"
                      : "Approvisionnez-vous auprès des meilleurs producteurs"}
                  </h2>
                  <p className="text-primary-foreground/80 text-sm max-w-lg">
                    {isProd
                      ? "Publiez vos récoltes, trouvez des acheteurs locaux fiables et négociez directement — sans intermédiaires."
                      : "Trouvez des producteurs locaux, comparez les prix et commandez directement à la source."}
                  </p>
                  <div className="flex gap-3 mt-5">
                    <Button
                      className="bg-white text-primary hover:bg-white/90 gap-2 font-semibold shadow-sm"
                      onClick={handleCreate}
                    >
                      <PlusCircle className="w-4 h-4" />
                      {labels.newItem}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white/40 text-white hover:bg-white/10 gap-2"
                      onClick={() => setActiveTab("marketplace")}
                    >
                      {labels.marketplace}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card
                  className="hover:shadow-md transition-all cursor-pointer hover:border-primary/30"
                  onClick={() => setActiveTab("my-primary")}
                >
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="w-4.5 h-4.5 text-primary" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{myItems.length}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {labels.itemsLabel}
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-md transition-all cursor-pointer hover:border-violet-300"
                  onClick={() => setActiveTab("suggestions")}
                >
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                        <Sparkles className="w-4.5 h-4.5 text-violet-600" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold text-violet-600">
                      {statsData.total_matches}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isProd ? "Acheteurs potentiels" : "Producteurs suggérés"}
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
                  onClick={() => setActiveTab("negociations")}
                >
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                        <MessageCircle className="w-4.5 h-4.5 text-blue-600" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {statsData.negociations}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Négociation(s) en cours
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className={`hover:shadow-md transition-all cursor-pointer ${statsData.commandes_pending > 0 ? "border-amber-300 bg-amber-50/50" : "hover:border-amber-300"}`}
                  onClick={() => setActiveTab("commandes")}
                >
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                        <ShoppingCart className="w-4.5 h-4.5 text-amber-600" />
                      </div>
                      {statsData.commandes_pending > 0 && (
                        <Badge className="text-[10px] bg-amber-500 text-white border-0 px-1.5">
                          {statsData.commandes_pending} urgent
                          {statsData.commandes_pending > 1 ? "es" : "e"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-amber-600">
                      {statsData.commandes_pending}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isProd
                        ? "Commande(s) à confirmer"
                        : "Commande(s) en attente"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* ── Widget revenus — producteur seulement ── */}
              {isProd && revenus && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-gradient-to-br from-violet-50 to-violet-100/50 border border-violet-200 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-9 h-9 bg-violet-200 rounded-xl flex items-center justify-center">
                        <Wallet className="w-4.5 h-4.5 text-violet-700" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
                          En coffre-fort
                        </p>
                        <p className="text-[10px] text-violet-500">
                          {revenus.nb_transactions_en_cours} transaction
                          {revenus.nb_transactions_en_cours > 1 ? "s" : ""} en
                          cours
                        </p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-violet-800">
                      {revenus.solde_coffre.toLocaleString()} Ar
                    </p>
                    <p className="text-[10px] text-violet-500 mt-1">
                      Sécurisé · libéré après réception client
                    </p>
                  </div>

                  <div
                    className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl cursor-pointer hover:shadow-md transition-all"
                    onClick={() => setActiveTab("commandes")}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-9 h-9 bg-emerald-200 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-4.5 h-4.5 text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                          Total gagné
                        </p>
                        <p className="text-[10px] text-emerald-500">
                          {revenus.nb_transactions_completees} vente
                          {revenus.nb_transactions_completees > 1
                            ? "s"
                            : ""}{" "}
                          complétée
                          {revenus.nb_transactions_completees > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-emerald-800">
                      {revenus.total_gagne.toLocaleString()} Ar
                    </p>
                    <p className="text-[10px] text-emerald-500 mt-1">
                      Disponible · cliquez pour voir le détail
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Actions rapides
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <button
                    onClick={handleCreate}
                    className="group flex items-center gap-4 p-4 bg-card border rounded-xl hover:border-primary/40 hover:shadow-md transition-all text-left"
                  >
                    <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0">
                      <PlusCircle className="w-5 h-5 text-primary group-hover:text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{labels.newItem}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isProd
                          ? "Atteignez des acheteurs locaux"
                          : "Trouvez des producteurs près de vous"}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-primary transition-colors flex-shrink-0" />
                  </button>

                  <button
                    onClick={() => setActiveTab("marketplace")}
                    className="group flex items-center gap-4 p-4 bg-card border rounded-xl hover:border-orange-300 hover:shadow-md transition-all text-left"
                  >
                    <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-500 transition-colors flex-shrink-0">
                      <Store className="w-5 h-5 text-orange-600 group-hover:text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {labels.marketplace}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isProd
                          ? "Consultez les demandes d'achat"
                          : "Parcourez les récoltes disponibles"}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-orange-500 transition-colors flex-shrink-0" />
                  </button>

                  <button
                    onClick={() => setActiveTab("suggestions")}
                    className="group flex items-center gap-4 p-4 bg-card border rounded-xl hover:border-violet-300 hover:shadow-md transition-all text-left"
                  >
                    <div className="w-11 h-11 bg-violet-100 rounded-xl flex items-center justify-center group-hover:bg-violet-500 transition-colors flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-violet-600 group-hover:text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {labels.suggestions}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Correspondances calculées par notre algorithme
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-violet-500 transition-colors flex-shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── MES RÉCOLTES / MES RECHERCHES ── */}
          {activeTab === "my-primary" && (
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {isProd ? (
                      <Leaf className="w-5 h-5 text-primary" />
                    ) : (
                      <ShoppingBag className="w-5 h-5 text-primary" />
                    )}
                    {isProd ? "Mes récoltes" : "Mes recherches"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {paginationData.my.total} {labels.itemsLabel}
                    {" · "}cliquez sur une ligne pour voir les opportunités
                  </p>
                </div>
                <Button onClick={handleCreate} className="gap-2 shadow-sm">
                  <PlusCircle className="w-4 h-4" />
                  {labels.newItem}
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex justify-center py-16">
                    <OrganicSproutLoader text="Chargement de vos publications..." />
                  </div>
                ) : myItems.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                      {isProd ? (
                        <Leaf className="w-10 h-10 text-muted-foreground" />
                      ) : (
                        <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {isProd
                        ? "Publiez votre première récolte"
                        : "Publiez votre première recherche"}
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {isProd
                        ? "Atteignez des centaines d'acheteurs locaux et vendez vos récoltes au juste prix, sans intermédiaires."
                        : "Décrivez vos besoins et laissez les producteurs locaux venir à vous."}
                    </p>
                    <Button size="lg" onClick={handleCreate} className="gap-2">
                      <PlusCircle className="w-5 h-5" />
                      {labels.newItem}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">
                              Produit
                            </TableHead>
                            <TableHead className="font-semibold">
                              Quantité
                            </TableHead>
                            <TableHead className="font-semibold">
                              {isProd ? "Prix / unité" : "Budget max"}
                            </TableHead>
                            <TableHead className="font-semibold">
                              Région
                            </TableHead>
                            <TableHead className="font-semibold">
                              Statut
                            </TableHead>
                            <TableHead className="font-semibold">
                              Opportunités
                            </TableHead>
                            <TableHead className="text-right font-semibold">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...myItems]
                            .sort((a, b) => {
                              if (isEpuise(a) && !isEpuise(b)) return 1;
                              if (!isEpuise(a) && isEpuise(b)) return -1;
                              if (isExpired(a) && !isExpired(b)) return 1;
                              if (!isExpired(a) && isExpired(b)) return -1;
                              return 0;
                            })
                            .map((item) => {
                              const expired = isExpired(item);
                              const epuise = isEpuise(item);
                              const inactive = expired || epuise;
                              return (
                                <TableRow
                                  key={item.id}
                                  onClick={() => {
                                    if (!inactive)
                                      openProductSuggestions(
                                        item.product_id,
                                        item.product?.nom ?? "",
                                      );
                                  }}
                                  className={`transition-colors ${inactive ? "opacity-50 bg-muted/20 cursor-default" : "hover:bg-primary/5 cursor-pointer"}`}
                                >
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${inactive ? "bg-muted" : "bg-primary/10"}`}
                                      >
                                        <Package
                                          className={`w-4 h-4 ${inactive ? "text-muted-foreground" : "text-primary"}`}
                                        />
                                      </div>
                                      <div>
                                        <p
                                          className={`font-medium text-sm ${inactive ? "line-through text-muted-foreground" : ""}`}
                                        >
                                          {item.product?.nom ||
                                            `Produit #${item.product_id}`}
                                        </p>
                                        {item.product?.categorie && (
                                          <p className="text-xs text-muted-foreground">
                                            {item.product.categorie}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <span className="text-sm font-medium">
                                        {Number(item.quantite)}{" "}
                                        {item.product?.unite || "kg"}
                                      </span>
                                      {isProd &&
                                        item.quantite_restante !== null &&
                                        item.quantite_restante !==
                                          undefined && (
                                          <p className="text-xs text-muted-foreground">
                                            {Number(item.quantite_restante)}{" "}
                                            restant(s)
                                          </p>
                                        )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span
                                      className={`text-sm font-semibold ${inactive ? "text-muted-foreground" : "text-green-600"}`}
                                    >
                                      {(isProd
                                        ? item.prix_unitaire
                                        : item.budget_max
                                      )?.toLocaleString()}{" "}
                                      Ar
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="secondary"
                                      className="gap-1 text-xs"
                                    >
                                      <MapPin className="w-3 h-3" />
                                      {item.region}
                                    </Badge>
                                  </TableCell>
                                  <TableCell
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <DeadlineBadge item={item} />
                                  </TableCell>
                                  <TableCell>
                                    {inactive ? (
                                      <span className="text-xs text-muted-foreground">
                                        —
                                      </span>
                                    ) : (
                                      <Badge className="gap-1 text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer">
                                        <Sparkles className="w-2.5 h-2.5" />
                                        Voir
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell
                                    className="text-right"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex justify-end gap-1.5">
                                      {isProd && !epuise && (
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() =>
                                            handleMarkEpuise(item.id)
                                          }
                                          className="h-8 w-8 hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300"
                                          title="Marquer comme épuisé"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleEdit(item)}
                                        className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleDelete(item.id)}
                                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                    <StandardPagination
                      page={paginationData.my.page}
                      totalPages={paginationData.my.total_pages}
                      onChange={(p) => loadMyItems(p)}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── ANALYSE MARCHÉ ── */}
          {activeTab === "all-primary" && (
            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <SearchBarWithTrie
                      value={searchQuery}
                      onChange={handleSearch}
                      suggestions={searchSuggestions}
                      suggestionsOpen={searchOpen}
                      onSelectSuggestion={(s) => {
                        setSearchQuery(s);
                        setSearchOpen(false);
                      }}
                      onClear={() => {
                        setSearchQuery("");
                        setSearchSuggestions([]);
                        setSearchOpen(false);
                      }}
                      onFocus={() =>
                        searchSuggestions.length > 0 && setSearchOpen(true)
                      }
                      placeholder="Rechercher un produit, une région..."
                      searchRef={searchRef}
                    />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BarChart3 className="w-4 h-4" />
                      <span>Analysez les prix du marché en temps réel</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {loading ? (
                <div className="flex justify-center py-20">
                  <OrganicSproutLoader text="Analyse du marché en cours..." />
                </div>
              ) : primaryItems.length === 0 ? (
                <Card>
                  <CardContent className="py-20 text-center">
                    <BarChart3 className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      Aucune donnée disponible
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Les annonces des autres utilisateurs apparaîtront ici.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {filterBySearch(primaryItems).length}
                    </span>{" "}
                    annonce(s) sur le marché
                  </p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filterBySearch(primaryItems).map((item) => (
                      <Card
                        key={item.id}
                        className="hover:shadow-lg transition-all border hover:border-primary/30 group"
                      >
                        <CardContent className="p-5">
                          {/* Image si disponible — Analyse marché */}
                          {item.image_base64 && (
                            <div className="w-full h-28 overflow-hidden rounded-xl mb-3">
                              <img
                                src={`data:image/jpeg;base64,${item.image_base64}`}
                                alt={item.product?.nom}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex items-start gap-3 mb-4 pb-3 border-b">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                              {isProd
                                ? item.producteur?.prenom?.[0]
                                : item.acheteur?.prenom?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {isProd
                                  ? `${item.producteur?.prenom} ${item.producteur?.nom}`
                                  : `${item.acheteur?.prenom} ${item.acheteur?.nom}`}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {item.region}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <p className="font-bold">
                              {item.product?.nom ||
                                `Produit #${item.product_id}`}
                            </p>

                            {/* Description */}
                            {item.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}

                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                  Quantité
                                </span>
                                <span className="font-semibold">
                                  {Number(item.quantite)} {item.product?.unite}
                                </span>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                  {isProd ? "Prix" : "Budget"}
                                </span>
                                <span className="font-semibold text-green-600">
                                  {(isProd
                                    ? item.prix_unitaire
                                    : item.budget_max
                                  )?.toLocaleString()}{" "}
                                  Ar
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t mt-3 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.created_at).toLocaleDateString(
                                "fr-FR",
                                { day: "numeric", month: "short" },
                              )}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(item.id)}
                              className="gap-1.5 text-xs group-hover:bg-primary group-hover:text-white transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Voir plus
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <StandardPagination
                    page={paginationData.primary.page}
                    totalPages={paginationData.primary.total_pages}
                    onChange={(p) => loadPrimaryItems(p)}
                  />
                </>
              )}
            </div>
          )}

          {/* ── MARKETPLACE ── */}
          {activeTab === "marketplace" && (
            <div className="space-y-6">
              <Card
                className={`shadow-sm ${isProd ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200" : "bg-gradient-to-r from-orange-50 to-red-50 border-orange-200"}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <SearchBarWithTrie
                      value={searchQuery}
                      onChange={handleSearch}
                      suggestions={searchSuggestions}
                      suggestionsOpen={searchOpen}
                      onSelectSuggestion={(s) => {
                        setSearchQuery(s);
                        setSearchOpen(false);
                      }}
                      onClear={() => {
                        setSearchQuery("");
                        setSearchSuggestions([]);
                        setSearchOpen(false);
                      }}
                      onFocus={() =>
                        searchSuggestions.length > 0 && setSearchOpen(true)
                      }
                      placeholder={
                        isProd
                          ? "Rechercher une demande d'achat..."
                          : "Rechercher un produit local..."
                      }
                      searchRef={searchRef}
                    />
                    <div
                      className={`flex items-center gap-2 text-sm font-medium ${isProd ? "text-blue-700" : "text-orange-700"}`}
                    >
                      {isProd ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        <Flame className="w-4 h-4" />
                      )}
                      {isProd
                        ? "Demandes d'achat en direct"
                        : "Récoltes disponibles maintenant"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {loading ? (
                <div className="flex justify-center py-20">
                  <OrganicSproutLoader
                    text={
                      isProd
                        ? "Recherche des acheteurs..."
                        : "Recherche des producteurs..."
                    }
                  />
                </div>
              ) : marketplaceItems.length === 0 ? (
                <Card>
                  <CardContent className="py-20 text-center">
                    <Store className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      Aucune annonce disponible
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Revenez bientôt — de nouvelles annonces sont publiées
                      chaque jour.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {filterBySearch(marketplaceItems).length}
                    </span>{" "}
                    {isProd ? "demande(s) d'achat" : "récolte(s) disponible(s)"}
                  </p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filterBySearch(marketplaceItems).map((item) => {
                      const contact = isProd ? item.acheteur : item.producteur;
                      const isOfferItem = !isProd;
                      return (
                        <Card
                          key={item.id}
                          className={`hover:shadow-lg transition-all border-2 group relative overflow-hidden ${isProd ? "hover:border-blue-300" : "hover:border-orange-300"}`}
                        >
                          <div
                            className={`absolute top-0 right-0 w-16 h-16 opacity-10 rounded-bl-full ${isProd ? "bg-blue-500" : "bg-orange-500"}`}
                          />
                          <CardContent className="p-5 relative">
                            {/* Header */}
                            <div className="flex items-start gap-3 mb-4 pb-3 border-b">
                              <div
                                className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-sm flex-shrink-0 ${isProd ? "bg-gradient-to-br from-blue-500 to-indigo-600" : "bg-gradient-to-br from-orange-400 to-red-500"}`}
                              >
                                {contact?.prenom?.[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">
                                  {contact
                                    ? `${contact.prenom} ${contact.nom}`
                                    : "—"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {isProd
                                    ? "Acheteur vérifié"
                                    : "Producteur local"}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                  <MapPin className="w-3 h-3" />
                                  {item.region}
                                </div>
                              </div>
                            </div>

                            {/* Image si disponible — Marketplace */}
                            {item.image_base64 && (
                              <div className="relative w-full h-36 overflow-hidden rounded-xl mb-3">
                                <img
                                  src={item.image_base64}
                                  alt={item.product?.nom}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                              </div>
                            )}

                            {/* Produit */}
                            <div className="mb-3">
                              <p className="font-bold text-base">
                                {item.product?.nom}
                              </p>

                              {/* Description */}
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                  {item.description}
                                </p>
                              )}

                              <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                                <div className="flex flex-col gap-0.5 p-2 bg-muted/50 rounded-lg">
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                    Quantité
                                  </span>
                                  <span className="font-semibold flex items-center gap-1">
                                    <Scale className="w-3 h-3" />
                                    {Number(item.quantite)}{" "}
                                    {item.product?.unite}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-0.5 p-2 bg-green-50 rounded-lg">
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                    {isProd ? "Budget max" : "Prix / unité"}
                                  </span>
                                  <span className="font-bold text-green-600 flex items-center gap-1">
                                    <Banknote className="w-3 h-3" />
                                    {(isProd
                                      ? item.budget_max
                                      : item.prix_unitaire
                                    )?.toLocaleString()}{" "}
                                    Ar
                                  </span>
                                </div>
                              </div>

                              {/* Stock restant */}
                              {isOfferItem &&
                                item.quantite_restante !== null &&
                                item.quantite_restante !== undefined && (
                                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                    <Scale className="w-3 h-3" />
                                    {Number(item.quantite_restante)}{" "}
                                    {item.product?.unite} encore disponibles
                                  </p>
                                )}

                              {/* Badges livraison/retrait — acheteur voit des offres */}
                              {!isProd && (
                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                  {item.livraison_possible && (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-orange-50 text-orange-700 px-2 py-1 rounded-lg border border-orange-200">
                                      <Truck className="w-3 h-3" />
                                      Livraison possible
                                    </span>
                                  )}
                                  {item.retrait_possible && (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-muted/60 text-muted-foreground px-2 py-1 rounded-lg">
                                      <Home className="w-3 h-3" />
                                      Retrait sur place
                                    </span>
                                  )}
                                  {item.quantite_min_commande && (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-200">
                                      <Scale className="w-3 h-3" />
                                      Min. {Number(
                                        item.quantite_min_commande,
                                      )}{" "}
                                      {item.product?.unite}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Badge fréquence — producteur voit des demandes */}
                              {isProd &&
                                item.frequence &&
                                item.frequence !== "unique" && (
                                  <div className="flex gap-1.5 mt-2">
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-violet-50 text-violet-700 px-2 py-1 rounded-lg border border-violet-200">
                                      <RotateCcw className="w-3 h-3" />
                                      {item.frequence === "hebdomadaire"
                                        ? "Besoin hebdomadaire"
                                        : item.frequence === "mensuel"
                                          ? "Besoin mensuel"
                                          : "Besoin régulier"}
                                    </span>
                                  </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="pt-3 border-t flex items-center justify-between gap-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(item.created_at).toLocaleDateString(
                                  "fr-FR",
                                  { day: "numeric", month: "short" },
                                )}
                              </span>
                              <div className="flex gap-1.5">
                                {/* Acheteur voit des offres → Commander */}
                                {!isProd && (
                                  <Button
                                    size="sm"
                                    className="gap-1.5 text-xs h-8 bg-gradient-to-r from-primary to-primary/80"
                                    onClick={() => handleCheckout(item)}
                                    disabled={item.statut === "epuise"}
                                  >
                                    {item.statut === "epuise" ? (
                                      "Épuisé"
                                    ) : (
                                      <>
                                        <ShoppingCart className="w-3.5 h-3.5" />
                                        Commander
                                      </>
                                    )}
                                  </Button>
                                )}

                                {/* Producteur voit des demandes → Proposer mon offre */}
                                {isProd && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                                    onClick={() =>
                                      openProductSuggestions(
                                        item.product_id,
                                        item.product?.nom ?? "",
                                      )
                                    }
                                  >
                                    <Star className="w-3.5 h-3.5" />
                                    Proposer mon offre
                                  </Button>
                                )}

                                {/* Négocier pour tous */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1.5 text-xs h-8"
                                  onClick={() =>
                                    handleNegocierMarketplace(item)
                                  }
                                  disabled={marketNegociatLoading === item.id}
                                >
                                  {marketNegociatLoading === item.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  )}
                                  Négocier
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  <StandardPagination
                    page={paginationData.market.page}
                    totalPages={paginationData.market.total_pages}
                    onChange={(p) => loadMarketplaceItems(p)}
                  />
                </>
              )}
            </div>
          )}

          {/* ── SUGGESTIONS ── */}
          {activeTab === "suggestions" && (
            <SuggestionsTab user={user} onRefresh={refreshAll} />
          )}

          {/* ── NÉGOCIATIONS ── */}
          {activeTab === "negociations" && (
            <NegociationsPanel user={user} onRefresh={refreshAll} />
          )}

          {/* ── COMMANDES ── */}
          {activeTab === "commandes" && (
            <CommandesPage user={user} onRefresh={refreshAll} />
          )}

          {/* ── ROUTE ── */}
          {activeTab === "route" && (
            <Card className="shadow-lg">
              <CardContent className="py-20 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                  <Route className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Optimisation de tournée
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4 text-sm">
                  Planifiez vos tournées de {isProd ? "livraison" : "collecte"}{" "}
                  de manière optimale. Notre algorithme calcule le chemin le
                  plus court pour visiter plusieurs points en une seule sortie.
                </p>
                <Badge variant="secondary" className="px-4 py-1.5 text-sm">
                  Disponible prochainement
                </Badge>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* ── Dialog Détails ── */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {selectedItem?.product?.nom || "Détails"}
            </DialogTitle>
            <DialogDescription>
              Publié le{" "}
              {selectedItem &&
                new Date(selectedItem.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && displayUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-xl shadow-md">
                  {displayUser.prenom?.[0]}
                  {displayUser.nom?.[0]}
                </div>
                <div className="flex-1">
                  <p className="font-bold">
                    {displayUser.prenom} {displayUser.nom}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {selectedItem.region}
                  </p>
                  {displayUser.telephone && (
                    <p className="text-xs font-semibold text-primary flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      {displayUser.telephone}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                    Produit
                  </p>
                  <p className="font-bold">{selectedItem.product?.nom}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedItem.product?.categorie}
                  </p>
                </div>
                <div className="p-3 border rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                    Quantité
                  </p>
                  <p className="font-bold">
                    {selectedItem.quantite} {selectedItem.product?.unite}
                  </p>
                  {selectedItem.quantite_restante && (
                    <p className="text-xs text-muted-foreground">
                      {selectedItem.quantite_restante} restant(s)
                    </p>
                  )}
                </div>
                <div className="p-3 border rounded-xl col-span-2 bg-green-50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                    {activeTab === "marketplace"
                      ? isProd
                        ? "Budget maximum"
                        : "Prix unitaire"
                      : isProd
                        ? "Prix unitaire"
                        : "Budget maximum"}
                  </p>
                  <p className="font-bold text-xl text-green-600">
                    {(activeTab === "marketplace"
                      ? isProd
                        ? selectedItem.budget_max
                        : selectedItem.prix_unitaire
                      : isProd
                        ? selectedItem.prix_unitaire
                        : selectedItem.budget_max
                    )?.toLocaleString()}{" "}
                    <span className="text-sm font-normal">
                      Ar / {selectedItem.product?.unite}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {!isProd && selectedItem.statut !== "epuise" && (
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => handleCheckout(selectedItem)}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Commander maintenant
                  </Button>
                )}
                {displayUser.telephone && (
                  <Button
                    variant="outline"
                    className="gap-2 flex-1"
                    onClick={() => window.open(`tel:${displayUser.telephone}`)}
                  >
                    <Phone className="w-4 h-4" />
                    Appeler
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setDetailsOpen(false);
                    openProductSuggestions(
                      selectedItem.product_id,
                      selectedItem.product?.nom ?? "",
                    );
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── ProductSuggestionsDialog ── */}
      <ProductSuggestionsDialog
        open={productSuggestionsOpen}
        onClose={() => setProductSuggestionsOpen(false)}
        productId={selectedProductId}
        productName={selectedProductName}
        user={user}
        onNegociate={(s) => {
          setNegociationData(s);
          setNegociationOpen(true);
        }}
      />

      {/* ── NegociationChat (depuis suggestions) ── */}
      <NegociationChat
        open={negociationOpen}
        onClose={() => setNegociationOpen(false)}
        matchId={negociationData?.match_id ?? null}
        contactNom={negociationData?.contact_nom ?? ""}
        productName={negociationData?.product_name ?? ""}
        productUnite={negociationData?.product_unite}
        contactTelephone={negociationData?.contact_telephone}
        matchStatut={negociationData?.match_statut}
      />

      {/* ── NegociationChat (depuis marketplace) ── */}
      <NegociationChat
        open={marketNegociatOpen}
        onClose={() => {
          setMarketNegociatOpen(false);
          setMarketNegociatData(null);
        }}
        matchId={marketNegociatData?.match_id ?? null}
        contactNom={marketNegociatData?.contact_nom ?? ""}
        productName={marketNegociatData?.product_name ?? ""}
        productUnite={marketNegociatData?.product_unite}
        contactTelephone={marketNegociatData?.contact_telephone}
        matchStatut={marketNegociatData?.match_statut}
        isAcheteur={!isProd}
        offerId={marketNegociatData?.offer_id}
        offerPrixUnitaire={marketNegociatData?.offer_prix_unitaire}
        offerQuantite={marketNegociatData?.offer_quantite}
        offerQuantiteRestante={marketNegociatData?.offer_quantite_restante}
        producteurNom={marketNegociatData?.producteur_nom}
        producteurRegion={marketNegociatData?.producteur_region}
      />

      {/* ── CheckoutDialog ── */}
      {checkoutOffer && (
        <CheckoutDialog
          open={checkoutOpen}
          onClose={() => {
            setCheckoutOpen(false);
            setCheckoutOffer(null);
          }}
          offer={checkoutOffer}
          onSuccess={() => {
            loadStats();
            loadMarketplaceItems(1);
            loadRevenus();
          }}
        />
      )}

      {/* ── CrudDialog ── */}
      <CrudDialog
        open={crudOpen}
        onClose={() => setCrudOpen(false)}
        mode={crudMode}
        type={isProd ? "offer" : "demand"}
        item={crudItem}
        user={user}
        onSuccess={() => {
          loadMyItems(1);
          loadStats();
          loadMarketplaceItems(1);
        }}
      />
    </div>
  );
}

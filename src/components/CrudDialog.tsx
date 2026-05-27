import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/axios";
import { REGION_COORDS } from "@/helpers/region";
import {
  Package,
  Scale,
  Banknote,
  Calendar,
  Search,
  Loader2,
  PlusCircle,
  Pencil,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Leaf,
  Tag,
  Ruler,
  MapPin,
  ArrowRight,
} from "lucide-react";

interface Product {
  id: number;
  nom: string;
  categorie: string;
  unite: string;
  description?: string;
}

interface CrudDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  type: "offer" | "demand";
  item?: any;
  user: any;
  onSuccess: () => void;
}

const CATEGORIES = [
  "Céréales",
  "Tubercules",
  "Légumes",
  "Légumineuses",
  "Fruits",
  "Épices",
  "Produits laitiers",
  "Produits naturels",
  "Autre",
];

const UNITES = ["kg", "g", "tonne", "litre", "unité", "sac", "botte", "caisse"];

const STEPS_OFFER = ["Produit", "Détails", "Localisation"];
const STEPS_DEMAND = ["Produit", "Détails", "Confirmation"];

export default function CrudDialog({
  open,
  onClose,
  mode,
  type,
  item,
  user,
  onSuccess,
}: CrudDialogProps) {
  const isOffer = type === "offer";
  const isEdit = mode === "edit";
  const STEPS = isOffer ? STEPS_OFFER : STEPS_DEMAND;

  // Step
  const [step, setStep] = useState(0);

  // Step 1 — Produit
  const [prodSearch, setProdSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [prodFiltered, setProdFiltered] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [prodOpen, setProdOpen] = useState(false);
  const [loadingProds, setLoadingProds] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);

  // Création nouveau produit
  const [newProdNom, setNewProdNom] = useState("");
  const [newProdCategorie, setNewProdCategorie] = useState("");
  const [newProdUnite, setNewProdUnite] = useState("kg");
  const [savingProd, setSavingProd] = useState(false);

  // Step 2 — Détails
  const [quantite, setQuantite] = useState("");
  const [prixOuBudget, setPrixOuBudget] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [dateSouhaitee, setDateSouhaitee] = useState("");

  // Submit
  const [submitting, setSubmitting] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  const [dureeDisponibilite, setDureeDisponibilite] = useState("epuisement");

  // Charger produits
  useEffect(() => {
    if (!open) return;
    fetchProducts();
  }, [open]);

  // Pré-remplir en mode edit
  useEffect(() => {
    if (!open) return;
    if (isEdit && item) {
      setQuantite(String(item.quantite ?? ""));
      setPrixOuBudget(
        isOffer
          ? String(item.prix_unitaire ?? "")
          : String(item.budget_max ?? ""),
      );
      setDateDebut(item.date_dispo_debut ?? "");
      setDateFin(item.date_dispo_fin ?? "");

      // ── AJOUT : pré-remplir la durée de disponibilité ──
      if (isOffer) {
        if (item.date_dispo_fin) {
          setDureeDisponibilite("precise");
        } else {
          setDureeDisponibilite("epuisement");
        }
      }
      // ── FIN AJOUT ──

      setDateSouhaitee(item.date_souhaitee ?? "");
      if (item.product) {
        setSelectedProduct(item.product);
        setProdSearch(item.product.nom);
      }
      setStep(isEdit ? 1 : 0);
    } else {
      resetAll();
    }
  }, [open, item, isEdit]);

  // Filtre produits
  useEffect(() => {
    if (!prodSearch.trim()) {
      setProdFiltered(products.slice(0, 12));
      return;
    }
    const q = prodSearch.toLowerCase();
    setProdFiltered(
      products
        .filter(
          (p) =>
            p.nom.toLowerCase().includes(q) ||
            p.categorie.toLowerCase().includes(q),
        )
        .slice(0, 12),
    );
  }, [prodSearch, products]);

  // Fermer dropdown au clic dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setProdOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchProducts = async () => {
    setLoadingProds(true);
    try {
      const res = await api.get("/products?limit=200");
      setProducts(res.data);
      setProdFiltered(res.data.slice(0, 12));
    } catch {
      toast.error("Impossible de charger les produits");
    } finally {
      setLoadingProds(false);
    }
  };

  const resetAll = () => {
    setStep(0);
    setProdSearch("");
    setSelectedProduct(null);
    setProdOpen(false);
    setCreatingProduct(false);
    setNewProdNom("");
    setNewProdCategorie("");
    setNewProdUnite("kg");
    setQuantite("");
    setPrixOuBudget("");
    setDateDebut("");
    setDateFin("");
    setDateSouhaitee("");
    setDureeDisponibilite("epuisement");
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const selectProduct = (p: Product) => {
    setSelectedProduct(p);
    setProdSearch(p.nom);
    setProdOpen(false);
    setCreatingProduct(false);
  };

  const handleCreateProduct = async () => {
    if (!newProdNom.trim()) {
      toast.error("Nom du produit requis");
      return;
    }
    if (!newProdCategorie) {
      toast.error("Catégorie requise");
      return;
    }
    setSavingProd(true);
    try {
      const res = await api.post("/products/", {
        nom: newProdNom.trim(),
        categorie: newProdCategorie,
        unite: newProdUnite,
        description: "",
      });
      const newProd = res.data;
      setProducts((prev) => [...prev, newProd]);
      selectProduct(newProd);
      toast.success(`Produit "${newProd.nom}" créé avec succès`);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail ?? "Erreur lors de la création du produit",
      );
    } finally {
      setSavingProd(false);
    }
  };

  const handleNextStep = () => {
    if (step === 0) {
      if (!selectedProduct) {
        toast.error("Veuillez choisir un produit");
        return;
      }
    }
    if (step === 1) {
      if (!quantite || Number(quantite) <= 0) {
        toast.error("Quantité invalide");
        return;
      }
      if (isOffer && (!prixOuBudget || Number(prixOuBudget) <= 0)) {
        toast.error("Prix unitaire invalide");
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    const region = user?.region ?? "Analamanga";
    const coords = REGION_COORDS[region] ?? { lat: -18.8792, lng: 47.5079 };

    const payload: any = {
      product_id: selectedProduct!.id,
      quantite: Number(quantite),
      latitude: coords.lat,
      longitude: coords.lng,
      region,
    };

    if (isOffer) {
      payload.prix_unitaire = Number(prixOuBudget);
      if (dateDebut) payload.date_dispo_debut = dateDebut;
      if (dateFin) payload.date_dispo_fin = dateFin;
    } else {
      if (prixOuBudget) payload.budget_max = Number(prixOuBudget);
      if (dateSouhaitee) payload.date_souhaitee = dateSouhaitee;
    }

    setSubmitting(true);
    try {
      const endpoint = isOffer ? "/offers" : "/demands";
      if (isEdit) {
        await api.put(`${endpoint}/${item.id}`, payload);
        toast.success(
          `${isOffer ? "Récolte" : "Recherche"} modifiée avec succès`,
        );
      } else {
        await api.post(`${endpoint}/`, payload);
        toast.success(
          `${isOffer ? "Récolte publiée" : "Recherche publiée"} — notre algorithme cherche des correspondances`,
        );
      }
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  // Indicateur d'étapes
  const StepIndicator = () => (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={`text-xs mt-1.5 font-medium ${i === step ? "text-primary" : "text-muted-foreground"}`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-0.5 flex-1 mx-2 mb-5 transition-all ${i < step ? "bg-primary" : "bg-border"}`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="w-[80vw] max-w-[80vw] max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div
          className={`px-8 pt-8 pb-6 border-b ${isOffer ? "bg-gradient-to-r from-primary/5 to-primary/10" : "bg-gradient-to-r from-blue-50 to-indigo-50"}`}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${isOffer ? "bg-gradient-to-br from-primary to-primary/80" : "bg-gradient-to-br from-blue-500 to-indigo-600"}`}
              >
                {isEdit ? (
                  <Pencil className="w-5 h-5" />
                ) : (
                  <PlusCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  {isEdit
                    ? `Modifier ${isOffer ? "ma récolte" : "ma recherche"}`
                    : isOffer
                      ? "Publier une nouvelle récolte"
                      : "Publier une nouvelle recherche"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isOffer
                    ? "Atteignez des acheteurs locaux et vendez au juste prix"
                    : "Trouvez les meilleurs producteurs près de chez vous"}
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-8 py-6">
          <StepIndicator />

          {/* ── ÉTAPE 1 : Produit ── */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  {isOffer
                    ? "Quel produit souhaitez-vous vendre ?"
                    : "Quel produit recherchez-vous ?"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Recherchez dans notre catalogue ou créez un nouveau produit
                  s'il n'existe pas encore.
                </p>
              </div>

              {/* Recherche produit */}
              {!creatingProduct && (
                <div className="space-y-3" ref={searchRef}>
                  <Label className="text-sm font-medium">
                    Rechercher un produit
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      value={prodSearch}
                      onChange={(e) => {
                        setProdSearch(e.target.value);
                        setProdOpen(true);
                        if (!e.target.value) {
                          setSelectedProduct(null);
                        }
                      }}
                      onFocus={() => setProdOpen(true)}
                      placeholder={
                        loadingProds
                          ? "Chargement..."
                          : "Ex : Riz, Tomate, Vanille..."
                      }
                      className="pl-11 pr-10 h-12 text-base"
                      disabled={loadingProds}
                    />
                    {selectedProduct && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(null);
                          setProdSearch("");
                          setProdOpen(true);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown résultats */}
                  {prodOpen && !loadingProds && (
                    <div className="border rounded-xl shadow-lg overflow-hidden bg-card">
                      {prodFiltered.length === 0 ? (
                        <div className="p-6 text-center">
                          <Package className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">
                            Aucun produit trouvé pour "{prodSearch}"
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Vous pouvez créer ce produit ci-dessous
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 max-h-64 overflow-y-auto divide-y">
                          {prodFiltered.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => selectProduct(p)}
                              className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-primary/5 transition-colors ${selectedProduct?.id === p.id ? "bg-primary/10" : ""}`}
                            >
                              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Leaf className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {p.nom}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {p.categorie} · {p.unite}
                                </p>
                              </div>
                              {selectedProduct?.id === p.id && (
                                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Produit sélectionné */}
                  {selectedProduct && (
                    <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <Leaf className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{selectedProduct.nom}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedProduct.categorie} · Unité :{" "}
                          {selectedProduct.unite}
                        </p>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        Sélectionné
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Séparateur */}
              {!creatingProduct && (
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Produit introuvable ?
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}

              {/* Créer un nouveau produit */}
              {!creatingProduct ? (
                <Button
                  variant="outline"
                  className="w-full h-12 gap-2 border-dashed"
                  onClick={() => {
                    setCreatingProduct(true);
                    setProdOpen(false);
                  }}
                >
                  <PlusCircle className="w-4 h-4" />
                  Créer un nouveau produit
                </Button>
              ) : (
                <div className="border rounded-xl p-6 space-y-5 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">
                        Créer un nouveau produit
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ce produit sera ajouté au catalogue pour tous les
                        utilisateurs
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCreatingProduct(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                        Nom du produit{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={newProdNom}
                        onChange={(e) => setNewProdNom(e.target.value)}
                        placeholder="Ex : Pomme de terre violette, Miel de forêt..."
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-muted-foreground" />
                        Catégorie <span className="text-destructive">*</span>
                      </Label>
                      <select
                        value={newProdCategorie}
                        onChange={(e) => setNewProdCategorie(e.target.value)}
                        className="w-full h-11 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Choisir une catégorie</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                        Unité de mesure{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <select
                        value={newProdUnite}
                        onChange={(e) => setNewProdUnite(e.target.value)}
                        className="w-full h-11 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {UNITES.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Button
                    className="w-full h-11 gap-2"
                    onClick={handleCreateProduct}
                    disabled={
                      savingProd || !newProdNom.trim() || !newProdCategorie
                    }
                  >
                    {savingProd ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <PlusCircle className="w-4 h-4" />
                    )}
                    {savingProd
                      ? "Création en cours..."
                      : "Créer et sélectionner ce produit"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── ÉTAPE 2 : Détails ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  {isOffer
                    ? "Détails de votre récolte"
                    : "Détails de votre recherche"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Renseignez les informations précises pour maximiser vos
                  chances de correspondance.
                </p>
              </div>

              {/* Produit sélectionné résumé */}
              {selectedProduct && (
                <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {selectedProduct.nom}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedProduct.categorie}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {selectedProduct.unite}
                  </Badge>
                </div>
              )}

              <div className="grid grid-cols-2 gap-5">
                {/* Quantité */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-muted-foreground" />
                    Quantité ({selectedProduct?.unite ?? "kg"}){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={quantite}
                    onChange={(e) => setQuantite(e.target.value)}
                    placeholder="Ex : 500"
                    className="h-12 text-base"
                  />
                  {quantite && Number(quantite) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {Number(quantite).toLocaleString()}{" "}
                      {selectedProduct?.unite}
                    </p>
                  )}
                </div>

                {/* Prix / Budget */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-muted-foreground" />
                    {isOffer
                      ? `Prix / ${selectedProduct?.unite ?? "kg"} (Ar)`
                      : "Budget maximum (Ar)"}
                    {isOffer && <span className="text-destructive">*</span>}
                    {!isOffer && (
                      <span className="text-xs text-muted-foreground font-normal">
                        (optionnel)
                      </span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={prixOuBudget}
                    onChange={(e) => setPrixOuBudget(e.target.value)}
                    placeholder={isOffer ? "Ex : 3 500" : "Ex : 100 000"}
                    className="h-12 text-base"
                  />
                  {prixOuBudget &&
                    quantite &&
                    Number(prixOuBudget) > 0 &&
                    Number(quantite) > 0 && (
                      <p className="text-xs text-green-600 font-medium">
                        Total estimé :{" "}
                        {(
                          Number(prixOuBudget) * Number(quantite)
                        ).toLocaleString()}{" "}
                        Ar
                      </p>
                    )}
                </div>

                {/* Dates */}
                {isOffer && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        Disponible à partir du
                      </Label>
                      <Input
                        type="date"
                        value={dateDebut}
                        onChange={(e) => setDateDebut(e.target.value)}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        Durée de disponibilité
                      </Label>
                      <select
                        value={dureeDisponibilite}
                        onChange={(e) => {
                          setDureeDisponibilite(e.target.value);
                          // Calculer automatiquement dateFin
                          if (e.target.value === "epuisement") {
                            setDateFin("");
                          } else if (e.target.value === "1semaine") {
                            const d = new Date();
                            d.setDate(d.getDate() + 7);
                            setDateFin(d.toISOString().split("T")[0]);
                          } else if (e.target.value === "2semaines") {
                            const d = new Date();
                            d.setDate(d.getDate() + 14);
                            setDateFin(d.toISOString().split("T")[0]);
                          } else if (e.target.value === "1mois") {
                            const d = new Date();
                            d.setMonth(d.getMonth() + 1);
                            setDateFin(d.toISOString().split("T")[0]);
                          } else if (e.target.value === "3mois") {
                            const d = new Date();
                            d.setMonth(d.getMonth() + 3);
                            setDateFin(d.toISOString().split("T")[0]);
                          }
                          // "precise" → on laisse l'utilisateur choisir la date
                        }}
                        className="w-full h-12 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="epuisement">
                          Jusqu'à épuisement du stock
                        </option>
                        <option value="1semaine">1 semaine</option>
                        <option value="2semaines">2 semaines</option>
                        <option value="1mois">1 mois</option>
                        <option value="3mois">3 mois</option>
                        <option value="precise">Date précise</option>
                      </select>

                      {/* Champ date précise — visible seulement si "precise" */}
                      {dureeDisponibilite === "precise" && (
                        <div className="mt-2 space-y-1">
                          <Input
                            type="date"
                            value={dateFin}
                            min={
                              dateDebut ||
                              new Date().toISOString().split("T")[0]
                            }
                            onChange={(e) => setDateFin(e.target.value)}
                            className="h-12"
                          />
                          <p className="text-xs text-muted-foreground">
                            Choisissez la date exacte de fin de disponibilité
                          </p>
                        </div>
                      )}

                      {/* Info sur la valeur calculée */}
                      {dureeDisponibilite !== "epuisement" &&
                        dureeDisponibilite !== "precise" &&
                        dateFin && (
                          <p className="text-xs text-primary font-medium">
                            Votre récolte sera disponible jusqu'au{" "}
                            {new Date(dateFin).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        )}

                      {dureeDisponibilite === "epuisement" && (
                        <p className="text-xs text-muted-foreground">
                          Votre récolte restera visible jusqu'à ce que votre
                          stock soit épuisé
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 : Localisation + Récapitulatif ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Récapitulatif et localisation
                </h3>
                <p className="text-sm text-muted-foreground">
                  Vérifiez les informations avant de publier. Votre localisation
                  est basée sur votre profil.
                </p>
              </div>

              {/* Récap */}
              <div className="rounded-xl border overflow-hidden">
                <div className="bg-muted/30 px-5 py-3 border-b">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Récapitulatif de votre {isOffer ? "récolte" : "recherche"}
                  </p>
                </div>
                <div className="divide-y">
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Leaf className="w-4 h-4" />
                      Produit
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {selectedProduct?.nom}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedProduct?.categorie}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Scale className="w-4 h-4" />
                      Quantité
                    </div>
                    <p className="text-sm font-semibold">
                      {Number(quantite).toLocaleString()}{" "}
                      {selectedProduct?.unite}
                    </p>
                  </div>
                  {prixOuBudget && (
                    <div className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Banknote className="w-4 h-4" />
                        {isOffer ? "Prix unitaire" : "Budget max"}
                      </div>
                      <p className="text-sm font-semibold text-green-600">
                        {Number(prixOuBudget).toLocaleString()} Ar
                      </p>
                    </div>
                  )}
                  {prixOuBudget && quantite && isOffer && (
                    <div className="flex items-center justify-between px-5 py-4 bg-green-50">
                      <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                        <Banknote className="w-4 h-4" />
                        Valeur totale estimée
                      </div>
                      <p className="text-lg font-bold text-green-700">
                        {(
                          Number(prixOuBudget) * Number(quantite)
                        ).toLocaleString()}{" "}
                        Ar
                      </p>
                    </div>
                  )}
                  {(dateDebut || dateFin || dateSouhaitee) && (
                    <div className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {isOffer ? "Disponibilité" : "Date souhaitée"}
                      </div>
                      <p className="text-sm font-semibold">
                        {isOffer
                          ? `${dateDebut || "—"} → ${dateFin || "—"}`
                          : dateSouhaitee || "—"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Localisation */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">
                    Localisation automatique
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Région :{" "}
                    <span className="font-semibold">
                      {user?.region ?? "Analamanga"}
                    </span>
                    {" · "}Coordonnées GPS calculées depuis votre profil. Notre
                    algorithme utilisera cette position pour vous mettre en
                    relation avec les
                    {isOffer ? " acheteurs" : " producteurs"} les plus proches.
                  </p>
                </div>
              </div>

              {/* Info algorithme */}
              <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-primary">
                    Matching automatique activé
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Dès la publication, notre algorithme analysera votre annonce
                    et vous proposera automatiquement les meilleures
                    correspondances dans la section "
                    {isOffer
                      ? "Acheteurs intéressés"
                      : "Producteurs recommandés"}
                    ".
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() =>
                step === 0 ? handleClose() : setStep((s) => s - 1)
              }
              className="gap-2 h-11 px-6"
              disabled={submitting}
            >
              <ChevronLeft className="w-4 h-4" />
              {step === 0 ? "Annuler" : "Retour"}
            </Button>

            <div className="flex items-center gap-2">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-primary w-6" : i < step ? "bg-primary/40" : "bg-muted"}`}
                />
              ))}
            </div>

            {step < STEPS.length - 1 ? (
              <Button
                onClick={handleNextStep}
                className="gap-2 h-11 px-6"
                disabled={step === 0 && !selectedProduct}
              >
                Continuer
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="gap-2 h-11 px-6"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {submitting
                  ? "Publication..."
                  : isEdit
                    ? "Enregistrer les modifications"
                    : "Publier maintenant"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

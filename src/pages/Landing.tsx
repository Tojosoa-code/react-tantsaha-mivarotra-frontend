import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Sprout,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Search,
  Zap,
  Shield,
  Users,
  BarChart3,
  Route,
  Upload,
  Sparkles,
  Clock,
  DollarSign,
  Target,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-card/80 backdrop-blur-md fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground">
              <Sprout className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold">Tantsaha Mivarotra</span>
          </div>
          <div className="flex items-center gap-8">
            <a
              href="#how"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Comment ça marche
            </a>
            <a
              href="#benefits"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Avantages
            </a>
            <a
              href="#features"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Fonctionnalités
            </a>
            <Button variant="ghost" asChild>
              <Link to="/login">Connexion</Link>
            </Button>
            <Button asChild className="gap-2">
              <Link to="/register">
                Commencer <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-24 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5 -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.1),transparent_50%)] -z-10" />

        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <Badge variant="secondary" className="gap-2 py-2 px-4">
              <Sparkles className="w-4 h-4" />
              Plateforme n°1 à Madagascar
            </Badge>

            <h1 className="text-6xl font-bold leading-tight tracking-tight">
              Connectez producteurs et acheteurs
              <span className="text-primary"> directement</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Éliminez les intermédiaires, maximisez vos profits et optimisez
              vos déplacements grâce à notre algorithme de matching intelligent.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4">
              <Button size="lg" className="text-base px-8 gap-2" asChild>
                <Link to="/register">
                  Commencer gratuitement
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-12 pt-8 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">
                  Gratuit pour commencer
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">Sans engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">Support 24/7</span>
              </div>
            </div>
          </div>

          {/* Hero Visual - Stats Cards */}
          <div className="mt-20 grid grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">2,400+</div>
                    <div className="text-sm text-muted-foreground">
                      Utilisateurs actifs
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">15k+</div>
                    <div className="text-sm text-muted-foreground">
                      Transactions ce mois
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">+32%</div>
                    <div className="text-sm text-muted-foreground">
                      Revenus en moyenne
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section id="how" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Simple & Efficace
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Comment ça marche ?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Trois étapes pour transformer votre commerce agricole
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 mt-8">
            <Card className="relative border-2 hover:border-primary/50 transition-all group overflow-visible">
              <CardContent className="p-8 pt-10">
                <div className="absolute -top-5 left-8">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg">
                    1
                  </div>
                </div>
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mt-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-3">
                  Créez votre annonce
                </h3>
                <p className="text-muted-foreground">
                  Publiez votre offre ou demande en quelques clics. Précisez la
                  quantité, le prix et la localisation.
                </p>
              </CardContent>
            </Card>

            <Card className="relative border-2 hover:border-primary/50 transition-all group overflow-visible">
              <CardContent className="p-8 pt-10">
                <div className="absolute -top-5 left-8">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg">
                    2
                  </div>
                </div>
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mt-2 group-hover:scale-110 transition-transform">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-3">
                  Matching intelligent
                </h3>
                <p className="text-muted-foreground">
                  Notre algorithme analyse vos besoins et vous propose les
                  meilleures correspondances en temps réel.
                </p>
              </CardContent>
            </Card>

            <Card className="relative border-2 hover:border-primary/50 transition-all group overflow-visible">
              <CardContent className="p-8 pt-10">
                <div className="absolute -top-5 left-8">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg">
                    3
                  </div>
                </div>
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mt-2 group-hover:scale-110 transition-transform">
                  <Route className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-3">
                  Optimisez vos trajets
                </h3>
                <p className="text-muted-foreground">
                  Calculez automatiquement l'itinéraire le plus court pour
                  visiter tous vos contacts.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AVANTAGES */}
      <section id="benefits" className="py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Pourquoi nous choisir
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              Tous les outils dont vous avez besoin
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Une plateforme complète pour gérer votre activité agricole
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <Card className="border-2">
              <CardContent className="p-8 flex gap-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">
                    Meilleurs prix garantis
                  </h3>
                  <p className="text-muted-foreground">
                    Éliminez les intermédiaires et négociez directement.
                    Augmentez vos marges jusqu'à 40%.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-8 flex gap-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">Gain de temps</h3>
                  <p className="text-muted-foreground">
                    Réduisez vos déplacements de 60% grâce à l'optimisation
                    d'itinéraire et au matching intelligent.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-8 flex gap-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Search className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">
                    Recherche instantanée
                  </h3>
                  <p className="text-muted-foreground">
                    Trouvez exactement ce que vous cherchez en quelques secondes
                    grâce à nos filtres avancés.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-8 flex gap-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">
                    Transactions sécurisées
                  </h3>
                  <p className="text-muted-foreground">
                    Profitez d'un système de notation et de vérification des
                    utilisateurs pour des échanges en toute confiance.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-8 flex gap-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">
                    Couverture nationale
                  </h3>
                  <p className="text-muted-foreground">
                    Accédez à des milliers de producteurs et acheteurs dans
                    toutes les régions de Madagascar.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-8 flex gap-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">
                    Notifications en temps réel
                  </h3>
                  <p className="text-muted-foreground">
                    Soyez alerté instantanément des nouvelles opportunités
                    correspondant à vos critères.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FEATURES HIGHLIGHT */}
      <section
        id="features"
        className="py-24 bg-primary text-primary-foreground relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.1),transparent_50%)]" />

        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Technologie avancée
              </Badge>
              <h2 className="text-4xl font-bold leading-tight">
                Un algorithme intelligent qui travaille pour vous
              </h2>
              <p className="text-xl text-primary-foreground/80">
                Notre système analyse en permanence les offres et demandes pour
                vous proposer les meilleures opportunités au bon moment.
              </p>
              <ul className="space-y-4 pt-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">
                    Matching basé sur la localisation, le prix et la qualité
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">
                    Calcul d'itinéraire optimisé pour plusieurs destinations
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">
                    Prédictions de prix basées sur l'historique du marché
                  </span>
                </li>
              </ul>
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 mt-6"
                asChild
              >
                <Link to="/register">
                  Découvrir la plateforme
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            <div className="relative">
              <div className="bg-card rounded-3xl p-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-background rounded-xl">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-foreground">
                      Analyse en cours...
                    </span>
                  </div>
                  <div className="p-4 bg-background rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Riz blanc
                      </span>
                      <Badge variant="secondary">3 matches trouvés</Badge>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-3/4 rounded-full" />
                    </div>
                  </div>
                  <div className="p-4 bg-background rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Distance
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        12.5 km optimisés
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <Route className="w-4 h-4 text-primary" />
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto text-center px-8">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-12 border-2 border-primary/20">
            <h2 className="text-4xl font-bold mb-4">
              Prêt à transformer votre activité ?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Rejoignez des milliers de producteurs et acheteurs qui ont déjà
              fait le choix de l'efficacité.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="gap-2" asChild>
                <Link to="/register">
                  Créer mon compte gratuit
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Me connecter</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Aucune carte bancaire requise • Annulation à tout moment
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground">
                <Sprout className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold">Tantsaha Mivarotra</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2026 Tantsaha Mivarotra. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { Shield, Eye, Bell, ArrowRight, ChevronRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white">
            SecureIT
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-text-muted hover:text-white transition-colors text-sm font-medium"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
          >
            Criar Conta
          </Link>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-8 pt-32 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
          <Shield className="w-4 h-4" />
          Protecao Inteligente
        </div>
        <h2 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight">
          Seguranca inteligente
          <br />
          <span className="text-primary">para sua casa</span>
        </h2>
        <p className="mt-6 text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
          Sistema de monitorizacao com reconhecimento facial e deteccao de
          pessoas. Receba alertas em tempo real e proteja o que mais importa.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="bg-primary text-white px-8 py-4 rounded-lg font-bold text-base hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all inline-flex items-center gap-2"
          >
            Comecar Agora
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="border border-border text-text-muted px-8 py-4 rounded-lg font-bold text-base hover:bg-surface-hover hover:text-white transition-all"
          >
            Saber Mais
          </a>
        </div>
      </section>

      <section id="features" className="max-w-7xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-display font-bold text-white mb-4">
            Funcionalidades
          </h3>
          <p className="text-text-muted max-w-lg mx-auto">
            Tudo o que precisa para manter a sua casa segura
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Eye,
              title: "Reconhecimento Facial",
              description:
                "Identifique automaticamente pessoas conhecidas e desconhecidas nas suas cameras.",
            },
            {
              icon: Shield,
              title: "Deteccao de Pessoas",
              description:
                "YOLOv11 detecta pessoas em tempo real com alta precisao e baixa latencia.",
            },
            {
              icon: Bell,
              title: "Alertas em Tempo Real",
              description:
                "Receba notificacoes instantaneas quando alguem for detectado nas suas cameras.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group p-8 rounded-2xl bg-surface border border-border hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center mb-5">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h4>
              <p className="text-text-muted leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-display font-bold text-white mb-4">
            Planos
          </h3>
          <p className="text-text-muted max-w-lg mx-auto">
            Escolha o plano ideal para as suas necessidades
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="p-8 rounded-2xl bg-surface border border-border hover:border-border-light transition-all">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-xl font-semibold text-white">Trial</h4>
            </div>
            <p className="text-text-muted mb-6">
              Experimente gratuitamente durante 14 dias.
            </p>
            <div className="text-4xl font-bold text-white mb-6">Gratis</div>
            <ul className="space-y-3 text-sm text-text-muted mb-8">
              {[
                "1 camera",
                "10 pessoas registadas",
                "Deteccao de pessoas",
                "Sem reconhecimento facial",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block text-center border border-border text-text-muted py-3 rounded-lg font-bold hover:bg-surface-hover hover:text-white transition-all"
            >
              Comecar Trial
            </Link>
          </div>
          <div className="p-8 rounded-2xl bg-primary/10 border border-primary/25 hover:border-primary/40 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-xl font-semibold text-white">Standard</h4>
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                Popular
              </span>
            </div>
            <p className="text-text-muted mb-6">
              Acesso completo a todas as funcionalidades.
            </p>
            <div className="text-4xl font-bold text-white mb-6">
              Sob consulta
            </div>
            <ul className="space-y-3 text-sm text-text-muted mb-8">
              {[
                "Cameras ilimitadas",
                "Pessoas ilimitadas",
                "Deteccao de pessoas",
                "Reconhecimento facial",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block text-center bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
            >
              Contactar
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <p className="text-text-muted text-sm">
              &copy; 2026 SecureIT. Todos os direitos reservados.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <a href="#" className="hover:text-white transition-colors">
              Termos
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Privacidade
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

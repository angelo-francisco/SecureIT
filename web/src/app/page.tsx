import Link from "next/link";
import { Shield, Eye, Bell, ArrowRight, Phone,
  Mail,
  MessageCircle, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import Image from "next/image";


export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,123,255,.15),transparent_60%)]" />

        <div className="max-w-7xl mx-auto px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-6xl font-bold leading-tight">
                A segurança mais
                <span className="text-primary"> próxima de si.</span>
                <br />
              </h1>

              <p className="mt-6 text-xl text-text-muted max-w-xl">
                Um sistema de monitorização inteligente multi-plataforma
              </p>

              <div className="mt-10 flex gap-4">
                <Link
                  href="/signup"
                  className="bg-primary px-6 py-4 rounded-xl font-semibold text-white hover:scale-105 transition"
                >
                  Começar Agora
                </Link>

                <Link
                  href="/login"
                  className="border border-border px-6 py-4 rounded-xl"
                >
                  Iniciar Sessão
                </Link>
              </div>
            </div>

            <div>
              <Image
                src="/dashboard-preview.png"
                width={1200}
                height={800}
                alt="Dashboard"
                className="rounded-3xl border border-border shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="min-h-screen flex items-center justify-center px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-text mb-4">
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
                <h4 className="text-xl font-semibold text-text mb-3">
                  {feature.title}
                </h4>
                <p className="text-text-muted leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="min-h-screen flex items-center justify-center px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-text mb-4">
              Planos
            </h3>
            <p className="text-text-muted max-w-lg mx-auto">
              Escolha o plano ideal para as suas necessidades
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-8 rounded-2xl bg-surface border border-border hover:border-border-light transition-all">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-xl font-semibold text-text">Trial</h4>
              </div>
              <p className="text-text-muted mb-6">
                Experimente gratuitamente durante 14 dias.
              </p>
              <div className="text-4xl font-bold text-text mb-6">Gratis</div>
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
                className="block text-center border border-border text-text-muted py-3 rounded-lg font-bold hover:bg-surface-hover hover:text-text transition-all"
              >
                Comecar Trial
              </Link>
            </div>
            <div className="p-8 rounded-2xl bg-primary/10 border border-primary/25 hover:border-primary/40 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-xl font-semibold text-text">Standard</h4>
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                  Popular
                </span>
              </div>
              <p className="text-text-muted mb-6">
                Acesso completo a todas as funcionalidades.
              </p>
              <div className="text-4xl font-bold text-text mb-6">
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
        </div>
      </section>
      <section className="py-32 text-center">
        <h2 className="text-5xl font-bold">
          Pronto para modernizar a sua segurança?
        </h2>

        <p className="mt-6 text-xl text-text-muted max-w-2xl mx-auto">
          Plataforma unificada para desktop, web e dispositivos móveis.
        </p>

        <div className="mt-14 flex items-center justify-center gap-4">
          <a
            href="https://wa.me/244926422462"
            target="_blank"
            className="
        w-14 h-14 rounded-2xl
        border border-border
        bg-surface/60 backdrop-blur-xl
        flex items-center justify-center
        hover:border-primary/40
        hover:bg-primary/10
        hover:-translate-y-1
        transition-all
      "
          >
            <MessageCircle className="w-5 h-5 text-text-muted hover:text-primary" />
          </a>

          <a
            href="mailto:newstatesofficial@gmail.com"
            className="
        w-14 h-14 rounded-2xl
        border border-border
        bg-surface/60 backdrop-blur-xl
        flex items-center justify-center
        hover:border-primary/40
        hover:bg-primary/10
        hover:-translate-y-1
        transition-all
      "
          >
            <Mail className="w-5 h-5 text-text-muted hover:text-primary" />
          </a>

          <a
            href="tel:+244926422462"
            className="
        w-14 h-14 rounded-2xl
        border border-border
        bg-surface/60 backdrop-blur-xl
        flex items-center justify-center
        hover:border-primary/40
        hover:bg-primary/10
        hover:-translate-y-1
        transition-all
      "
          >
            <Phone className="w-5 h-5 text-text-muted hover:text-primary" />
          </a>
        </div>
      </section>
      <footer className="border-t border-border py-12 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-text-muted text-sm">
              &copy; 2026 SecureIT. Todos os direitos reservados.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <a href="#" className="hover:text-text transition-colors">
              Termos
            </a>
            <a href="#" className="hover:text-text transition-colors">
              Privacidade
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

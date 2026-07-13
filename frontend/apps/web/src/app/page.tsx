import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-display font-bold text-white">
            SecureIT
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="bg-[#22D3EE] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 transition-all"
          >
            Criar Conta
          </Link>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-8 pt-24 pb-32 text-center">
        <h2 className="text-5xl md:text-6xl font-display font-bold text-white leading-tight">
          Segurança inteligente
          <br />
          <span className="text-[#22D3EE]">para sua casa</span>
        </h2>
        <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
          Sistema de monitorização com reconhecimento facial e detecção de
          pessoas. Receba alertas em tempo real e proteja o que mais importa.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="bg-[#22D3EE] text-black px-8 py-3 rounded-lg font-semibold hover:brightness-110 transition-all"
          >
            Começar Agora
          </Link>
          <a
            href="#features"
            className="border border-white/10 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/5 transition-all"
          >
            Saber Mais
          </a>
        </div>
      </section>

      <section id="features" className="max-w-7xl mx-auto px-8 py-24">
        <h3 className="text-3xl font-display font-bold text-white text-center mb-16">
          Funcionalidades
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Reconhecimento Facial",
              description:
                "Identifique automaticamente pessoas conhecidas e desconhecidas nas suas câmeras.",
            },
            {
              title: "Detecção de Pessoas",
              description:
                "YOLOv11 detecta pessoas em tempo real com alta precisão e baixa latência.",
            },
            {
              title: "Alertas em Tempo Real",
              description:
                "Receba notificações instantâneas quando alguém for detectado nas suas câmeras.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
            >
              <h4 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h4>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-8 py-24">
        <h3 className="text-3xl font-display font-bold text-white text-center mb-16">
          Planos
        </h3>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <h4 className="text-xl font-semibold text-white mb-2">Trial</h4>
            <p className="text-gray-400 mb-6">
              Experimente gratuitamente durante 14 dias.
            </p>
            <div className="text-4xl font-bold text-white mb-6">
              Grátis
            </div>
            <ul className="space-y-3 text-sm text-gray-400 mb-8">
              <li>1 câmera</li>
              <li>10 pessoas registadas</li>
              <li>Detecção de pessoas</li>
              <li>Sem reconhecimento facial</li>
            </ul>
            <Link
              href="/signup"
              className="block text-center border border-white/10 text-white py-3 rounded-lg font-semibold hover:bg-white/5 transition-all"
            >
              Começar Trial
            </Link>
          </div>
          <div className="p-8 rounded-2xl bg-[#22D3EE]/10 border border-[#22D3EE]/20">
            <h4 className="text-xl font-semibold text-white mb-2">Standard</h4>
            <p className="text-gray-400 mb-6">
              Acesso completo a todas as funcionalidades.
            </p>
            <div className="text-4xl font-bold text-white mb-6">
              Sob consulta
            </div>
            <ul className="space-y-3 text-sm text-gray-400 mb-8">
              <li>Câmeras ilimitadas</li>
              <li>Pessoas ilimitadas</li>
              <li>Detecção de pessoas</li>
              <li>Reconhecimento facial</li>
            </ul>
            <Link
              href="/signup"
              className="block text-center bg-[#22D3EE] text-black py-3 rounded-lg font-semibold hover:brightness-110 transition-all"
            >
              Contactar
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-12 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-gray-500 text-sm">
            © 2026 SecureIT. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
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

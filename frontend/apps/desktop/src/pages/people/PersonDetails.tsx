import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { usePerson, useVisits } from "../../hooks";
import { Loader, Badge, Button, LucideInput } from "../../ui";
import * as Lucide from "lucide-react";

export default function PersonDetails() {
  const { id } = useParams<{ id: string }>();
  const { data: person, isLoading } = usePerson(Number(id));
  const { data: visits } = useVisits(Number(id));
  const [visitsModalOpen, setVisitsModalOpen] = useState(false);
  const [visitSearch, setVisitSearch] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-76px)]">
        <Loader w={50} />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-76px)]">
        <p className="text-white text-xl">Pessoa não encontrada</p>
      </div>
    );
  }

  const filteredVisits = visits?.filter((v) =>
    v.visitdestiny_set.some((d) =>
      d.resident.person.full_name
        .toLowerCase()
        .includes(visitSearch.toLowerCase())
    )
  );

  return (
    <>
      {/* Visits History Modal */}
      {visitsModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-[#1c2127] rounded-2xl p-6 space-y-5 shadow-2xl border border-white/10">
            <h1 className="text-3xl font-bold text-center border-b border-white/10 pb-3">
              Histórico de visitas
            </h1>
            <div className="flex gap-4 items-center justify-center">
              <LucideInput
                placeholder="Pesquisar por residente"
                icon="Search"
                type="text"
                value={visitSearch}
                onChange={(e) => setVisitSearch(e.target.value)}
              />
              <Button
                variant="danger"
                icon={<Lucide.X size={20} />}
                onClick={() => setVisitsModalOpen(false)}
              >
                Fechar
              </Button>
            </div>
            <div className="divide-y divide-white/10">
              {filteredVisits && filteredVisits.length > 0 ? (
                filteredVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="flex justify-between items-center py-3"
                  >
                    <span>
                      {visit.visitdestiny_set.map((d, idx) => (
                        <span key={d.id}>
                          <Link
                            to={`/people/${d.resident.person.id}`}
                            className="text-blue-400 hover:underline font-medium"
                          >
                            {d.resident.person.full_name}
                          </Link>
                          {idx < visit.visitdestiny_set.length - 1 && ", "}
                        </span>
                      ))}
                    </span>
                    <span className="text-gray-400 text-base">
                      {new Date(visit.visited_at).toLocaleDateString("pt-PT")} às{" "}
                      {new Date(visit.visited_at).toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-6">
                  Nenhuma visita encontrada.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-[#12161d] pt-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          {/* Profile card */}
          <div className="w-full lg:w-1/3 bg-gradient-to-b from-[#1f2937] to-[#111827] rounded-3xl p-6 shadow-xl border border-white/10 flex flex-col items-center justify-center gap-3 text-center">
            {person.photo ? (
              <img
                src={person.photo}
                alt={`Foto de ${person.full_name}`}
                className="w-30 h-30 md:w-60 md:h-60 rounded-full border border-[#1d2431] shadow-2xl"
              />
            ) : (
              <div className="w-28 h-28 md:w-40 md:h-40 rounded-lg bg-gray-700 flex items-center justify-center">
                <span className="text-gray-400 text-sm">Sem foto</span>
              </div>
            )}
            <h1 className="text-2xl md:text-4xl font-semibold">
              {person.full_name}
            </h1>
          </div>

          {/* Info sections */}
          <div className="flex-1 flex flex-col justify-around gap-6">
            {/* General info */}
            <div className="w-full py-5 px-6 bg-[#1d2431] border border-white/10 rounded-xl">
              <div className="w-full flex items-center pb-2 mb-3 justify-between border-b border-gray-600">
                <h1 className="text-xl md:text-2xl font-bold">
                  Informações Gerais
                </h1>
                <Link
                  to={`/people/${person.id}/edit`}
                  className="flex items-center justify-center gap-2"
                >
                  <Lucide.Pencil size={20} />
                  <span className="hidden md:block">Editar dados</span>
                </Link>
              </div>
              <div className="flex justify-between mb-2 mt-2">
                <span className="text-gray-300 text-base">Tipo de pessoa</span>
                <span className="text-white text-base">
                  {person.get_type_display}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2 mt-2">
                <span className="text-gray-300 text-base">Estado</span>
                <Badge variant={person.banned ? "error" : "success"}>
                  {person.banned ? "Banido" : "Activo"}
                </Badge>
              </div>
            </div>

            {/* Resident info */}
            {person.type === "R" && person.resident && (
              <div className="w-full py-5 px-6 bg-[#1d2431] border border-white/10 rounded-xl">
                <h1 className="text-xl md:text-2xl pb-2 mb-3 border-b border-gray-600 font-bold">
                  Informações do Residente
                </h1>
                <div className="flex justify-between mb-2 mt-2">
                  <span className="text-gray-300 text-base">
                    Bilhete de Identidade
                  </span>
                  <span className="text-white text-base">
                    {person.resident.bi}
                  </span>
                </div>
                <div className="flex justify-between mb-2 mt-2">
                  <span className="text-gray-300 text-base">Casa(s)</span>
                  <div>
                    {person.resident.residenthome_set.map((rh, idx) => (
                      <span key={rh.id} className="text-base text-white">
                        I{rh.home.number}
                        {idx < person.resident!.residenthome_set.length - 1 &&
                          ", "}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Visitor info */}
            {person.type === "V" && person.visitor && (
              <div className="w-full py-5 px-6 bg-[#1d2431] border border-white/10 rounded-xl">
                <div className="w-full flex items-center pb-2 mb-3 justify-between border-b border-gray-600">
                  <h1 className="text-xl md:text-2xl font-bold">
                    Informações do Visitante
                  </h1>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setVisitsModalOpen(true)}
                      className="flex items-center justify-center gap-2 text-base"
                    >
                      <Lucide.History size={20} />
                      <span className="hidden md:block">
                        Histórico de visitas
                      </span>
                    </button>
                    <Link
                      to={`/people/${person.visitor.id}/new-visit`}
                      className="flex items-center justify-center text-base gap-2"
                    >
                      <Lucide.Plus size={20} />
                      <span className="hidden md:block">Nova visita</span>
                    </Link>
                  </div>
                </div>
                <div className="flex justify-between mb-2 mt-2">
                  <span className="text-gray-300 text-base">
                    Tipo de visitante
                  </span>
                  <span className="text-white text-base">
                    {person.visitor.get_type_display}
                  </span>
                </div>
                <div className="flex justify-between mb-2 mt-2">
                  <span className="text-gray-300 text-base">
                    Número de visitas
                  </span>
                  <span className="text-white text-base">
                    {person.visitor.visit_set.length}
                  </span>
                </div>
              </div>
            )}

            {/* Worker info */}
            {person.type === "W" && person.worker && (
              <div className="w-full py-5 px-6 bg-[#1d2431] border border-white/10 rounded-xl">
                <h1 className="text-xl md:text-2xl pb-2 mb-3 border-b border-gray-600 font-bold">
                  Informações do(a) Trabalhor(a)
                </h1>
                <div className="flex justify-between mb-2 mt-2">
                  <span className="text-gray-300 text-base">
                    Bilhete de Identidade
                  </span>
                  <span className="text-white text-base">
                    {person.worker.bi}
                  </span>
                </div>
                <div className="flex justify-between mb-2 mt-2">
                  <span className="text-gray-300 text-base">
                    Áreas de trabalho
                  </span>
                  <span className="text-white text-base">
                    {person.worker.get_formatted_fields}
                  </span>
                </div>
                <div className="flex justify-between mb-2 mt-2">
                  <span className="text-gray-300 text-base">
                    Casa(s) em que trabalha
                  </span>
                  <div>
                    {person.worker.workerhome_set.map((wh, idx) => (
                      <span key={wh.id} className="text-base text-white">
                        I{wh.home.number}
                        {idx < person.worker!.workerhome_set.length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

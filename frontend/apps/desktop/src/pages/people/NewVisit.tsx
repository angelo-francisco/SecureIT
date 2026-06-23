import { useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNewVisit } from "../../hooks";
import { LucideInput, Button } from "../../ui";

// Mock residents - in real app would come from API
const mockResidents: { id: number; name: string; homes: string }[] = [];

export default function NewVisit() {
  const { visitorId } = useParams<{ visitorId: string }>();
  const [desc, setDesc] = useState("");
  const [selectedDestinies, setSelectedDestinies] = useState<string[]>([]);
  const newVisit = useNewVisit(Number(visitorId));
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await newVisit.mutateAsync({
      destinies: selectedDestinies.map(Number),
      desc: desc || undefined,
    });
    navigate("/people");
  };

  return (
    <form onSubmit={handleSubmit} className="h-full mb-5 relative z-10">
      <main className="flex-1 h-full flex flex-col relative overflow-hidden">
        <header className="w-full px-6 py-4 text-center">
          <h1 className="text-white text-3xl font-black">Nova Visita</h1>
          <p className="text-[#9dabb9] mt-1 text-base">
            Registar uma nova visita
          </p>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl rounded-xl bg-[#1c2127] px-8 py-5 border border-[#283039] shadow-xl">
            <div className="mb-4 flex flex-col justify-between gap-2">
              <div className="mb-3">
                <label className="ml-1 text-lg text-white font-medium">
                  Visitante
                </label>
                <LucideInput
                  type="text"
                  name="visitor"
                  icon="User"
                  disabled
                />
              </div>
              <div className="mb-3 flex flex-col">
                <label className="ml-1 text-lg text-white font-medium">
                  Descrição (Opcional)
                </label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="rounded-lg bg-[#1c2127] border border-[#3b4754] text-white p-3 focus:outline-none focus:border-primary"
                  placeholder="Adicione alguma descrição adicional aqui..."
                />
              </div>
              <div className="mb-3 flex flex-col gap-1">
                <label className="ml-1 text-lg text-white font-medium">
                  Anfitrião/Destinos
                </label>
                <LucideInput
                  placeholder="Pesquise por uma casa"
                  type="text"
                  icon="Search"
                  className="home-search"
                />
                <select
                  multiple
                  value={selectedDestinies}
                  onChange={(e) =>
                    setSelectedDestinies(
                      Array.from(e.target.selectedOptions, (o) => o.value)
                    )
                  }
                  className="w-full max-h-[100px] text-lg rounded-lg border border-[#3b4754] bg-[#283039] px-3 text-white"
                >
                  {mockResidents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.homes}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="danger"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
              <Button type="submit">Registar</Button>
            </div>
          </div>
        </div>
      </main>
    </form>
  );
}

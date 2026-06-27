import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCreatePerson,
  useHomes,
  useHosts,
  useVisitorTypes,
  useFields,
} from "../../hooks";
import { usePanelNavigate } from "../../hooks/usePanelNavigate";
import { Input, LucideInput, Button } from "../../ui";

export default function PersonNew() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [personType, setPersonType] = useState("");
  const [residentBi, setResidentBi] = useState("");
  const [visitorType, setVisitorType] = useState("");
  const [workerBi, setWorkerBi] = useState("");
  const [workerFields, setWorkerFields] = useState<string[]>([]);
  const [selectedHomes, setSelectedHomes] = useState<string[]>([]);
  const [selectedHosts, setSelectedHosts] = useState<string[]>([]);
  const [photo] = useState("");

  const createPerson = useCreatePerson();
  const { data: homes } = useHomes();
  const { data: hosts } = useHosts();
  const { data: visitorTypes } = useVisitorTypes();
  const { data: fields } = useFields();
  const navigate = useNavigate();
  const panelNavigate = usePanelNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = {
      first_name: firstName,
      last_name: lastName,
      person_type: personType,
      photo,
    };

    if (personType === "R") {
      data["resident-homes"] = selectedHomes;
      data["resident-bi"] = residentBi;
    } else if (personType === "V") {
      data["visitor-type"] = visitorType;
      data["visitor-host"] = selectedHosts;
    } else if (personType === "W") {
      data["worker-bi"] = workerBi;
      data["worker-fields"] = workerFields;
      data["worker-homes"] = selectedHomes;
    }

    await createPerson.mutateAsync(data as unknown as Parameters<typeof createPerson.mutateAsync>[0]);
    if (panelNavigate) {
      panelNavigate("people");
    } else {
      navigate("/people");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="h-full mb-5 relative z-10">
      <main className="flex-1 h-full flex flex-col relative overflow-hidden">
        <header className="w-full px-6 py-4 text-center">
          <h1 className="text-white text-2xl font-black">Adicionar Pessoa</h1>
          <p className="text-[#9dabb9] mt-1 text-sm">
            Registar residente, visitante ou trabalhadores
          </p>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl rounded-xl bg-[#1c2127] px-8 py-5 border border-[#283039] shadow-xl">
            <div className="mb-4 flex justify-between gap-2">
              <div className="flex-1">
                <label className="ml-1 text-base text-white font-medium">
                  Primeiro nome *
                </label>
                <Input
                  placeholder="Seu primeiro nome"
                  type="text"
                  name="first_name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="flex-1">
                <label className="ml-1 text-base text-white font-medium">
                  Sobrenome *
                </label>
                <Input
                  placeholder="Informe o seu sobrenome"
                  type="text"
                  name="last_name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4 flex flex-col justify-start gap-1">
              <label className="ml-1 block text-base font-medium text-white mb-1">
                Tipo de Pessoa *
              </label>
              <select
                value={personType}
                onChange={(e) => setPersonType(e.target.value)}
                required
                className="w-full h-10 rounded-lg border border-[#3b4754] bg-[#283039] px-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              >
                <option value="" disabled>
                  Selecione um tipo de pessoa
                </option>
                <option value="V">Visitante</option>
                <option value="R">Residente</option>
                <option value="W">Trabalhador(a)</option>
              </select>
            </div>

            <div className="space-y-4">
              {personType === "R" && (
                <div className="space-y-2">
                  <div className="mb-4 flex flex-col gap-1">
                    <label className="ml-1 text-base text-white font-medium">
                      Nº. da Casa
                    </label>
                    <LucideInput
                      placeholder="Pesquise por uma casa"
                      type="text"
                      icon="Search"
                      className="home-search"
                    />
                    <select
                      multiple
                      value={selectedHomes}
                      onChange={(e) =>
                        setSelectedHomes(
                          Array.from(
                            e.target.selectedOptions,
                            (o) => o.value
                          )
                        )
                      }
                      className="w-full max-h-[100px] rounded-lg border border-[#3b4754] bg-[#283039] px-3 text-white"
                    >
                      {homes?.map((home) => (
                        <option key={home.id} value={home.id}>
                          {home.number}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4 flex flex-col gap-1">
                    <label className="ml-1 text-base text-white font-medium">
                      Nº. do BI
                    </label>
                    <Input
                      placeholder="Número do BI"
                      type="text"
                      name="resident-bi"
                      value={residentBi}
                      onChange={(e) => setResidentBi(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {personType === "V" && (
                <div className="space-y-2">
                  <div className="mb-4 flex flex-col justify-start gap-1">
                    <label className="ml-1 block text-base font-medium text-white mb-1">
                      Tipo de visitante
                    </label>
                    <select
                      value={visitorType}
                      onChange={(e) => setVisitorType(e.target.value)}
                      required
                      className="w-full h-10 rounded-lg border border-[#3b4754] bg-[#283039] px-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    >
                      <option value="" disabled>
                        Selecione um tipo de visitante
                      </option>
                      {visitorTypes?.map((vt) => (
                        <option key={vt.value} value={vt.value}>
                          {vt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4 flex flex-col gap-1">
                    <label className="ml-1 text-base text-white font-medium">
                      Anfitrião/Destinatário(a)
                    </label>
                    <LucideInput
                      placeholder="Nome do anfitrião/destinatário"
                      type="text"
                      icon="User"
                      className="home-search"
                    />
                    <select
                      multiple
                      value={selectedHosts}
                      onChange={(e) =>
                        setSelectedHosts(
                          Array.from(
                            e.target.selectedOptions,
                            (o) => o.value
                          )
                        )
                      }
                      className="w-full max-h-[100px] rounded-lg border border-[#3b4754] bg-[#283039] px-3 text-white"
                    >
                      {hosts?.map((h) => (
                        <option key={h.resident.id} value={h.resident.id}>
                          {h.resident.person.first_name}{" "}
                          {h.resident.person.last_name} - I{h.home.number}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {personType === "W" && (
                <div className="space-y-4">
                  <div className="mb-4 flex flex-col gap-1">
                    <label className="ml-1 text-base text-white font-medium">
                      Nº. do BI *
                    </label>
                    <Input
                      placeholder="Número do BI"
                      type="text"
                      name="worker-bi"
                      value={workerBi}
                      onChange={(e) => setWorkerBi(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-4 flex flex-col gap-1">
                    <label className="ml-1 text-base text-white font-medium">
                      Áreas de Trabalho *
                    </label>
                    <select
                      multiple
                      value={workerFields}
                      onChange={(e) =>
                        setWorkerFields(
                          Array.from(
                            e.target.selectedOptions,
                            (o) => o.value
                          )
                        )
                      }
                      className="w-full h-30 rounded-lg border border-[#3b4754] bg-[#283039] px-3 text-white"
                    >
                      {fields?.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4 flex flex-col gap-1">
                    <label className="ml-1 text-base text-white font-medium">
                      Casas em que Trabalha
                    </label>
                    <LucideInput
                      placeholder="Pesquise por uma casa"
                      type="text"
                      icon="Search"
                      className="home-search"
                    />
                    <select
                      multiple
                      value={selectedHomes}
                      onChange={(e) =>
                        setSelectedHomes(
                          Array.from(
                            e.target.selectedOptions,
                            (o) => o.value
                          )
                        )
                      }
                      className="w-full max-h-[100px] rounded-lg border border-[#3b4754] bg-[#283039] px-3 text-white"
                    >
                      {homes?.map((home) => (
                        <option key={home.id} value={home.id}>
                          {home.number}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <input type="hidden" name="photo" value={photo} />

            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="danger"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
              <Button type="submit">Adicionar</Button>
            </div>
          </div>
        </div>
      </main>
    </form>
  );
}

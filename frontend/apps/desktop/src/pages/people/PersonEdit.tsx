import { useState, useEffect, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  usePerson,
  useUpdatePerson,
  useHomes,
  useVisitorTypes,
  useFields,
} from "../../hooks";
import { Input, LucideInput, Button, Loader } from "../../ui";

export default function PersonEdit() {
  const { id } = useParams<{ id: string }>();
  const { data: person, isLoading } = usePerson(Number(id));
  const updatePerson = useUpdatePerson(Number(id));
  const { data: homes } = useHomes();
  const { data: visitorTypes } = useVisitorTypes();
  const { data: fields } = useFields();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [residentBi, setResidentBi] = useState("");
  const [visitorType, setVisitorType] = useState("");
  const [workerBi, setWorkerBi] = useState("");
  const [workerFields, setWorkerFields] = useState<string[]>([]);
  const [selectedHomes, setSelectedHomes] = useState<string[]>([]);
  const [photo] = useState("");

  useEffect(() => {
    if (person) {
      setFirstName(person.first_name);
      setLastName(person.last_name);
      if (person.type === "R" && person.resident) {
        setResidentBi(person.resident.bi);
        setSelectedHomes(
          person.resident.residenthome_set.map((rh) => String(rh.home.id))
        );
      }
      if (person.type === "V" && person.visitor) {
        setVisitorType(person.visitor.type);
      }
      if (person.type === "W" && person.worker) {
        setWorkerBi(person.worker.bi);
        setWorkerFields(person.worker.list_fields);
      }
    }
  }, [person]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = {
      first_name: firstName,
      last_name: lastName,
      photo,
    };

    if (person?.type === "R") {
      data["resident-homes"] = selectedHomes;
      data["resident-bi"] = residentBi;
    } else if (person?.type === "V") {
      data["visitor-type"] = visitorType;
    } else if (person?.type === "W") {
      data["worker-bi"] = workerBi;
      data["worker-fields"] = workerFields;
      data["worker-homes"] = selectedHomes;
    }

    await updatePerson.mutateAsync(data as unknown as Parameters<typeof updatePerson.mutateAsync>[0]);
    navigate("/people");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-76px)]">
        <Loader w={50} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="h-full mb-5 relative z-10">
      <main className="flex-1 h-full flex flex-col relative overflow-hidden">
        <header className="w-full px-6 py-4 text-center">
          <h1 className="text-white text-2xl font-black">Editar Pessoa</h1>
          <p className="text-[#9dabb9] mt-1 text-sm">
            Alterar dados de residente, visitante ou trabalhadores
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
              <label className="ml-1 block text-base font-medium text-gray-500 mb-1">
                Tipo de Pessoa *
              </label>
              <select
                disabled
                className="w-full h-10 rounded-lg border border-[#3b4754] bg-[#283039] px-3 text-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              >
                <option value="R" selected={person?.type === "R"}>
                  Residente
                </option>
                <option value="V" selected={person?.type === "V"}>
                  Visitante
                </option>
                <option value="W" selected={person?.type === "W"}>
                  Trabalhador(a)
                </option>
              </select>
            </div>

            <div className="space-y-4">
              {person?.type === "R" && (
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
                          Array.from(e.target.selectedOptions, (o) => o.value)
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

              {person?.type === "V" && (
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
                      {visitorTypes?.map((vt) => (
                        <option key={vt.value} value={vt.value}>
                          {vt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {person?.type === "W" && (
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
                          Array.from(e.target.selectedOptions, (o) => o.value)
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
                          Array.from(e.target.selectedOptions, (o) => o.value)
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

            <input type="hidden" name="photo" id="photo" />

            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="danger"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
              <Button type="submit">Actualizar</Button>
            </div>
          </div>
        </div>
      </main>
    </form>
  );
}

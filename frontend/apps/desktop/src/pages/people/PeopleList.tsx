import { useState } from "react";
import { Link } from "react-router-dom";
import { usePeople } from "../../hooks";
import { usePanelNavigate } from "../../hooks/usePanelNavigate";
import { Button, Table, Badge, Loader, Pagination } from "../../ui";
import * as Lucide from "lucide-react";
import { formatDateTime } from "../../lib/utils";

export default function PeopleList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePeople(search || undefined, page);
  const [searchResults, setSearchResults] = useState<
    [number, string, string, string][] | null
  >(null);
  const panelNavigate = usePanelNavigate();

  const columns = [
    {
      key: "full_name",
      header: "Nome",
      render: (row: Record<string, unknown>) => (
        <span className="text-lg">{row.full_name as string}</span>
      ),
    },
    { key: "get_type_display", header: "Tipo de pessoa" },
    {
      key: "banned",
      header: "Estado",
      render: (row: Record<string, unknown>) => (
        <Badge variant={row.banned ? "error" : "success"}>
          {row.banned ? "Banido" : "Activo"}
        </Badge>
      ),
    },
    {
      key: "added_at",
      header: "Data de adição",
      render: (row: Record<string, unknown>) =>
        formatDateTime(row.added_at as string),
    },
    {
      key: "updated_at",
      header: "Última actualização",
      render: (row: Record<string, unknown>) =>
        formatDateTime(row.updated_at as string),
    },
    {
      key: "actions",
      header: "Acções",
      className: "text-center",
      render: (row: Record<string, unknown>) => {
        const person = row as unknown as { id: number };
        return (
          <div className="flex gap-1 justify-center items-center">
            <Link
              to={`/people/${person.id}`}
              className="p-2 rounded bg-surface-hover text-text-secondary hover:text-gray-500 transition-colors"
              title="Detalhes"
            >
              <Lucide.Info size={18} />
            </Link>
            <Link
              to={`/people/${person.id}/edit`}
              className="p-2 rounded bg-surface-hover text-text-secondary hover:text-primary transition-colors"
              title="Editar"
            >
              <Lucide.Pen size={18} />
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <main className="flex-1 h-full flex flex-col relative overflow-hidden">
      <header className="w-full px-6 py-4 lg:px-10 lg:py-6 flex flex-col gap-4 shrink-0 z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-600 pb-3">
          <h2 className="text-white text-2xl md:text-4xl font-bold tracking-tight">
            Gerir Pessoas
          </h2>
          <div className="flex gap-2 items-center">
            <form
              className="relative w-full lg:w-96"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
                <Lucide.Search size={20} />
              </div>
              <input
                className="border border-gray/90 block w-full p-2.5 pl-10 text-sm text-white bg-surface-dark rounded-lg focus:ring-1 focus:ring-primary placeholder-text-secondary"
                placeholder="Buscar por nome..."
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </form>
            <Button
              variant="secondary"
              icon={<Lucide.Eraser size={16} />}
              onClick={() => setSearch("")}
            >
              Limpar
            </Button>
            {panelNavigate ? (
              <Button
                icon={<Lucide.Plus size={16} />}
                onClick={() => panelNavigate("person-new")}
              >
                Adicionar Pessoa
              </Button>
            ) : (
              <Link to="/people/new">
                <Button icon={<Lucide.Plus size={16} />}>
                  Adicionar Pessoa
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader w={50} />
          </div>
        ) : data && Array.isArray(data.results) && data.results.length > 0 ? (
          <>
            <Table
              columns={columns}
              data={data.results as unknown as Record<string, unknown>[]}
            />
            <Pagination
              page={data.number ?? 1}
              numPages={data.num_pages ?? 1}
              hasNext={data.has_next ?? false}
              hasPrevious={data.has_previous ?? false}
              onPageChange={setPage}
            />
          </>
        ) : (
          <div className="w-full flex justify-center items-center flex-col text-center gap-1 mt-3">
            <Lucide.UserX size={40} />
            <div className="flex flex-col gap-2 max-w-md">
              <h3 className="text-white text-xl font-bold">
                Nenhuma pessoa registada
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Clique no botão 'Adicionar Pessoa' para registar alguém
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Face search results modal */}
      {searchResults && (
        <div className="fixed inset-0 flex justify-center items-center backdrop-blur-sm z-[1000]">
          <div className="max-w-xl p-5 py-10 bg-[#1c2127] rounded-xl space-y-4 w-full">
            <h1 className="w-full flex items-center justify-center gap-3 text-3xl font-bold text-center border-b border-white/10 pb-3">
              Resultados da Pesquisa
              <button
                className="cursor-pointer"
                onClick={() => setSearchResults(null)}
              >
                <Lucide.X size={24} />
              </button>
            </h1>
            <div className="w-full divide-y divide-white/10">
              {searchResults.map((sr, idx) => (
                <div
                  key={idx}
                  className="w-full flex justify-between items-center py-3"
                >
                  <Link
                    to={`/people/${sr[0]}`}
                    className="text-lg text-blue-400 hover:underline font-medium"
                  >
                    {idx + 1}. {sr[1]} {sr[2]}
                  </Link>
                  <span className="text-gray-300">
                    {sr[3] === "V"
                      ? "Visitante"
                      : sr[3] === "R"
                        ? "Residente"
                        : "Trabalhador"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

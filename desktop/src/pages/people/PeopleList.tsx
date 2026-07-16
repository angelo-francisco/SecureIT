import { useState } from "react";
import { usePeople } from "../../hooks";
import { usePanelNavigate } from "../../hooks/usePanelNavigate";
import { usePersonViewStore } from "../../stores";
import { Button, Table, Badge, Loader, Pagination, Input } from "../packages/ui";
import * as Lucide from "lucide-react";
import { formatDateTime } from "../../lib/utils";

interface PeopleListProps {
  onClose?: () => void;
}

export default function PeopleList({ onClose }: PeopleListProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePeople(search || undefined, page);
  const panelNavigate = usePanelNavigate();

  const columns = [
    {
      key: "full_name",
      header: "Nome",
      render: (row: Record<string, unknown>) => {
        const person = row as unknown as { id: number; full_name: string };
        return (
          <span
            className="text-primary font-medium hover:underline cursor-pointer"
            onClick={() => {
              usePersonViewStore.getState().setPersonId(person.id);
              panelNavigate?.("person-view");
            }}
          >
            {person.full_name}
          </span>
        );
      },
    },
    {
      key: "roles",
      header: "Cargos",
      render: (row: Record<string, unknown>) => {
        const roles = row.roles as { role_name: string }[] | undefined;
        if (!roles || roles.length === 0) {
          return <span className="text-text-muted text-sm">—</span>;
        }
        return (
          <div className="flex gap-1 flex-wrap">
            {roles.map((r, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                {r.role_name}
              </span>
            ))}
          </div>
        );
      },
    },
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
  ];

  return (
    <div className="flex-1 h-full flex flex-col relative overflow-hidden">
      <header className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Lucide.Users size={22} className="text-primary" />
          <h2 className="text-xl font-bold text-text">Pessoas</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Lucide.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            icon={<Lucide.FolderTree size={14} />}
            onClick={() => panelNavigate?.("role-management")}
          >
            Cargos
          </Button>
          <Button
            size="sm"
            icon={<Lucide.Plus size={14} />}
            onClick={() => panelNavigate?.("person-new")}
          >
            Nova Pessoa
          </Button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-gray-400 hover:text-white transition-all duration-150"
            >
              <Lucide.X size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto mt-6">
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
          <div className="w-full flex justify-center items-center flex-col text-center gap-3 mt-16">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center">
              <Lucide.UserX size={28} className="text-text-muted" />
            </div>
            <div className="flex flex-col gap-1 max-w-md">
              <h3 className="text-text font-semibold text-base">
                Nenhuma pessoa registada
              </h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Clique em "Nova Pessoa" para registar alguém
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

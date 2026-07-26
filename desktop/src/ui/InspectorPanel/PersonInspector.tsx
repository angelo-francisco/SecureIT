import { useMemo } from "react";
import { usePerson, useRoles } from "../../hooks";
import { Loader } from "../../ui";
import { getApiBaseUrl } from "../../api-client/client";
import * as Lucide from "lucide-react";

interface PersonInspectorProps {
  personId: number;
  onClose: () => void;
}

export function PersonInspector({ personId }: PersonInspectorProps) {
  const { data: person, isLoading } = usePerson(personId);
  const { data: allRoles } = useRoles();

  const photoUrl = useMemo(() => {
    if (person?.photo) return `${getApiBaseUrl()}/media/${person.photo}`;
    return null;
  }, [person]);

  const roleMap = useMemo(() => {
    if (!allRoles) return {};
    const map: Record<number, typeof allRoles[0]> = {};
    allRoles.forEach((r) => { map[r.id] = r; });
    return map;
  }, [allRoles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader w={40} />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 mt-16 text-text-muted">
        <Lucide.UserX size={40} />
        <p>Pessoa não encontrada</p>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5">
      <div className="flex flex-col items-center gap-3 bg-white/[0.02] border border-white/[0.04] p-5 relative overflow-hidden">
        <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-primary">
          {photoUrl ? (
            <img src={photoUrl} alt={person.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-surface flex items-center justify-center text-text-muted">
              <Lucide.User size={40} />
            </div>
          )}
        </div>
        <div className="text-center">
          <h3 className="text-base font-bold text-text">{person.full_name}</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Registado em: {new Date(person.added_at).toLocaleDateString()}
          </p>
        </div>
        {person.banned && (
          <div className="absolute top-2 right-2 bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
            <Lucide.ShieldAlert size={10} />
            Banido
          </div>
        )}
      </div>

      {person.roles && person.roles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-text">Cargos</h4>
          {person.roles.map((pr) => {
            const role = roleMap[pr.role_id];
            return (
              <div key={pr.id} className="border border-border p-4 bg-white/[0.01] space-y-3">
                <h5 className="text-sm font-semibold text-primary">{pr.role_name}</h5>
                {role?.fields && role.fields.length > 0 ? (
                  role.fields.sort((a, b) => a.sort_order - b.sort_order).map((field) => {
                    const val = pr.field_values?.[field.label];
                    return (
                      <div key={field.id} className="space-y-0.5">
                        <span className="text-xs text-text-muted">{field.label}</span>
                        <p className="text-sm text-text">
                          {field.field_type === "boolean"
                            ? val ? "Sim" : "Não"
                            : String(val ?? "-")}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-text-muted">Nenhum campo personalizado</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

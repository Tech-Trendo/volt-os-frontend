import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  roles,
  canEdit,
  canView,
  financeAccess,
  saveRolePermissions,
  type Role,
} from "@/lib/permissions";
import { moduleGroups } from "@/mock/reference";
import { useUi } from "@/stores/ui";
import { toast } from "sonner";
export function PermissionEditor() {
  const [selected, setSelected] = useState<Role>("Report Viewer");
  const { role, setRole } = useUi();
  const getPolicy = (r: Role) => ({
    finance: financeAccess(r),
    modules: Object.fromEntries(
      moduleGroups.map((g) => [
        g.domain,
        { view: canView(r, g.domain), edit: canEdit(r, g.domain) },
      ]),
    ),
  });
  const [policy, setPolicy] = useState(() => getPolicy(selected));
  return (
    <section className="mb-5 border-y py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Role access</h2>
        <select
          aria-label="Permission role"
          className="erp-select"
          value={selected}
          onChange={(e) => {
            const value = e.target.value as Role;
            setSelected(value);
            setPolicy(getPolicy(value));
          }}
        >
          {roles.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Module</th>
              <th>View</th>
              <th>Create / Edit / Delete</th>
            </tr>
          </thead>
          <tbody>
            {moduleGroups.map((g) => (
              <tr key={g.domain}>
                <td>{g.title}</td>
                <td>
                  <Switch
                    aria-label={`View ${g.title}`}
                    checked={policy.modules[g.domain]?.view ?? false}
                    disabled={selected === "Super Administrator"}
                    onCheckedChange={(view) =>
                      setPolicy((p) => ({
                        ...p,
                        modules: {
                          ...p.modules,
                          [g.domain]: {
                            view,
                            edit: view ? (p.modules[g.domain]?.edit ?? false) : false,
                          },
                        },
                      }))
                    }
                  />
                </td>
                <td>
                  <Switch
                    aria-label={`Edit ${g.title}`}
                    checked={policy.modules[g.domain]?.edit ?? false}
                    disabled={selected === "Super Administrator" || selected === "Report Viewer"}
                    onCheckedChange={(edit) =>
                      setPolicy((p) => ({
                        ...p,
                        modules: {
                          ...p.modules,
                          [g.domain]: { view: edit || !!p.modules[g.domain]?.view, edit },
                        },
                      }))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-3 text-xs">
          <Switch
            checked={policy.finance}
            disabled={selected === "Super Administrator"}
            onCheckedChange={(finance) => setPolicy((p) => ({ ...p, finance }))}
          />
          Financial figures access
        </label>
        <Button
          disabled={role !== "Super Administrator" && role !== "Management"}
          onClick={() => {
            saveRolePermissions(selected, policy);
            setRole(role);
            toast.success(`${selected} access policies updated successfully.`);
          }}
        >
          Save permissions
        </Button>
      </div>
    </section>
  );
}

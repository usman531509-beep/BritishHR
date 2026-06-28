import type { Action, Module, PermissionKey } from "./permissions";
import { perm } from "./permissions";

// A lightweight ability object derived from the session's permission set.
export interface Ability {
  permissions: Set<string>;
  roles: string[];
  can(module: Module, action: Action): boolean;
  canAny(keys: PermissionKey[]): boolean;
  isPlatformOwner: boolean;
}

export function createAbility(permissions: string[], roles: string[]): Ability {
  const set = new Set(permissions);
  return {
    permissions: set,
    roles,
    isPlatformOwner: roles.includes("PLATFORM_OWNER"),
    can(module, action) {
      // "admin" on a module implies everything for that module.
      return set.has(perm(module, action)) || set.has(perm(module, "admin"));
    },
    canAny(keys) {
      return keys.some((k) => set.has(k));
    },
  };
}

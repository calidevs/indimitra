import { defineAbility } from '@casl/ability';
import { ROLES } from '../config/constants/roles';

export const defineUserAbility = (role) => {
  return defineAbility((can) => {
    role = role?.toLowerCase().trim();

    if (role === ROLES.ADMIN) {
      can('view', ROLES.ADMIN);
    } else if (role === ROLES.USER) {
      can('view', ROLES.USER);
    } else if (role === ROLES.DRIVER) {
      can('view', ROLES.DRIVER);
    }
  });
};

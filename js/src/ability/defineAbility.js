import { defineAbility } from '@casl/ability';
import { ROLES } from '../config/constants/roles';

export const defineUserAbility = (role) => {
  return defineAbility((can) => {
    role = role?.toLowerCase().trim();

    if (role === ROLES.ADMIN) {
      can('view', ROLES.ADMIN);
      can('view', ROLES.USER_STATUS);
    }

    if (role === ROLES.USER) {
      can('view', ROLES.USER);
      can('view', ROLES.ORDERS);
    }

    if (role === ROLES.DRIVER) {
      can('view', ROLES.DRIVER);
    }

    if (role === ROLES.STORE_MANAGER) {
      can('view', ROLES.STORE_MANAGER);
      can('manage', 'inventory');
    }
  });
};

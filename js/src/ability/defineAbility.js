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
      can('view', 'cart');
    }

    if (role === ROLES.DELIVERY_AGENT) {
      can('view', ROLES.DELIVERY_AGENT);
    }

    if (role === ROLES.STORE_MANAGER) {
      can('view', ROLES.STORE_MANAGER);
      can('manage', 'inventory');
    }
  });
};

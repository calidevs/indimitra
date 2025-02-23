import { defineAbility } from '@casl/ability';

export const defineUserAbility = (role) => {
  return defineAbility((can) => {
    role = role?.toLowerCase().trim();

    if (role === 'admin') {
      can('view', 'admin');
    } else if (role === 'user') {
      can('view', 'user');
    } else if (role === 'driver') {
      can('view', 'driver');
    }
  });
};

import { defineAbility } from '@casl/ability';

export const defineUserAbility = (role) => {
  return defineAbility((can) => {
    role = role?.toLowerCase().trim(); // Ensure lowercase and no spaces

    if (role === 'admin') {
      can('view', 'admin'); // ✅ Match what ProtectedRoute is checking
    } else if (role === 'user') {
      can('view', 'user');
    } else if (role === 'driver') {
      can('view', 'driver');
    }
  });
};

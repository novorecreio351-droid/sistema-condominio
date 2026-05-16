// permissions.js
export const ROLES = {
  PORTEIRO: "Porteiro",
  SINDICO: "Sindico",
  AUX: "Auxiliar Administrativo",
  DEV: "Desenvolvedor",
  CONSELHEIRO: "Conselheiro",
};

export const can = (user, action) => {
  const rules = {
    verDashboard: [
      ROLES.PORTEIRO,
      ROLES.SINDICO,
      ROLES.AUX,
      ROLES.DEV,
      ROLES.CONSELHEIRO,
    ],
    verDetalhesFesta: [ROLES.SINDICO, ROLES.AUX, ROLES.DEV],
    verDetalhesChurrasqueira: [ROLES.SINDICO, ROLES.AUX, ROLES.DEV],
    verDetalhesMudanca: [ROLES.PORTEIRO, ROLES.SINDICO, ROLES.AUX, ROLES.DEV],
  };

  // Garante que não quebre se o cargo não existir ou a action for inválida
  return rules[action]?.includes(user?.cargo) ?? false;
};
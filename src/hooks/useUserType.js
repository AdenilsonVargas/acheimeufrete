/**
 * Hook para obter userType de forma segura
 * Sempre retorna um tipo válido, nunca null
 * 
 * CRÍTICO: Evita o problema onde user é null após F5 refresh
 * e o sistema defaulta incorretamente para 'embarcador'
 */

import { useAuth } from './useAuth';

export const useUserType = () => {
  const { user } = useAuth();
  
  // Log para debug
  console.log('🔍 useUserType:', { 
    user_exists: !!user,
    email: user?.email,
    userType: user?.userType,
    fallback: user?.userType === 'transportador' ? 'transportador' : 'embarcador'
  });

  // Retornar userType do user se existir, caso contrário null (não fazer fallback aqui!)
  // O fallback deve ser feito onde é usado, nunca aqui
  return user?.userType || null;
};

export default useUserType;

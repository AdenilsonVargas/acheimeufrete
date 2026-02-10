import useAuthStore from './useAuthStore';

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const selectedUserType = useAuthStore((state) => state.selectedUserType);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  return {
    user,
    token,
    selectedUserType,
    isLoading,
    error,
    // Considera o usuário autenticado apenas quando 'user' estiver presente.
    // Isso evita mostrar UI autenticada quando apenas um token residual existe no localStorage
    // e o 'user' ainda não foi carregado.
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkAuth,
  };
};

export default useAuth;

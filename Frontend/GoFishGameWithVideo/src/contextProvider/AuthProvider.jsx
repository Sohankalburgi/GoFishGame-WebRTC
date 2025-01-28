import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    useEffect(() => {
      // Check if the user is logged in (e.g., token exists in localStorage)
      const token = localStorage.getItem('authToken');
      if (token) {
        setIsAuthenticated(true);
      }
    }, []);
  
    const login = (token) => {
      // Set the token in localStorage and update the state
      localStorage.setItem('authToken', token);
      setIsAuthenticated(true);
    };
  
    const logout = () => {
      // Remove the token and update the state
      localStorage.removeItem('authToken');
      setIsAuthenticated(false);
    };
  
    return (
      <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
        {children}
      </AuthContext.Provider>
    );
  };

export default AuthProvider;
import { createContext, useState, useContext } from "react";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({});
  const [persist, setPersist] = useState(() => {
    // Safely get from localStorage with error handling
    try {
      const stored = localStorage.getItem("persist");
      return stored ? JSON.parse(stored) : true;
    } catch (error) {
      console.error("Error reading persist from localStorage:", error);
      return true;
    }
  });

  // Update localStorage when persist changes
  const updatePersist = (value) => {
    setPersist(value);
    try {
      localStorage.setItem("persist", JSON.stringify(value));
    } catch (error) {
      console.error("Error saving persist to localStorage:", error);
    }
  };

  const value = {
    auth,
    setAuth,
    persist,
    setPersist: updatePersist
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export useAuth hook as well for convenience
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
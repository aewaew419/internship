import { createContext, useState } from "react";
import type { UserInterface } from "../service/api/user/type";
interface AuthContextType {
  user: UserInterface | null;
  setCredential: (user: UserInterface) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserInterface | null>(() => {
    try {
      const storedUser = localStorage.getItem("user_account");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
      return null;
    }
  });
  function setCredential(user: UserInterface) {
    setUser(user);
    localStorage.setItem("user_account", JSON.stringify(user));
    // const storedToken = localStorage.getItem("user_account");
  }

  return (
    <AuthContext.Provider value={{ user, setCredential }}>
      {children}
    </AuthContext.Provider>
  );
};

import { createContext, useState } from "react";
import { UserInterface } from "../service/api/user/type";
interface AuthContextType {
  user: UserInterface | null;
  setCredential: (user: UserInterface) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserInterface | null>(
    JSON.parse(JSON.stringify(localStorage.getItem("user_account")))
  );
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

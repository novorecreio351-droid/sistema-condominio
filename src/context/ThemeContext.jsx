import React, { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const toggleTheme = () => setIsDark(!isDark);

  useEffect(() => {
    localStorage.setItem("darkMode", isDark);
  }, [isDark]);

  // Definição da paleta de cores centralizada
  const theme = {
    bg: isDark ? "#0f172a" : "#f8fafc",
    card: isDark ? "#1e293b" : "#ffffff",
    text: isDark ? "#f8fafc" : "#1e293b",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    border: isDark ? "#334155" : "#e2e8f0",
    sidebar: isDark ? "#111827" : "#f8fafc",
    isDark // exporta o booleano também se precisar
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
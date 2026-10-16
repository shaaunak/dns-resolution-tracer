import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const RouterContext = createContext(null);

export function RouterProvider({ children }) {
  const [currentUrl, setCurrentUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname + window.location.search;
    }
    return "/";
  });

  const getPathname = () => {
    if (typeof window !== "undefined") {
      return window.location.pathname || "/";
    }
    return "/";
  };

  const [pathname, setPathname] = useState(getPathname);

  // Sync state on popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || "/");
      setCurrentUrl(window.location.pathname + window.location.search);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((to, options = {}) => {
    if (typeof window === "undefined") return;

    const target = typeof to === "string" ? to : "/";
    const [newPath, newSearch] = target.split("?");

    if (options.replace) {
      window.history.replaceState(options.state || null, "", target);
    } else {
      window.history.pushState(options.state || null, "", target);
    }

    setPathname(newPath || "/");
    setCurrentUrl(target);

    if (!options.keepScroll) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, []);

  // Parse query parameters from currentUrl
  const query = React.useMemo(() => {
    if (typeof window === "undefined") return {};
    const searchStr = currentUrl.includes("?") ? currentUrl.split("?")[1] : "";
    const params = new URLSearchParams(searchStr);
    const obj = {};
    for (const [key, val] of params.entries()) {
      obj[key] = val;
    }
    return obj;
  }, [currentUrl]);

  const value = {
    pathname,
    currentUrl,
    query,
    navigate,
  };

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error("useRouter must be used within a RouterProvider");
  }
  return ctx;
}

export function Link({ to, children, className = "", onClick, ...rest }) {
  const { navigate } = useRouter();

  const handleClick = (e) => {
    if (onClick) onClick(e);
    // Don't intercept if modifier keys held (e.g. Cmd/Ctrl for new tab)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
      return;
    }
    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} className={className} {...rest}>
      {children}
    </a>
  );
}


import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();
  const prevPathname = useRef<string>(pathname);
  const isBackNavigation = useRef<boolean>(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "scrollRestoration" in window.history
    ) {
      window.history.scrollRestoration = "auto";
    }

    const handlePopState = () => {
      isBackNavigation.current = true;
    };

    window.addEventListener("popstate", handlePopState);

    if (prevPathname.current !== pathname) {
      if (!isBackNavigation.current) {
        window.scrollTo(0, 0);
      }
      isBackNavigation.current = false;
      prevPathname.current = pathname;
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [pathname]);

  return null;
}

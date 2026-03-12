import { createContext, PropsWithChildren, useContext, useMemo } from "react";

import { ui } from "@/src/copy/ui";

type CopyContextValue = {
  locale: "en";
  copy: typeof ui;
};

const CopyContext = createContext<CopyContextValue | null>(null);

export function CopyProvider({ children }: PropsWithChildren) {
  const locale = "en" as const;

  const value = useMemo(
    () => ({
      locale,
      copy: ui,
    }),
    [locale],
  );

  return <CopyContext.Provider value={value}>{children}</CopyContext.Provider>;
}

export function useAppCopy() {
  const value = useContext(CopyContext);

  if (value) {
    return value.copy;
  }

  return ui;
}

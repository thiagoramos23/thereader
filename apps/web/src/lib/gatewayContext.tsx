import { createContext, useContext, type PropsWithChildren } from "react";
import type { ContentGateway } from "@reader/core";

const GatewayContext = createContext<ContentGateway | null>(null);

export function GatewayProvider({
  gateway,
  children
}: PropsWithChildren<{ gateway: ContentGateway }>) {
  return <GatewayContext.Provider value={gateway}>{children}</GatewayContext.Provider>;
}

export function useContentGateway(): ContentGateway {
  const gateway = useContext(GatewayContext);

  if (!gateway) {
    throw new Error("GatewayProvider is missing");
  }

  return gateway;
}

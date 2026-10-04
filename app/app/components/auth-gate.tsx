import { ReactNode } from "react";

type AccessGateProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  storageKey?: string;
  password?: string;
};

export function AccessGate({ children }: AccessGateProps) {
  return <>{children}</>;
}

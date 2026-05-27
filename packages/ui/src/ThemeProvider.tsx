import type { ReactNode, HTMLAttributes } from "react";

export interface ThemeProviderProps extends HTMLAttributes<HTMLDivElement> {
  /** Theme name, applied as `data-aston-theme="<name>"`. Default: "aston-default". */
  theme?: string;
  children?: ReactNode;
}

/**
 * Sets the active astonagent theme on a wrapping div. No React context — just a
 * data attribute that CSS variable rules key off.
 */
export function ThemeProvider({
  theme = "aston-default",
  children,
  className,
  ...rest
}: ThemeProviderProps) {
  return (
    <div
      data-aston-theme={theme}
      className={["aston-root", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

import { forwardRef } from "react";
import Spinner from "./Spinner";

type Variant = "primary" | "ghost" | "danger";
type Size = "md" | "sm";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flag " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-flag text-white hover:bg-flag-dark",
  ghost: "text-flag ring-1 ring-flag/30 hover:bg-flag/5",
  danger: "text-sun hover:bg-sun/10",
};
const sizes: Record<Size, string> = {
  md: "px-5 py-2.5",
  sm: "px-3 py-1.5 text-sm",
};

/** Shared button for the whole app: consistent focus ring, disabled state and a
 *  built-in loading spinner so pages don't re-implement "busy" styling each time. */
const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", loading, disabled, className = "", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
});

export default Button;

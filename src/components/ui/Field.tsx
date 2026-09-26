import { useId } from "react";

interface Props {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (id: string) => React.ReactNode;
}

/** Labels + hint/error text around any input/select/textarea, so every field in the
 *  app lines up the same way without repeating the markup. */
export default function Field({ label, hint, error, required, children }: Props) {
  const id = useId();
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block font-medium">
        {label}
        {required && <span className="text-sun"> *</span>}
      </span>
      {children(id)}
      {hint && !error && <span className="mt-1 block text-xs text-ink/50">{hint}</span>}
      {error && (
        <span role="alert" className="mt-1 block text-xs text-sun">
          {error}
        </span>
      )}
    </label>
  );
}

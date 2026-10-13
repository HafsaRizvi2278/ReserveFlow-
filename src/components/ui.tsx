"use client";
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Link, type LinkProps } from "../lib/navigation";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
const buttonBase =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-button font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2";
const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "border border-brand-700 bg-brand-700 text-white shadow-sm hover:border-brand-800 hover:bg-brand-800 active:border-brand-900 active:bg-brand-900",
  secondary:
    "border border-slate-500 bg-white text-slate-900 hover:border-slate-600 hover:bg-slate-50 active:bg-slate-100",
  ghost:
    "border border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",
  danger:
    "border border-danger-700 bg-danger-700 text-white hover:border-danger-800 hover:bg-danger-800 active:bg-danger-800",
};
const disabledButton =
  "disabled:pointer-events-none disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:shadow-none disabled:hover:border-slate-300 disabled:hover:bg-slate-100 disabled:hover:text-slate-500 disabled:active:bg-slate-100";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`${buttonBase} ${buttonVariants[variant]} ${disabledButton} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: LinkProps & { variant?: Exclude<ButtonVariant, "danger"> }) {
  return (
    <Link
      className={`${buttonBase} ${buttonVariants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  const controlId = `${id}-control`;
  let found = false;
  function annotate(nodes: ReactNode): ReactNode {
    return Children.map(nodes, (child) => {
      if (!isValidElement(child)) return child;
      const element = child as ReactElement<Record<string, unknown>>;
      if (
        !found &&
        (element.type === Input ||
          element.type === Select ||
          element.type === Textarea ||
          element.type === "input" ||
          element.type === "select" ||
          element.type === "textarea")
      ) {
        found = true;
        return cloneElement(element, {
          id: controlId,
          "aria-describedby": error || hint ? messageId : undefined,
          "aria-invalid": Boolean(error) || undefined,
        });
      }
      return element.props.children
        ? cloneElement(element, {
            children: annotate(element.props.children as ReactNode),
          })
        : element;
    });
  }
  const controls = annotate(children);
  return (
    <div
      className={`block text-label font-medium text-slate-700 ${error ? "[&_input]:border-danger-700 [&_select]:border-danger-700 [&_textarea]:border-danger-700" : ""}`}
    >
      <label htmlFor={controlId} className="mb-1.5 block">
        {label}
      </label>
      {controls}
      {hint && !error && (
        <span
          id={messageId}
          className="mt-1.5 block text-helper font-normal text-slate-500"
        >
          {hint}
        </span>
      )}
      {error && (
        <span
          id={messageId}
          className="mt-1.5 block text-helper font-normal text-danger-700"
        >
          {error}
        </span>
      )}
    </div>
  );
}

const control =
  "min-h-10 w-full rounded-lg border border-slate-500 bg-white px-3 py-2 text-control font-normal text-slate-900 outline-none placeholder:text-slate-500 hover:border-slate-600 focus:border-brand-700 focus:ring-2 focus:ring-brand-700 focus:ring-offset-2 disabled:pointer-events-none disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:hover:border-slate-300";
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${control} ${props.className ?? ""}`} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${control} ${props.className ?? ""}`} />
  );
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${control} min-h-24 resize-y ${props.className ?? ""}`}
    />
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "danger" | "neutral" | "info";
}) {
  const styles = {
    success: "border-success-200 bg-success-50 text-success-700",
    warning: "border-warning-200 bg-warning-50 text-warning-800",
    danger: "border-danger-200 bg-danger-50 text-danger-700",
    neutral: "border-slate-300 bg-slate-100 text-slate-600",
    info: "border-info-200 bg-info-50 text-info-800",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-badge font-semibold ${styles[tone]}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-current"
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  size = "md",
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const descriptionId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement;
    const node = ref.current;
    node
      ?.querySelector<HTMLElement>("button, input, select, textarea, a[href]")
      ?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key === "Tab" && node) {
        const focusable = [
          ...node.querySelectorAll<HTMLElement>(
            "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]",
          ),
        ];
        const first = focusable[0],
          last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [open]);
  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-2xl" };
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? descriptionId : undefined}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${widths[size]}`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2
              id="modal-title"
              className="text-section font-semibold text-slate-900"
            >
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-body text-slate-500">
                {description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            className="-mr-2 min-h-9 px-3"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <span aria-hidden="true">×</span>
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-xl text-brand-800"
        aria-hidden="true"
      >
        ◇
      </div>
      <h3 className="text-card-title font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-body text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      className="animate-pulse space-y-3"
      role="status"
      aria-label="Loading content"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-20 rounded-xl bg-slate-200/70"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-page-title-mobile font-semibold tracking-heading text-slate-900 sm:text-page-title">
          {title}
        </h1>
        <p className="mt-1.5 max-w-3xl text-body text-slate-500">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

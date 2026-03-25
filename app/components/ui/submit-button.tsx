'use client';

import { useFormStatus } from 'react-dom';

type SubmitButtonProps = {
  label: string | React.ReactNode;
  pendingLabel?: string | React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
};

export function SubmitButton({
  label,
  pendingLabel = 'Đang xử lý...',
  className,
  icon,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        'inline-flex items-center justify-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60'
      }
    >
      {icon && <span className="mr-2">{icon}</span>}
      {pending ? pendingLabel : label}
    </button>
  );
}

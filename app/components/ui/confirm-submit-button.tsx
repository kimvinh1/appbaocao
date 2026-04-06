'use client';

import type { ReactNode, MouseEvent } from 'react';

type ConfirmSubmitButtonProps = {
  children: ReactNode;
  className?: string;
  title?: string;
  message: string;
};

export function ConfirmSubmitButton({
  children,
  className,
  title,
  message,
}: ConfirmSubmitButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  }

  return (
    <button
      type="submit"
      title={title}
      className={className}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}

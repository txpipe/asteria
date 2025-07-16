import { forwardRef, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'id'>;

interface Props extends InputProps {
  name: string;
  label?: string;
  error?: string;
  containerClassName?: string;
}

function InputElem(
  { error, label, disabled, containerClassName, ...props }: Props,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  return (
    <fieldset className={clsx(containerClassName, 'mt-4')} disabled={disabled}>
      {label && <label htmlFor={props.name}>{label}</label>}
      <input
        {...props}
        ref={ref}
        id={props.name}
        className={clsx(
          'border rounded p-2 w-full disabled:cursor-not-allowed disabled:bg-gray-700',
          {
            'border-red-500': error,
            'border-gray-300': !error,
            'mt-2': !!label,
          },
          props.className,
        )}
      />
      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </fieldset>
  );
}

export const Input = forwardRef<HTMLInputElement, Props>(InputElem);

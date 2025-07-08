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
      {label && <label className='font-monocraft-regular text-sm' htmlFor={props.name}>{label}</label>}
      <input
        {...props}
        ref={ref}
        id={props.name}
        className={clsx(
          'border border-solid bg-black py-3 px-4 rounded-md font-inter-regular text-[#F1E9D9] bg-transparent focus:outline-none appearance-none text-md text-left w-full',
          {
            'border-red-500': error,
            'border-[#5B5B5B]': !error,
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

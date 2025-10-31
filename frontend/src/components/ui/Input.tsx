import { forwardRef, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'id'>;

interface Props extends InputProps {
  name: string;
  label?: string;
  error?: string;
  containerClassName?: string;
  button?: string;
  onClickButton?: () => void;
  comment?: string;
} 

function InputElem(
  { error, label, disabled, containerClassName, button, comment, onClickButton, ...props }: Props,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  return (
    <fieldset className={clsx(containerClassName, 'mt-4')} disabled={disabled}>
      {label && (
        <div className='flex items-end justify-between'>
          <label className='font-mono text-sm' htmlFor={props.name}>{label}</label>
          {button && (
            <button
              type="button"
              className="text-[#07F3E6] border border-solid border-[#07F3E6] py-1 px-3 rounded-full text-xs"
              onClick={() => onClickButton ? onClickButton() : null}
            >
              {button}
            </button>
          )}
          {comment && (
            <span className="text-sm text-white/90 mr-1">
              {comment}
            </span>
          )}
        </div>
      )}
      <input
        {...props}
        ref={ref}
        id={props.name}
        className={clsx(
          'border border-solid py-3 px-4 rounded-md text-[#F1E9D9] bg-transparent focus:outline-hidden appearance-none text-base text-left w-full',
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

export default forwardRef<HTMLInputElement, Props>(InputElem);

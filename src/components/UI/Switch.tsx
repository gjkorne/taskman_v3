import { cn } from '../../lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
  label?: string;
  hideLabel?: boolean;
  disabled?: boolean;
}

export default function Switch({
  checked,
  onChange,
  className = '',
  label,
  hideLabel = false,
  disabled = false,
}: SwitchProps): JSX.Element {
  return (
    <label
      className={cn(
        'relative inline-flex items-center cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
      />
      <div
        className={cn(
          'w-11 h-6 bg-gray-300 rounded-full peer',
          'peer-focus:ring-4 peer-focus:ring-blue-100',
          'dark:bg-gray-600 dark:peer-focus:ring-blue-800',
          'peer-checked:after:translate-x-full',
          'peer-checked:after:border-white',
          "after:content-[''] after:absolute after:top-[2px] after:left-[2px]",
          'after:bg-white after:border-gray-300 after:border',
          'after:rounded-full after:h-5 after:w-5',
          'after:transition-all',
          'dark:border-gray-600',
          'peer-checked:bg-indigo-600'
        )}
      ></div>
      {label && !hideLabel && (
        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
          {label}
        </span>
      )}
    </label>
  );
}

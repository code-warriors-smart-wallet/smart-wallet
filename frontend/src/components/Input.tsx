import { InputProps } from "@/interfaces/props";

// eslint-disable-next-line react/prop-types
function Input({ name, type, placeholder, value, maxLength, onChange, className, max, min, id, disabled, error, helperText }: InputProps) {
    return (
        <div className="w-full">
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                maxLength={maxLength}
                min={min || 0}
                id={id}
                className={`bg-bg-light-primary dark:bg-bg-dark-primary w-full p-3 my-1 rounded border-2 border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary outline-none focus:border-primary focus:bg-transparent text-sm disabled:opacity-50 ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
                disabled={disabled}
                {...(max !== undefined && { max })}
            />
            {error ? (
                <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{error}</p>
            ) : helperText ? (
                <p className="text-[10px] text-gray-400 mt-1 px-1 italic">{helperText}</p>
            ) : null}
        </div>
    );
}

export default Input;

import { InputProps } from "@/interfaces/props";

// eslint-disable-next-line react/prop-types
function Input({ name, type, placeholder, value, maxLength, onChange, className, min, id, disabled }: InputProps) {
    return (
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            min={min || 0}
            id={id}
            className={`bg-bg-light-primary dark:bg-bg-dark-primary w-full p-3 my-3 rounded border-2 border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary outline-none focus:border-primary focus:bg-transparent text-sm  disabled:opacity-50 ${className}`}
            disabled={disabled}
        />
    );
}

export default Input;

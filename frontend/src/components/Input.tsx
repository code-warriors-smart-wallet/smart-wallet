import { InputProps } from "@/interfaces/props";

// eslint-disable-next-line react/prop-types
function Input({ name, type, placeholder, value, maxLength, onChange, className, max, min, id, disabled, error, helperText, label, icon }: InputProps) {
    return (
        <div className="w-full space-y-1.5 focus-within:z-10">
            {label && (
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1 mb-1">
                    {label}
                </label>
            ) }
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors duration-300">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    min={min || 0}
                    id={id}
                    className={`bg-bg-light-primary dark:bg-bg-dark-primary w-full ${icon ? 'pl-12' : 'pl-4'} pr-4 py-4 rounded-2xl border-2 border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary outline-none focus:border-primary/50 focus:bg-primary/[0.02] text-sm font-bold transition-all duration-300 disabled:opacity-50 ${error ? 'border-red-500/50 focus:border-red-500' : ''} ${className}`}
                    disabled={disabled}
                    {...(max !== undefined && { max })}
                />
            </div>
            {error ? (
                <p className="text-[10px] text-red-500 font-bold mt-1 px-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                    <span className="w-1 h-1 rounded-full bg-red-500" /> {error}
                </p>
            ) : helperText ? (
                <p className="text-[10px] text-gray-400 mt-1 px-1 italic">{helperText}</p>
            ) : null}
        </div>
    );
}

export default Input;

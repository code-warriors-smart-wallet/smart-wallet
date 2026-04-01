import { ButtonProps } from "@/interfaces/props";

// eslint-disable-next-line react/prop-types
function Button({ text, type, onClick, className, disabled = false, priority = "primary" }: ButtonProps) {
    const classs = priority == "primary" ? 
                            `w-full shadow-xl py-2.5 px-4 text-sm font-semibold rounded text-text-dark-primary bg-secondary hover:bg-primary focus:outline-none active:scale-98 disabled:opacity-50 disabled:pointer-events-none  ${className}`:
                            `w-full shadow-xl py-2.5 px-4 text-sm font-semibold rounded text-text-dark-primary bg-transparent border-2 border-border-dark-primary hover:bg-hover-dark-primary focus:outline-none active:scale-98 disabled:opacity-50 disabled:pointer-events-none  ${className}`
    return (
        <button
            type={type ?? "button"}
            onClick={onClick}
            disabled={disabled}
            className={classs}
        >
            {text}
        </button>
    )
}

export default Button;

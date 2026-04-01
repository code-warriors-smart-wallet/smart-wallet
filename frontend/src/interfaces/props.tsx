import { IconType } from "react-icons";

export interface ButtonProps {
    text: React.ReactNode,
    type?: "button" | "submit" | "reset";
    onClick?: () => void,
    className?: string,
    disabled?: boolean | undefined | null,
    priority?: "primary" | "secondary"
}

export interface InputProps {
    name: string;
    type: string;
    placeholder: string;
    value: string;
    maxLength?: number;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string,
    min?: string
    max?: number|undefined
    id?:string
    disabled?: boolean
}

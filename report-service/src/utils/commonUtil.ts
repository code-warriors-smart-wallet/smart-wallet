function toTitleCase(str: string): string {
    return str.split("_").map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(" ");
}

export { toTitleCase };
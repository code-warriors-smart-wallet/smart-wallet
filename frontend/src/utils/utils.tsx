export const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

const isValidDateFormat = (value: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}/; // xxxx-xx-xx
  return regex.test(value);
};

export function getFormattedDate(input: string) {
  if (input==="Not set") return input;
  const date = new Date(input);
  const day = date.getDate();
  const month = months[date.getMonth()]
  const year = date.getFullYear();

  return `${String(day).padStart(2, "0")} ${month} ${year}`
}

export function capitalize(str: string): string {
  if (!str) return str; 
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function toStrdSpaceType(str: string|undefined): string {
  if (!str) return ""; 
  return str.toUpperCase().split("-").join("_");
}

export function toLocalSpaceType(str: string): string {
  if (!str) return str; 
  return str.toLowerCase().split("_").join("-");
}

export function generateRandomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
}

export function getTodayDate() {
   const input = new Date();

   const year = input.getFullYear();
   const month = String(input.getMonth() + 1).padStart(2, '0');
   const day = String(input.getDate()).padStart(2, '0');

   const localDate = `${year}-${month}-${day}`;
   return localDate;
}


export function getFirstDayOfMonth() {
   const input = new Date();

   const year = input.getFullYear();
   const month = String(input.getMonth() + 1).padStart(2, '0');
   const day = "01";
   const localDate = `${year}-${month}-${day}`;
   return localDate;
}

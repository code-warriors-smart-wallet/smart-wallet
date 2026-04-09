import { use, useEffect, useState } from "react";
import Button from "../../components/Button";
import { toast } from "react-toastify";
import { AuthService } from "../../services/auth/auth.service";
import LoadingButton from "../../components/LoadingButton";
import { useLocation } from "react-router-dom";
import { UserPortalView } from "../../components/user.portal/SideBar";

interface Currency {
   code: string;
   name: string;
   symbol: string;
}

function Currency() {
   const [currencies, setCurrencies] = useState<Currency[]>([]);
   const [selectedCurrency, setSelectedCurrency] = useState<string>("");
   const [loading, setLoading] = useState(false);
   const location = useLocation();
   const token = location.state?.token;

   const { loginWithGoogle } = AuthService();

   useEffect(() => {
      // TODO: set loading tru until fetch currencies
      const fetchCurrencies = async () => {
         try {
            const response = await fetch("https://restcountries.com/v3.1/all?fields=name,currencies");
            const data = await response.json();
            const currencyList: Currency[] = [];

            data.forEach((country: any) => {
               if (country.currencies) {
                  Object.entries(country.currencies).forEach(([code, details]: any) => {
                     currencyList.push({
                        code,
                        name: details.name,
                        symbol: details.symbol || "",
                     });
                  });
               }
            });

            // Remove duplicates
            const uniqueCurrencies = Array.from(
               new Map(currencyList.map((item) => [item.code, item])).values()
            );

            setCurrencies(uniqueCurrencies);
         } catch (error) {
            toast.error("Failed to fetch currencies!");
         }
      };

      fetchCurrencies();
   }, []);

   const onCurrencySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedCurrency(e.target.value);
   };

   const onSubmit = async () => {
      if (!selectedCurrency) {
         toast.error("Please select a currency!");
         return;
      } if (!token) {
         return;
      }
      setLoading(true);
      await loginWithGoogle({ token: token, currency: selectedCurrency }, `/user-portal/all/all/${UserPortalView.DASHBOARD}`)
      setLoading(false)
   };

   return (
      <div className="font-main dark">
         <div className="min-h-screen flex flex-col items-center justify-center py-6 px-4 bg-bg-light-secondary dark:bg-bg-dark-secondary">
            <div className="max-w-md w-full">
               <h3 className="text-text-light-primary dark:text-text-dark-primary text-3xl font-extrabold mb-8">
                  Select Your Currency
               </h3>

               <div className="space-y-4">
                  <select
                     className="w-full p-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary"
                     value={selectedCurrency}
                     onChange={onCurrencySelect}
                  >
                     <option value="" disabled>
                        Select a currency
                     </option>
                     {currencies
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((currency) => (
                           <option key={currency.code} value={currency.code}>
                              {currency.name} ({currency.code}) {currency.symbol && `- ${currency.symbol}`}
                           </option>
                        ))}
                  </select>
               </div>

               <div className="!mt-8">
                  {
                     loading ? (
                        <LoadingButton text="Saving..." />
                     ) : (
                        <Button text="Create account" onClick={onSubmit} />
                     )
                  }
               </div>
            </div>
         </div>
      </div>
   );
}

export default Currency;
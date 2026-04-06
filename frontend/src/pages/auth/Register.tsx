import { useEffect, useState } from "react";
import Button from "../../components/Button";
import { FacebookIcon, GoogleIcon } from "../../components/icons";
import Input from "../../components/Input";
import { toast } from 'react-toastify';
import { RegistrationInfo } from "../../interfaces/modals";
import { AuthService } from "../../services/auth/auth.service";
import LoadingButton from "../../components/LoadingButton";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";

interface Currency {
    code: string;
    name: string;
    symbol: string;
}

function Register() {
    const [inputs, setInputs] = useState<RegistrationInfo>({ username: "", email: "", password: "", currency: "select-currency" })
    const [loading, setLoading] = useState(false);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const { register, loginWithGoogle } = AuthService();
    const navigate = useNavigate();

    useEffect(() => {
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

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setInputs(prev => {
            return { ...prev, [name]: value }
        });
    }

    const onCurrencySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setInputs(prev => {
            return { ...prev, currency: e.target.value }
        });
    };

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    }

    const onEmailRegister = async () => {
        if (!validateInputs(inputs)) return;
        console.log(inputs);
        setLoading(true);
        await register(inputs)
        setLoading(false);
    }

    const onGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse: any) => {
            console.log(tokenResponse);
            navigate("/register/currency", { state: { token: tokenResponse.access_token } })
        },
        onError: () => toast.error("Registration failed!")
    });

    return (
        <div className="font-main dark">
            <div className="min-h-screen flex fle-col items-center justify-center py-6 px-4 bg-bg-light-secondary dark:bg-bg-dark-secondary">
                <div className="grid md:grid-cols-2 items-center gap-10 max-w-6xl max-md:max-w-md w-full">
                    <div>
                        <h2 className="lg:text-5xl text-3xl font-extrabold lg:leading-[55px] text-text-light-primary dark:text-text-dark-primary">
                            Seamless Login for Exclusive Access
                        </h2>
                        <p className="text-sm mt-6 text-text-light-secondary dark:text-text-dark-secondary">Immerse yourself in a hassle-free login journey with our intuitively designed login form. Effortlessly access your account.</p>
                        <p className="text-sm mt-12 text-text-light-secondary dark:text-text-dark-secondary">Already have an account? <Link to={"/login"}><span className="text-primary font-semibold hover:underline ml-1">Login here</span></Link></p>
                    </div>

                    <form className="max-w-md md:ml-auto w-full" onSubmit={onSubmit}>
                        <h3 className="text-text-light-primary dark:text-text-dark-primary text-3xl font-extrabold mb-5">
                            Create account
                        </h3>

                        <div className="space-y-4">
                            <Input name="username" type="text" placeholder="Username" value={inputs.username} onChange={onInputChange} />
                            <Input name="email" type="email" placeholder="Email address" value={inputs.email} onChange={onInputChange} />
                            <select
                                className="w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm"
                                value={inputs.currency}
                                onChange={onCurrencySelect}
                            >
                                <option value="select-currency" disabled>
                                    Select Country
                                </option>
                                {currencies
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((currency) => (
                                        <option key={currency.code} value={currency.code}>
                                            {currency.name} ({currency.code}) {currency.symbol && `- ${currency.symbol}`}
                                        </option>
                                    ))}
                            </select>
                            <Input name="password" type="password" placeholder="Password" value={inputs.password} onChange={onInputChange} />
                        </div>

                        <div className="!mt-8">
                            {
                                loading ? <LoadingButton text="Creating account..." /> : <Button text="Create account" onClick={onEmailRegister} />
                            }
                        </div>

                        <div className="my-4 flex items-center gap-4">
                            <hr className="w-full border-border-light-primary dark:border-border-dark-primary" />
                            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary text-center">or</p>
                            <hr className="w-full border-border-light-primary dark:border-border-dark-primary" />
                        </div>

                        <button onClick={() => onGoogleLogin()} type="button" className='active:scale-98 mb-3 hs-XqwWvWI-3ad3e02c8d29hs-XqwWvWI- w-full hs-XqwWvWI-3ad3e02c8dhs-XqwWvWI- hs-XqwWvWI-8c9b928e0a29hs-XqwWvWI- flex hs-XqwWvWI-8c9b928e0ahs-XqwWvWI- hs-XqwWvWI-8fa3992b2029hs-XqwWvWI- items-center hs-XqwWvWI-8fa3992b20hs-XqwWvWI- hs-XqwWvWI-f9a4827d4d29hs-XqwWvWI- justify-center hs-XqwWvWI-f9a4827d4dhs-XqwWvWI- hs-XqwWvWI-e577dc2bef29hs-XqwWvWI- gap-4 hs-XqwWvWI-e577dc2befhs-XqwWvWI- hs-XqwWvWI-8395fae57b29hs-XqwWvWI- py-3 hs-XqwWvWI-8395fae57bhs-XqwWvWI- hs-XqwWvWI-ccddc7d62629hs-XqwWvWI- px-6 hs-XqwWvWI-ccddc7d626hs-XqwWvWI- hs-XqwWvWI-36ff319a6829hs-XqwWvWI- text-sm hs-XqwWvWI-36ff319a68hs-XqwWvWI- hs-XqwWvWI-6f1bbbe2f729hs-XqwWvWI- tracking-wide hs-XqwWvWI-6f1bbbe2f7hs-XqwWvWI- hs-XqwWvWI-b7c9ae9a9029hs-XqwWvWI- text-text-light-secondary dark:text-text-dark-secondary hs-XqwWvWI-b7c9ae9a90hs-XqwWvWI- hs-XqwWvWI-9ff09b5fd029hs-XqwWvWI- border hs-XqwWvWI-9ff09b5fd0hs-XqwWvWI- hs-XqwWvWI-1b1ab7973029hs-XqwWvWI- border-border-light-primary dark:border-border-dark-primary hs-XqwWvWI-1b1ab79730hs-XqwWvWI- hs-XqwWvWI-d05034dc4d29hs-XqwWvWI- rounded-md hs-XqwWvWI-d05034dc4dhs-XqwWvWI- hs-XqwWvWI-8e263205c629hs-XqwWvWI- bg-bg-light-primary dark:bg-bg-dark-primary hs-XqwWvWI-8e263205c6hs-XqwWvWI- hs-XqwWvWI-8e06a6b0a629hs-XqwWvWI- hover:bg-hover-light-primary dark:hover:bg-hover-dark-primary hs-XqwWvWI-8e06a6b0a6hs-XqwWvWI- hs-XqwWvWI-5d4084d3cd29hs-XqwWvWI- focus:outline-none hs-XqwWvWI-5d4084d3cdhs-XqwWvWI-'>
                            <GoogleIcon />
                            Continue with google
                        </button>

                        <button type="button" className='active:scale-98 hs-XqwWvWI-3ad3e02c8d29hs-XqwWvWI- w-full hs-XqwWvWI-3ad3e02c8dhs-XqwWvWI- hs-XqwWvWI-8c9b928e0a29hs-XqwWvWI- flex hs-XqwWvWI-8c9b928e0ahs-XqwWvWI- hs-XqwWvWI-8fa3992b2029hs-XqwWvWI- items-center hs-XqwWvWI-8fa3992b20hs-XqwWvWI- hs-XqwWvWI-f9a4827d4d29hs-XqwWvWI- justify-center hs-XqwWvWI-f9a4827d4dhs-XqwWvWI- hs-XqwWvWI-e577dc2bef29hs-XqwWvWI- gap-4 hs-XqwWvWI-e577dc2befhs-XqwWvWI- hs-XqwWvWI-8395fae57b29hs-XqwWvWI- py-3 hs-XqwWvWI-8395fae57bhs-XqwWvWI- hs-XqwWvWI-ccddc7d62629hs-XqwWvWI- px-6 hs-XqwWvWI-ccddc7d626hs-XqwWvWI- hs-XqwWvWI-36ff319a6829hs-XqwWvWI- text-sm hs-XqwWvWI-36ff319a68hs-XqwWvWI- hs-XqwWvWI-6f1bbbe2f729hs-XqwWvWI- tracking-wide hs-XqwWvWI-6f1bbbe2f7hs-XqwWvWI- hs-XqwWvWI-b7c9ae9a9029hs-XqwWvWI- text-text-light-secondary dark:text-text-dark-secondary hs-XqwWvWI-b7c9ae9a90hs-XqwWvWI- hs-XqwWvWI-9ff09b5fd029hs-XqwWvWI- border hs-XqwWvWI-9ff09b5fd0hs-XqwWvWI- hs-XqwWvWI-1b1ab7973029hs-XqwWvWI- border-border-light-primary dark:border-border-dark-primary hs-XqwWvWI-1b1ab79730hs-XqwWvWI- hs-XqwWvWI-d05034dc4d29hs-XqwWvWI- rounded-md hs-XqwWvWI-d05034dc4dhs-XqwWvWI- hs-XqwWvWI-8e263205c629hs-XqwWvWI- bg-bg-light-primary dark:bg-bg-dark-primary hs-XqwWvWI-8e263205c6hs-XqwWvWI- hs-XqwWvWI-8e06a6b0a629hs-XqwWvWI- hover:bg-hover-light-primary dark:hover:bg-hover-dark-primary hs-XqwWvWI-8e06a6b0a6hs-XqwWvWI- hs-XqwWvWI-5d4084d3cd29hs-XqwWvWI- focus:outline-none hs-XqwWvWI-5d4084d3cdhs-XqwWvWI-'>
                            <FacebookIcon />
                            Continue with Facebook
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Register;

function validateInputs({ username, email, password, currency }: RegistrationInfo) {
    if (username.trim() === "") {
        toast.error("Username is required!")
        return false;
    } else if (username.trim().length <= 3) {
        toast.error("Username must have atleast 4 characters!")
        return false;
    }

    if (email.trim() === "") {
        toast.error("Email is required!")
        return false;
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(email)) {
        toast.error("Invalid email address!")
        return false;
    }

    if (currency.trim() === "select-currency") {
        toast.error("Country is required!")
        return false;
    }

    if (password.trim() === "") {
        toast.error("Password is required!")
        return false;
    } else if (password.trim().length < 8) {
        toast.error("Password must have atleast 8 characters!")
        return false;
    }
    return true;
}

import { useState } from "react";
import Button from "../../components/Button";
import { FacebookIcon, GoogleIcon } from "../../components/icons";
import Input from "../../components/Input";
import { toast } from 'react-toastify';
import { Link } from "react-router-dom";
import { LoginInfo } from "../../interfaces/modals";
import { AuthService } from "../../services/auth/auth.service";
import LoadingButton from "../../components/LoadingButton";
import { useGoogleLogin } from '@react-oauth/google';

// TODO: Check login with social media
function Login() {
    const [inputs, setInputs] = useState<LoginInfo>({ email: "", password: "" });
    const [loggingIn, setLoggingIn] = useState<boolean>(false)
    const { login, loginWithGoogle } = AuthService()
    const {redirect} = Object.fromEntries(new URLSearchParams(window.location.search));

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target as HTMLInputElement;
        setInputs(prev => {
            return { ...prev, [name]: value }
        });
    }

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    }

    const onEmailLogin = async () => {
        console.log(inputs);
        if (!validateInputs(inputs)) return;
        setLoggingIn(true)
        await login(inputs, redirect)
        setLoggingIn(false);
    }

    const onGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse: any) => {
            console.log(tokenResponse);
            await loginWithGoogle({ token: tokenResponse.access_token }, redirect)
        },
        onError: () => toast.error("Login failed!")
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
                        <p className="text-sm mt-12 text-text-light-secondary dark:text-text-dark-secondary">Don&apos;t have an account? <Link to={"/register"}><span className="text-primary font-semibold hover:underline ml-1">Register here</span></Link></p>
                    </div>

                    <form className="max-w-md md:ml-auto w-full" onSubmit={onSubmit}>
                        <h3 className="text-text-light-primary dark:text-text-dark-primary text-3xl font-extrabold mb-8">
                            Sign in
                        </h3>

                        <div className="space-y-4">
                            <Input name="email" type="email" placeholder="Email address" value={inputs.email} onChange={onInputChange} />
                            <Input name="password" type="password" placeholder="Password" value={inputs.password} onChange={onInputChange} />
                            <div className="text-sm text-right">
                                <a href="jajvascript:void(0);" className="text-primary hover:underline font-semibold">
                                    Forgot your password?
                                </a>
                            </div>
                        </div>

                        <div className="!mt-8">
                            {
                                loggingIn ? <LoadingButton text="Logging in..." /> : <Button text="Login" onClick={onEmailLogin} />
                            }
                        </div>

                        <div className="my-4 flex items-center gap-4">
                            <hr className="w-full border-border-light-primary dark:border-border-dark-primary" />
                            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary text-center">or</p>
                            <hr className="w-full border-border-light-primary dark:border-border-dark-primary" />
                        </div>

                        <button
                            type="button"
                            className='active:scale-98 mb-3 hs-XqwWvWI-3ad3e02c8d29hs-XqwWvWI- w-full hs-XqwWvWI-3ad3e02c8dhs-XqwWvWI- hs-XqwWvWI-8c9b928e0a29hs-XqwWvWI- flex hs-XqwWvWI-8c9b928e0ahs-XqwWvWI- hs-XqwWvWI-8fa3992b2029hs-XqwWvWI- items-center hs-XqwWvWI-8fa3992b20hs-XqwWvWI- hs-XqwWvWI-f9a4827d4d29hs-XqwWvWI- justify-center hs-XqwWvWI-f9a4827d4dhs-XqwWvWI- hs-XqwWvWI-e577dc2bef29hs-XqwWvWI- gap-4 hs-XqwWvWI-e577dc2befhs-XqwWvWI- hs-XqwWvWI-8395fae57b29hs-XqwWvWI- py-3 hs-XqwWvWI-8395fae57bhs-XqwWvWI- hs-XqwWvWI-ccddc7d62629hs-XqwWvWI- px-6 hs-XqwWvWI-ccddc7d626hs-XqwWvWI- hs-XqwWvWI-36ff319a6829hs-XqwWvWI- text-sm hs-XqwWvWI-36ff319a68hs-XqwWvWI- hs-XqwWvWI-6f1bbbe2f729hs-XqwWvWI- tracking-wide hs-XqwWvWI-6f1bbbe2f7hs-XqwWvWI- hs-XqwWvWI-b7c9ae9a9029hs-XqwWvWI- text-text-light-secondary dark:text-text-dark-secondary hs-XqwWvWI-b7c9ae9a90hs-XqwWvWI- hs-XqwWvWI-9ff09b5fd029hs-XqwWvWI- border hs-XqwWvWI-9ff09b5fd0hs-XqwWvWI- hs-XqwWvWI-1b1ab7973029hs-XqwWvWI- border-border-light-primary dark:border-border-dark-primary hs-XqwWvWI-1b1ab79730hs-XqwWvWI- hs-XqwWvWI-d05034dc4d29hs-XqwWvWI- rounded-md hs-XqwWvWI-d05034dc4dhs-XqwWvWI- hs-XqwWvWI-8e263205c629hs-XqwWvWI- bg-bg-light-primary dark:bg-bg-dark-primary hs-XqwWvWI-8e263205c6hs-XqwWvWI- hs-XqwWvWI-8e06a6b0a629hs-XqwWvWI- hover:bg-hover-light-primary dark:hover:bg-hover-dark-primary hs-XqwWvWI-8e06a6b0a6hs-XqwWvWI- hs-XqwWvWI-5d4084d3cd29hs-XqwWvWI- focus:outline-none hs-XqwWvWI-5d4084d3cdhs-XqwWvWI-'
                            onClick={() => onGoogleLogin()}
                        >
                            <GoogleIcon />
                            Continue with google
                        </button>

                        {/* <GoogleLogin onSuccess={responseMessage} onError={errorMessage} /> */}

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

export default Login;

function validateInputs({ email, password }: LoginInfo) {
    if (email.trim() === "") {
        toast.error("Email is required!")
        return false;
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(email)) {
        toast.error("Invalid email address!")
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

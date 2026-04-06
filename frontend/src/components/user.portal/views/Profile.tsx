import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store/store";
import { UserService } from "../../../services/user.service";
import Input from "../../Input";
import Button from "../../Button";
import Loading from "../../Loading";
import DropDown from "../../Dropdown";
import { MdEdit, MdSecurity, MdPerson, MdLanguage, MdPalette, MdPhotoCamera, MdAddAPhoto } from "react-icons/md";
import { toast } from "react-toastify";

interface CurrencyInfo {
    code: string;
    name: string;
    symbol: string;
}

function Profile() {
    const { email, username, currency, theme, profileImgUrl } = useSelector((state: RootState) => state.auth);
    const { updateProfile, changePassword } = UserService();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form states
    const [editCurrency, setEditCurrency] = useState(currency || "USD");
    const [editTheme, setEditTheme] = useState(theme || "dark");
    const [editProfileImg, setEditProfileImg] = useState(profileImgUrl || "");
    const [loading, setLoading] = useState(false);

    // Password states
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Dynamic Currency List
    const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([]);
    const [currencyNames, setCurrencyNames] = useState<string[]>([]);
    const [fetchingCurrencies, setFetchingCurrencies] = useState(true);

    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const response = await fetch("https://restcountries.com/v3.1/all?fields=name,currencies");
                const data = await response.json();
                const list: CurrencyInfo[] = [];

                if (Array.isArray(data)) {
                    data.forEach((country: any) => {
                        if (country.currencies) {
                            Object.entries(country.currencies).forEach(([code, details]: any) => {
                                list.push({
                                    code,
                                    name: details.name,
                                    symbol: details.symbol || "",
                                });
                            });
                        }
                    });

                    // Unique sort
                    const unique = Array.from(
                        new Map(list.map((item) => [item.code, item])).values()
                    ).sort((a, b) => a.name.localeCompare(b.name));

                    setAvailableCurrencies(unique);
                    setCurrencyNames(unique.map(c => `${c.name} (${c.code})`));
                } else {
                    console.warn("RestCountries API returned non-array response:", data);
                    const fallback = [
                        { name: "US Dollar", code: "USD" },
                        { name: "Euro", code: "EUR" },
                        { name: "British Pound", code: "GBP" },
                        { name: "Sri Lankan Rupee", code: "LKR" },
                        { name: "Indian Rupee", code: "INR" },
                        { name: "Japanese Yen", code: "JPY" },
                        { name: "Australian Dollar", code: "AUD" }
                    ];
                    setCurrencyNames(fallback.map(c => `${c.name} (${c.code})`));
                }
            } catch (error) {
                console.error("Failed to fetch currencies:", error);
                toast.error("Failed to load currency list. Using defaults.");
                setCurrencyNames(["USD", "EUR", "GBP", "LKR", "INR", "JPY", "CAD", "AUD"]);
            } finally {
                setFetchingCurrencies(false);
            }
        };
        fetchCurrencies();
    }, []);

    const handleUpdateProfile = async () => {
        setLoading(true);
        const success = await updateProfile({
            currency: editCurrency,
            theme: editTheme,
            profileImgUrl: editProfileImg
        });
        setLoading(false);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match!");
            return;
        }
        setPasswordLoading(true);
        const success = await changePassword({ currentPassword, newPassword });
        if (success) {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        }
        setPasswordLoading(false);
    };

    const onCurrencyChange = (val: string) => {
        // Handle both "Name (CODE)" format and direct "CODE" fallback
        const codeMatch = val.match(/\(([A-Z]{3,})\)/);
        const code = codeMatch ? codeMatch[1] : val;
        setEditCurrency(code);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024 * 2) { // 2MB limit for Base64 (practical)
                toast.error("Image too large. Please select an image under 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditProfileImg(reader.result as string);
                toast.success("Image updated! Don't forget to save changes.");
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="max-w-5xl mx-auto pb-16 px-4 animate-fade-in font-main">
            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
            />

            {/* Header Section */}
            <div className="mb-10 text-center sm:text-left">
                <h1 className="text-4xl font-extrabold text-text-light-primary dark:text-text-dark-primary tracking-tight">Profile Settings</h1>
                <p className="text-gray-500 mt-2 font-medium">Customize your appearance and keep your account secure.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Avatar & Quick Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-bg-light-secondary dark:bg-bg-dark-secondary p-8 rounded-3xl border border-border-light-primary dark:border-border-dark-primary shadow-2xl flex flex-col items-center">
                        <div 
                            onClick={triggerFileInput}
                            className="relative group overflow-hidden rounded-full w-44 h-44 border-4 border-primary/30 p-1 mb-6 cursor-pointer bg-bg-light-primary dark:bg-bg-dark-primary"
                        >
                            {editProfileImg ? (
                                <img 
                                    src={editProfileImg} 
                                    alt="Avatar" 
                                    className="w-full h-full object-cover rounded-full transition-transform duration-500 group-hover:scale-110" 
                                    onError={(e) => (e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + username + '&background=random')}
                                />
                            ) : (
                                <div className="w-full h-full bg-primary/5 flex items-center justify-center rounded-full transition-colors group-hover:bg-primary/10">
                                    <MdPerson size={72} className="text-primary/40 group-hover:text-primary" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center backdrop-blur-sm">
                                <MdAddAPhoto size={36} className="text-white" />
                                <span className="text-[10px] text-white font-black mt-2 uppercase tracking-widest bg-primary px-2 py-0.5 rounded shadow-sm">Change Photo</span>
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-text-light-primary dark:text-text-dark-primary tracking-tight">{username}</h2>
                        <p className="text-xs font-bold text-gray-500 mt-1">{email}</p>
                        
                        <div className="mt-10 w-full space-y-3">
                            <div className="flex justify-between items-center p-4 rounded-2xl bg-bg-light-primary dark:bg-black/20 border border-border-light-primary dark:border-border-dark-primary/30">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</span>
                                <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-2.5 py-1 rounded-md">Pro Member</span>
                            </div>
                            <div className="flex justify-between items-center p-4 rounded-2xl bg-bg-light-primary dark:bg-black/20 border border-border-light-primary dark:border-border-dark-primary/30">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Currency</span>
                                <span className="text-xs font-black text-text-light-primary dark:text-text-dark-primary uppercase">{editCurrency}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-3xl border border-primary/20">
                        <h4 className="text-xs font-black text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                            <MdSecurity /> Security Tip
                        </h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed italic">Updating your password frequently helps protect your data. Use a mix of letters, numbers, and symbols.</p>
                    </div>
                </div>

                {/* Right Column: Forms */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* General Settings Card */}
                    <div className="bg-bg-light-secondary dark:bg-bg-dark-secondary p-10 rounded-3xl border border-border-light-primary dark:border-border-dark-primary shadow-2xl">
                        <div className="flex items-center gap-2 mb-10">
                            <div className="p-2.5 bg-primary/10 rounded-xl">
                                <MdPerson className="text-primary text-xl" />
                            </div>
                            <h3 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">Personal Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Username</label>
                                <Input 
                                    name="username_read" 
                                    type="text" 
                                    placeholder="Username" 
                                    value={username || ""} 
                                    disabled 
                                    onChange={() => {}} 
                                    className="opacity-50 cursor-not-allowed bg-gray-50 dark:bg-black/20 h-12" 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Email Address</label>
                                <Input 
                                    name="email_read" 
                                    type="email" 
                                    placeholder="Email" 
                                    value={email || ""} 
                                    disabled 
                                    onChange={() => {}} 
                                    className="opacity-50 cursor-not-allowed bg-gray-50 dark:bg-black/20 h-12" 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Currency Preference</label>
                                <div className="mt-1">
                                    <DropDown 
                                        title={fetchingCurrencies ? "Loading..." : editCurrency} 
                                        dropdownItems={currencyNames} 
                                        onClick={onCurrencyChange}
                                        titleIcon={<MdLanguage className="text-primary" />}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Application Theme</label>
                                <div className="mt-1">
                                    <DropDown 
                                        title={editTheme === 'dark' ? "Dark Mode" : "Light Mode"} 
                                        dropdownItems={["dark", "light"]} 
                                        onClick={(val) => setEditTheme(val)}
                                        titleIcon={<MdPalette className="text-primary" />}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-10 border-t border-border-light-primary dark:border-border-dark-primary/30">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Profile Image URL (External)</label>
                            <Input 
                                name="profileImgUrl" 
                                type="text"
                                placeholder="Paste your image URL here..." 
                                value={editProfileImg.startsWith('data:') ? "[Uploaded Image]" : editProfileImg} 
                                onChange={(e) => setEditProfileImg(e.target.value)}
                                className="h-10 text-xs"
                            />
                            <p className="text-[10px] text-gray-400 mt-3 italic leading-relaxed">
                                You can click the avatar above to upload a photo directly, or paste a URL here.
                            </p>
                        </div>

                        <div className="mt-10 flex justify-end">
                            <Button 
                                text={loading ? "Saving Progress..." : "Save Profile Changes"} 
                                disabled={loading}
                                onClick={handleUpdateProfile}
                                className="w-full sm:w-auto px-12 rounded-2xl h-14 font-bold shadow-primary/20"
                            />
                        </div>
                    </div>

                    {/* Security Card */}
                    <div className="bg-bg-light-secondary dark:bg-bg-dark-secondary p-10 rounded-3xl border border-border-light-primary dark:border-border-dark-primary shadow-2xl">
                        <div className="flex items-center gap-2 mb-10">
                            <div className="p-2.5 bg-primary/10 rounded-xl">
                                <MdSecurity className="text-primary text-xl" />
                            </div>
                            <h3 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">Security & Password</h3>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-8">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Current Password</label>
                                <Input 
                                    name="currentPassword"
                                    type="password" 
                                    placeholder="••••••••" 
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="h-12"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">New Password</label>
                                    <Input 
                                        name="newPassword"
                                        type="password" 
                                        placeholder="Min 8 characters" 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="h-12"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Confirm Password</label>
                                    <Input 
                                        name="confirmPassword"
                                        type="password" 
                                        placeholder="Re-type new password" 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="h-12"
                                    />
                                </div>
                            </div>

                            <div className="mt-10 flex justify-end pt-4">
                                <Button 
                                    text={passwordLoading ? "Updating..." : "Update Password"} 
                                    disabled={passwordLoading || !currentPassword || !newPassword || newPassword !== confirmPassword}
                                    type="submit"
                                    onClick={() => {}}
                                    className="w-full sm:w-auto px-12 rounded-2xl h-14 font-bold"
                                />
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
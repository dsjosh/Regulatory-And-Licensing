import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar(){

    const nav=useNavigate();
    const [name, setName] = useState("");

    useEffect(() => {
        fetch("/api/session")
            .then(res => res.json())
            .then(data => {
                if (data.loggedIn && data.name) {
                    setName(data.name);
                }
            })
            .catch(() => {});
    }, []);

    async function logout(){

        await fetch("/api/logout",{
            method:"POST"
        });

        void nav("/");
    }

    return (
        <nav className="bg-white border-b border-slate-100 px-6 py-4 shadow-sm">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                
                {/* Brand Logo / Left side */}
   <div className="flex items-center space-x-2">
<div className="rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black px-4 py-2.5 mx-2">
    RAL Portal
</div>
    {name && (
        <span className="text-slate-700 px-2 font-semibold">
            {name}
        </span>
    )}
</div>

                {/* Navigation Links / Right side */}
                <div className="flex items-center space-x-2 text-sm font-medium">
                    <Link 
                        to="/home" 
                        className="px-3 py-2 text-slate-600 hover:text-slate-950 hover:bg-slate-50 rounded-xl transition-all"
                    >
                        Home
                    </Link>

                    <Link 
                        to="/change-password" 
                        className="px-3 py-2 text-slate-600 hover:text-slate-950 hover:bg-slate-50 rounded-xl transition-all"
                    >
                        Change Password
                    </Link>



                    <button 
                        onClick={logout}
                        className="ml-2 px-3 py-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all transform active:scale-[0.98]"
                    >
                        Logout
                    </button>
                </div>

            </div>
        </nav>
    );
}

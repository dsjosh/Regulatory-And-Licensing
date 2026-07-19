import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function ChangePassword(){

    const[oldPassword,setOldPassword]=useState("");
    const[newPassword,setNewPassword]=useState("");
    const nav = useNavigate();

    useEffect(() => {

        async function checkSession(){

            const res = await fetch("/api/session");
            const data = await res.json();

            if(!data.loggedIn){
                void nav("/");
            }

        }

        void checkSession();

    }, [nav]);

    async function save(){

        const res=await fetch("/api/change-password",{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                oldPassword,
                newPassword
            })
        });

        const data=await res.json();

        if(data.success){
            alert("Password changed");
        }else{
            alert("Failed");
        }

    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Navbar />

            <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto w-full max-w-md">
                    <h1 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                        Change Password
                    </h1>
                    <p className="mt-2 text-center text-sm text-slate-500">
                        Ensure your account remains secure by updating your credentials.
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto w-full max-w-md px-4">
                    <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100 sm:px-10 space-y-5">
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Old Password
                            </label>
                            <input
                                type="password"
                                placeholder="Old Password"
                                value={oldPassword}
                                onChange={e => setOldPassword(e.target.value)}
                                className="block w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all bg-slate-50/50 focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="block w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all bg-slate-50/50 focus:bg-white"
                            />
                        </div>

                        <div className="pt-2">
                            <button 
                                onClick={save}
                                className="w-full flex justify-center py-3 px-4 rounded-xl border border-transparent shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform active:scale-[0.98] transition-all"
                            >
                                Save
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

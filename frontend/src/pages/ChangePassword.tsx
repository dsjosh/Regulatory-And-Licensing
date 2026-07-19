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

    return(
        <>
            <Navbar/>

            <h1>Change Password</h1>

            <input
                type="password"
                placeholder="Old Password"
                value={oldPassword}
                onChange={e=>setOldPassword(e.target.value)}
            />

            <br/>

            <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={e=>setNewPassword(e.target.value)}
            />

            <br/>

            <button onClick={save}>
                Save
            </button>
        </>
    );
}

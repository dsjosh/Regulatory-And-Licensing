import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {

    const nav = useNavigate();

    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function login(){

    if (!email.trim() || !password.trim()) {
        alert("Email and password are required");
        return;
    }

    if (!isValidEmail(email)) {
        alert("Please enter a valid email address");
        return;
    }

    const res = await fetch("/api/login",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            email: email.trim(),
            password
        })
    });

    const data = await res.json();

    if(data.success){
        void nav("/home");
    }else{
        alert("Invalid login");
    }
}

    return(
        <>
            <h1>Login</h1>

            <input
                placeholder="Email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
            />

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e=>setPassword(e.target.value)}
            />

            <button onClick={login}>
                Login
            </button>

            <br/>

            <Link to="/register">
                Register
            </Link>
        </>
    );
}

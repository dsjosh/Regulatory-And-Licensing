import { Link, useNavigate } from "react-router-dom";

export default function Navbar(){

    const nav=useNavigate();

    async function logout(){

        await fetch("/api/logout",{
            method:"POST"
        });

        void nav("/");
    }

    return(
        <>
            <Link to="/home">Home</Link>

            {" | "}

            <Link to="/change-password">
                Change Password
            </Link>

            {" | "}

            <button onClick={logout}>
                Logout
            </button>

            <hr/>
        </>
    );
}

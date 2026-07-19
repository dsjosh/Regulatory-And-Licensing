import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Home(){

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

    return(
        <>
            <Navbar/>
            <h1>Homepage</h1>
        </>
    );
}

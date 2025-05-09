// components/ProtectedRoute.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ProtectedRoute = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate("/login");
            } else {
                setAuthenticated(true);
            }
            setLoading(false);
        };

        checkUser();
    }, [navigate]);

    if (loading) return <div>Loading...</div>;
    return authenticated ? children : null;
};

export default ProtectedRoute;
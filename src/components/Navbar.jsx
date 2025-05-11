import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiChevronDown, FiHome } from "react-icons/fi";
import { supabase } from "../supabaseClient";
import "./Navbar.css";

const Navbar = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    useEffect(() => {
        // Get user on load
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

        // Listen for auth changes
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    return (
        <nav className="navbar">
            {/* Home Button and Email */}
            <div className="nav-home" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Link to="/" className="home-button">
                    <FiHome size={24} />
                </Link>
                {user && <span className="user-email">{user.email}</span>}
            </div>

            {/* Navigation Buttons (Centered) */}
            <div className="nav-left">
                <Link to="/create-election" className="nav-link">Create an Election</Link>
                <Link to="/view-elections" className="nav-link">View elections</Link>
                <Link to="/my-elections" className="nav-link">My Elections</Link>
            </div>

            {/* User Dropdown (Right) */}
            <div className="nav-right">
                <div className="user-dropdown">
                    <button onClick={toggleDropdown} className="user-button">
                        <FiUser size={22} />
                        <FiChevronDown size={18} />
                    </button>
                    {isDropdownOpen && (
                        <div className="dropdown-menu">
                            {user ? (
                                <>
                                    {/* <Link to="/profile" className="dropdown-item">Profile</Link> */}
                                    {/* <Link to="/settings" className="dropdown-item">Settings</Link> */}
                                    {/* <hr /> */}
                                    <button className="dropdown-item" onClick={handleLogout}>Log Out</button>
                                </>
                            ) : (
                                <Link to="/login" className="dropdown-item">Login</Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

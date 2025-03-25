import { useState } from "react";
import { Link } from "react-router-dom";
import { FiUser, FiChevronDown, FiHome } from "react-icons/fi"; // Import home icon
import "./Navbar.css"; // Import CSS file

const Navbar = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    return (
        <nav className="navbar">
            {/* Home Button at the Left */}
            <div className="nav-home">
                <Link to="/" className="home-button">
                    <FiHome size={24} />
                </Link>
            </div>

            {/* Navigation Buttons (Centered) */}
            <div className="nav-left">
                <Link to="/create-election" className="nav-link">Create an Election</Link>
                <Link to="/join-election" className="nav-link">Join an Election</Link>
                <Link to="/view-results" className="nav-link">View Results</Link>
                <Link to="/table-test" className="nav-link">View election table test</Link>
            </div>

            {/* User Dropdown on the Right */}
            <div className="nav-right">
                <div className="user-dropdown">
                    <button onClick={toggleDropdown} className="user-button">
                        <FiUser size={22} />
                        <FiChevronDown size={18} />
                    </button>
                    {isDropdownOpen && (
                        <div className="dropdown-menu">
                            <Link to="/profile" className="dropdown-item">Profile</Link>
                            <Link to="/settings" className="dropdown-item">Settings</Link>
                            <hr />
                            <button className="dropdown-item">Log Out</button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

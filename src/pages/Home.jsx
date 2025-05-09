import React from "react";
import { Link } from "react-router-dom";
import "./Home.css"; // Import CSS file
import ProtectedRoute from "../components/ProtectedRoute";

const Home = () => {
    return (
        <div className="home-container">
            <h1 className="home-title">Welcome to Suffragium</h1>
            <p className="home-description">
                A secure and transparent online voting platform. Join or create an election today!
            </p>

            {/* Buttons to navigate to Create and Join Election pages */}
            <div className="home-buttons">
                <ProtectedRoute><Link to="/create-election" className="home-button">Create Election</Link></ProtectedRoute>
                <ProtectedRoute><Link to="/view-elections" className="home-button join">View Elections</Link></ProtectedRoute>
            </div>
        </div>
    );
};

export default Home;

import React from "react";
import "./Home.css"; // Import CSS

const Home = () => {
    return (
        <div className="home-container">
            <h1 className="home-title">Welcome to Suffragium</h1>
            <p className="home-description">
                A secure and transparent online voting platform. Join or create an election today!
            </p>
        </div>
    );
};

export default Home;

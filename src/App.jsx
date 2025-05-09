import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home"; 
import CreateElection from "./pages/CreateElection";
//import TableTest from "./pages/TableTest";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import ViewElections from "./pages/ViewElections";
import JoinElection from "./pages/JoinElection";
import ManageElection from "./pages/ManageElection";
import MyElections from "./pages/MyElections";
import ProtectedRoute from "./components/ProtectedRoute";

//const API_URL = "http://localhost:5000";

function App() {
    const [votes, setVotes] = useState({ candidateA: 0, candidateB: 0 });

    // useEffect(() => {
    //     fetch(`${API_URL}/votes`)
    //         .then(response => response.json())
    //         .then(data => setVotes(data))
    //         .catch(error => console.error("Error fetching votes:", error));
    // }, []);

    // const voteForA = () => {
    //     fetch(`${API_URL}/vote-a`, { method: "POST" })
    //         .then(response => response.json())
    //         .then(data => setVotes(data.votes))
    //         .catch(error => console.error("Error voting:", error));
    // };

    // const voteForB = () => {
    //     fetch(`${API_URL}/vote-b`, { method: "POST" })
    //         .then(response => response.json())
    //         .then(data => setVotes(data.votes))
    //         .catch(error => console.error("Error voting:", error));
    // };

    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<ProtectedRoute> <Home /> </ProtectedRoute>} />
                <Route path="/create-election" element={<ProtectedRoute> <CreateElection /> </ProtectedRoute>} />
                <Route path="/view-elections" element={<ProtectedRoute> <ViewElections /> </ProtectedRoute>} />
                <Route path="/join-election" element={<ProtectedRoute> <JoinElection /> </ProtectedRoute>} />
                <Route path="/manage-election" element={<ProtectedRoute> <ManageElection /> </ProtectedRoute>} />
                <Route path="/my-elections" element={<ProtectedRoute> <MyElections /> </ProtectedRoute>} />
                <Route path="/login" element={<Login />} /> 
                {/* Public */}
            </Routes>
        </Router>
    );
}

export default App;

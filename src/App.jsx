import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home"; 
import CreateElection from "./pages/CreateElection";
import TableTest from "./pages/TableTest";
import { useState, useEffect } from "react";

const API_URL = "http://localhost:5000";

function App() {
    const [votes, setVotes] = useState({ candidateA: 0, candidateB: 0 });

    useEffect(() => {
        fetch(`${API_URL}/votes`)
            .then(response => response.json())
            .then(data => setVotes(data))
            .catch(error => console.error("Error fetching votes:", error));
    }, []);

    const voteForA = () => {
        fetch(`${API_URL}/vote-a`, { method: "POST" })
            .then(response => response.json())
            .then(data => setVotes(data.votes))
            .catch(error => console.error("Error voting:", error));
    };

    const voteForB = () => {
        fetch(`${API_URL}/vote-b`, { method: "POST" })
            .then(response => response.json())
            .then(data => setVotes(data.votes))
            .catch(error => console.error("Error voting:", error));
    };

    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create-election" element={<CreateElection />} />
                <Route path="/table-test" element={<TableTest />} />
                

                {/* Other Routes */}
            </Routes>
        </Router>
    );
}

export default App;

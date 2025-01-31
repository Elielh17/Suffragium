import { useState, useEffect } from "react";

const API_URL = "http://localhost:5000"; // Backend URL

function App() {
    const [votes, setVotes] = useState({ candidateA: 0, candidateB: 0 });

    // Fetch votes from the backend
    useEffect(() => {
        fetch(`${API_URL}/votes`)
            .then(response => response.json())
            .then(data => setVotes(data))
            .catch(error => console.error("Error fetching votes:", error));
    }, []);

    // Function to vote for Candidate A
    const voteForA = () => {
        fetch(`${API_URL}/vote-a`, { method: "POST" })
            .then(response => response.json())
            .then(data => setVotes(data.votes))
            .catch(error => console.error("Error voting:", error));
    };

    // Function to vote for Candidate B
    const voteForB = () => {
        fetch(`${API_URL}/vote-b`, { method: "POST" })
            .then(response => response.json())
            .then(data => setVotes(data.votes))
            .catch(error => console.error("Error voting:", error));
    };

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h1>Voting System</h1>
            <h2>Votes</h2>
            <p>Jennifer Gonzalez: {votes.candidateA}</p>
            <p>Juan Dalmau: {votes.candidateB}</p>
            <button onClick={voteForA} style={{ marginRight: "10px", padding: "10px 20px", fontSize: "16px" }}>Vote for Jennifer Gonzalez</button>
            <button onClick={voteForB} style={{ padding: "10px 20px", fontSize: "16px" }}>Vote for Juan Dalmau</button>
        </div>
    );
}

export default App;

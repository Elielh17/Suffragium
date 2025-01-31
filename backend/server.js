const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json()); // Allows JSON parsing

// In-memory vote storage (resets when the server restarts)
let votes = {
    candidateA: 0,
    candidateB: 0
};

// Route to get the current vote count
app.get("/votes", (req, res) => {
    res.json(votes);
});

// Route to add a vote to Candidate A
app.post("/vote-a", (req, res) => {
    votes.candidateA += 1;
    res.json({ message: "Vote added to Candidate A", votes });
});

// Route to add a vote to Candidate B
app.post("/vote-b", (req, res) => {
    votes.candidateB += 1;
    res.json({ message: "Vote added to Candidate B", votes });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

import { useState } from "react";
import "./CreateElection.css"; // Import CSS for styling

const CreateElection = () => {
    const [electionName, setElectionName] = useState("");
    const [electionDescription, setElectionDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [candidates, setCandidates] = useState([]);
    const [newCandidate, setNewCandidate] = useState("");

    // Function to add a candidate
    const addCandidate = () => {
        if (newCandidate.trim() !== "") {
            setCandidates([...candidates, newCandidate]);
            setNewCandidate(""); // Clear input field
        }
    };

    // Function to remove a candidate
    const removeCandidate = (index) => {
        setCandidates(candidates.filter((_, i) => i !== index));
    };

    // Function to submit the election
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const electionData = {
            name: electionName,
            description: electionDescription,
            start_date: startDate,
            end_date: endDate,
            candidates: candidates,
        };
    
        try {
            const response = await fetch("http://localhost:5000/api/elections", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(electionData),
            });
    
            if (response.ok) {
                alert("Election Created Successfully!");
            } else {
                alert("Failed to create election");
            }
        } catch (error) {
            console.error("Error submitting election:", error);
            alert("An error occurred while creating the election");
        }
    };

    return (
        <div className="create-election-container">
            <h2>Create New Election</h2>
            <form onSubmit={handleSubmit}>
                {/* Election Name */}
                <label>Election Name:</label>
                <input
                    type="text"
                    value={electionName}
                    onChange={(e) => setElectionName(e.target.value)}
                    required
                />

                {/* Election Description */}
                <label>Election Description:</label>
                <textarea
                    value={electionDescription}
                    onChange={(e) => setElectionDescription(e.target.value)}
                    rows="4"
                    placeholder="Enter a brief description of the election..."
                    required
                ></textarea>

                {/* Start Date */}
                <label>Start Date:</label>
                <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                />

                {/* End Date */}
                <label>End Date:</label>
                <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                />

                {/* Candidate List */}
                <label>Candidates:</label>
                <div className="candidate-list">
                    {candidates.map((candidate, index) => (
                        <div key={index} className="candidate-item">
                            {candidate}
                            <button type="button" onClick={() => removeCandidate(index)}>❌</button>
                        </div>
                    ))}
                </div>

                {/* Add Candidate Input */}
                <div className="add-candidate">
                    <input
                        type="text"
                        value={newCandidate}
                        onChange={(e) => setNewCandidate(e.target.value)}
                        placeholder="Enter candidate name"
                    />
                    <button type="button" onClick={addCandidate}>Add Candidate</button>
                </div>

                {/* Submit Button */}
                <button type="submit" className="submit-btn">Create Election</button>
            </form>
        </div>
    );
};

export default CreateElection;

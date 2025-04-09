import { useState } from "react";
import "./CreateElection.css";
import { supabase } from "../supabaseClient";
import { useEffect } from "react";


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

    useEffect(() => {
        const checkSession = async () => {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();
      
          if (error) {
            console.error("Error retrieving session:", error);
          }
      
          if (session) {
            console.log("✅ Session is valid!");
            console.log("User ID:", session.user.id);
            console.log("Email:", session.user.email);
          } else {
            console.warn("❌ No active session. User is not logged in.");
          }
        };
      
        checkSession();
      }, []);

    // Function to submit the election
    const handleSubmit = async (e) => {
        e.preventDefault();
    
        // Format datetime-local to just "YYYY-MM-DD"
        const formattedStartDate = startDate.split("T")[0];
        const formattedEndDate = endDate.split("T")[0];
    
        const electionData = {
            electionname: electionName,
            description: electionDescription,
            startdate: formattedStartDate,
            enddate: formattedEndDate,
            statuscode: 1,
            typecode: 1,
            permittedrolecodes: [],
        };
    
        const { data, error } = await supabase
            .from("election")
            .insert([electionData])
            .select();
    
        console.log("Insert result:", data, error);
    
        if (error) {
            console.error("Election creation failed:", error);
            alert("Failed to create the election.");
            return;
        }
    
        const electionId = data[0].electionid;
    
        // Insert candidates
        const candidateInserts = candidates.map((name) => ({
            electionid: electionId,
            name: name,
            description: "",
        }));
    
        const { error: candidateError } = await supabase
            .from("candidates")
            .insert(candidateInserts);
    
        if (candidateError) {
            console.error("Candidate insertion failed:", candidateError);
            alert("Election was created but candidates couldn't be added.");
            return;
        }
    
        alert("Election and candidates created successfully!");
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
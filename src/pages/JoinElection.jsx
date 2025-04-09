import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "./JoinElection.css";

const JoinElection = () => {
  const [elections, setElections] = useState([]);
  const [expandedElectionId, setExpandedElectionId] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    };

    const fetchElections = async () => {
      const { data, error } = await supabase
        .from("election")
        .select("*, candidates(*)");

      if (error) console.error("Error fetching elections:", error);
      else setElections(data);
    };

    fetchSession();
    fetchElections();
  }, []);

  const handleJoinElection = async (electionId) => {
    if (!session) return alert("You must be logged in to join an election.");

    const { error } = await supabase.from("userreference").insert([
      {
        userid: session.user.id,
        electionid: electionId,
      },
    ]);

    if (error) console.error("Error joining election:", error);
    else alert("Successfully joined the election!");
  };

  const toggleExpand = (id) => {
    setExpandedElectionId(expandedElectionId === id ? null : id);
  };

  return (
    <div className="join-election-container">
      <h2>Join an Election</h2>
      {elections.map((election) => (
        <div key={election.electionid} className="election-card">
          <h3>{election.electionname}</h3>
          <p>
            {election.startdate} to {election.enddate}
          </p>
          <button onClick={() => handleJoinElection(election.electionid)}>Join</button>
          <button onClick={() => toggleExpand(election.electionid)}>
            {expandedElectionId === election.electionid ? "Hide" : "View"}
          </button>

          {expandedElectionId === election.electionid && (
            <div className="election-details">
              <p>{election.description}</p>
              <h4>Candidates:</h4>
              <ul>
                {election.candidates.map((c) => (
                  <li key={c.id}>
                    <strong>{c.name}</strong>
                    {c.description && <p>{c.description}</p>}
                  </li>
                ))}
              </ul>
              {/* Voting logic placeholder (to be implemented next) */}
              <p className="note">Voting section coming soon...</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default JoinElection;

// src/pages/MyElections.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./ViewElections.css";

const MyElections = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserElections = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return navigate("/login");

      const { data, error } = await supabase
        .from("election")
        .select("*")
        .eq("userid", session.user.id);

      if (error) {
        console.error("Failed to load elections:", error);
        return;
      }

      setElections(data);
      setLoading(false);
    };

    fetchUserElections();
  }, [navigate]);

  if (loading) return <p>Loading your elections...</p>;

  return (
    <div className="election-list-container">
      <h2>My Elections</h2>
      {elections.length === 0 ? (
        <p>You haven't created any elections yet.</p>
      ) : (
        elections.map((election) => (
          <div key={election.electionid} className="election-card">
            <h3>{election.electionname}</h3>
            <p>{election.description}</p>
            <p>
              Dates: {election.startdate} to {election.enddate}
            </p>
            <button
              className="view-btn"
              onClick={() =>
                navigate(`/manage-election?id=${election.electionid}`)
              }
            >
              Manage Election
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default MyElections;

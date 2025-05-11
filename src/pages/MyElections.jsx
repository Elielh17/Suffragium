// src/pages/MyElections.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./ViewElections.css";

const MyElections = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [sortBy, setSortBy] = useState("date");
  const [activeTab, setActiveTab] = useState("available");
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

  const filteredAndSortedElections = elections
    .filter((e) => {
      const matchSearch = e.electionname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.description.toLowerCase().includes(searchTerm.toLowerCase());
      const now = new Date();
      const isAvailable = new Date(e.enddate) > now;
      return matchSearch && (activeTab === "available" ? isAvailable : !isAvailable);
    })
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.startdate) - new Date(a.startdate);
      if (sortBy === "name") return a.electionname.localeCompare(b.electionname);
      return 0;
    });

  return (
    <div className="election-list-container">
      <div className="dashboard-tabs">
          <button
            className={activeTab === "available" ? "active" : ""}
            onClick={() => setActiveTab("available")}
          >
            🟢 Available
          </button>
          <button
            className={activeTab === "ended" ? "active" : ""}
            onClick={() => setActiveTab("ended")}
          >
            🔚 Ended
          </button>
        </div>
        <div className="dashboard-tabs">
          <div className="search-sort-controls">
            <input
              type="text"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date">Sort by Date</option>
              <option value="votes">Sort by Total Votes</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>

      <h2>My Elections</h2>

      {filteredAndSortedElections.length === 0 ? (
        <p>No elections found for this view.</p>
      ) : (
        filteredAndSortedElections.map((election) => (
          <div key={election.electionid} className="election-card">
            <h3>{election.electionname}</h3>
            <p>{election.description}</p>
            <p>
              Dates: {new Date(election.startdate).toLocaleString()} to {new Date(election.enddate).toLocaleString()}
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

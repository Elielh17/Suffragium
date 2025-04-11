import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./ViewElections.css";

const ViewElection = () => {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [votedElections, setVotedElections] = useState([]);
  const [joinedElections, setJoinedElections] = useState([]);
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setUserId(session.user.id);
        await fetchUserVotes(session.user.id);
        await fetchUserJoins(session.user.id);
      }

      const params = new URLSearchParams(location.search);
      const accessToken = params.get("token");

      let query = supabase
        .from("election")
        .select(`*, candidates(*, votes(*))`);

        if (accessToken) {
          query = query.eq("access_token", accessToken).eq("visibility", false);
        } else {
          query = query.eq("visibility", true);
        }        

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching elections:", error);
      } else {
        const processedElections = data.map((election) => {
          const candidates = election.candidates.map((candidate) => {
            const voteCount = candidate.votes ? candidate.votes.length : 0;
            return {
              ...candidate,
              voteCount,
            };
          });

          const sortedCandidates = [...candidates].sort((a, b) => b.voteCount - a.voteCount);

          return {
            ...election,
            candidates: sortedCandidates,
            winner: sortedCandidates[0] || null,
          };
        });

        setElections(processedElections);
      }

      setLoading(false);
    };

    const fetchUserVotes = async (userId) => {
      const { data, error } = await supabase
        .from("votes")
        .select("electionid")
        .eq("userid", userId)
        .not("candidateid", "is", null);

      if (!error) {
        setVotedElections(data.map((v) => v.electionid));
      }
    };

    const fetchUserJoins = async (userId) => {
      const { data, error } = await supabase
        .from("votes")
        .select("electionid")
        .eq("userid", userId);

      if (!error) {
        setJoinedElections(data.map((v) => v.electionid));
      }
    };

    fetchData();
  }, [location.search]);

  const handleJoin = async (electionId) => {
    if (!userId) return;

    const { data: existingVote } = await supabase
      .from("votes")
      .select("*")
      .eq("userid", userId)
      .eq("electionid", electionId)
      .maybeSingle();

    if (existingVote) {
      alert("You've already joined this election.");
      return;
    }

    const { error } = await supabase.from("votes").insert([
      {
        userid: userId,
        electionid: electionId,
        candidateid: null,
      },
    ]);

    if (!error) {
      setJoinedElections([...joinedElections, electionId]);
      alert("You have joined the election!");
    }
  };

  const handleVote = async (candidateId, electionId) => {
    if (!userId) return;

    const { error } = await supabase
      .from("votes")
      .update({ candidateid: candidateId })
      .match({ userid: userId, electionid: electionId });

    if (!error) {
      setVotedElections([...votedElections, electionId]);
      alert("Vote cast successfully!");
    }
  };

  if (loading) return <p>Loading elections...</p>;

  if (selectedElection) {
    const hasJoined = joinedElections.includes(selectedElection.electionid);
    const hasVoted = votedElections.includes(selectedElection.electionid);

    return (
      <div className="election-detail-container">
        <button className="back-btn" onClick={() => setSelectedElection(null)}>
          ← Back to Elections
        </button>
        <div className="election-card expanded">
          <h2>{selectedElection.electionname}</h2>
          <p className="election-dates">
            <strong>Duration:</strong> {selectedElection.startdate} to {selectedElection.enddate}
          </p>
          <p className="election-description">
            <strong>Description:</strong> {selectedElection.description}
          </p>

          <div className="candidate-section">
            <h3>Candidates</h3>
            <div className="candidate-grid">
              {selectedElection.candidates.map((c) => (
                <div key={c.id} className="candidate-card">
                  {c.image && (
                    <img src={c.image} alt={c.name} className="candidate-image" />
                  )}
                  <p><strong>{c.name}</strong></p>
                  <p>{c.description || "No description available."}</p>
                  <p className="votes">Votes: {c.voteCount}</p>

                  {hasJoined && !hasVoted && (
                    <button className="vote-btn" onClick={() => handleVote(c.id, selectedElection.electionid)}>
                      Vote
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {!hasJoined && (
            <button className="view-btn" onClick={() => handleJoin(selectedElection.electionid)}>
              Join Election
            </button>
          )}

          {selectedElection.winner && (
            <div className="winner-box">
              🏆 <strong>Currently Leading:</strong> {selectedElection.winner.name} with {selectedElection.winner.voteCount} vote(s)
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="election-list-container">
      <h2>Available Elections</h2>
      {elections.map((election) => (
        <div key={election.electionid} className="election-card">
          <h3>{election.electionname}</h3>
          <p>{election.description}</p>
          <p>
            Dates: {election.startdate} to {election.enddate}
          </p>

          <div className="candidate-box">
            <h4>Candidates</h4>
            <ul>
              {election.candidates.map((c) => (
                <li key={c.id}>
                  {c.name} - {c.voteCount} vote(s)
                </li>
              ))}
            </ul>
          </div>

          {election.winner && (
            <div className="winner-box">
              <strong>Leading:</strong> {election.winner.name} with {election.winner.voteCount} vote(s)
            </div>
          )}

          <button className="view-btn" onClick={() => setSelectedElection(election)}>
            View Details
          </button>
        </div>
      ))}
    </div>
  );
};

export default ViewElection;

import { useEffect, useState } from "react";
import { FaGavel, FaRandom, FaRedo, FaBalanceScale, FaExclamationTriangle, FaTrophy } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./ViewElections.css";
import VoteLog from "./VoteLog.jsx";

const ViewElection = () => {
  const [activeTab, setActiveTab] = useState("available");
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [votedElections, setVotedElections] = useState([]);
  const [joinedElections, setJoinedElections] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const resolveRandomTie = async () => {
      if (
        selectedElection &&
        selectedElection.tie_break_type_id === 102 &&
        new Date(selectedElection.enddate) < new Date() &&
        selectedElection.isTie &&
        !selectedElection.candidates.some(c => c.is_manual_winner)
      ) {
        const randomWinner = selectedElection.tiedCandidates[
          Math.floor(Math.random() * selectedElection.tiedCandidates.length)
        ];

        const { error } = await supabase
          .from("candidates")
          .update({ is_manual_winner: true })
          .eq("id", randomWinner.id);

        if (!error) {
          window.location.reload();
        }
      }
    };
    resolveRandomTie();
  }, [selectedElection]);

  useEffect(() => {
    const resolveRoleBasedTie = async () => {
      if (
        selectedElection &&
        selectedElection.tie_break_type_id === 104 &&
        new Date(selectedElection.enddate) < new Date() &&
        selectedElection.isTie &&
        !selectedElection.candidates.some(c => c.is_manual_winner)
      ) {
        const priorityRole = selectedElection.tiebreak_role;
        const tiedCandidateIds = selectedElection.tiedCandidates.map(c => c.id);
  
        const { data: votes } = await supabase
          .from("votes")
          .select("candidateid, email, weight")
          .eq("electionid", selectedElection.electionid)
          .in("candidateid", tiedCandidateIds);
  
        const { data: roleAssignments } = await supabase
          .from("user_role")
          .select("email, role")
          .eq("electionid", selectedElection.electionid);
  
        const prioritizedVotes = votes?.filter(v => {
          const role = roleAssignments?.find(r => r.email === v.email);
          return role?.role === priorityRole;
        }) || [];
  
        const voteCountMap = {};
        for (const vote of prioritizedVotes) {
          if (!vote.candidateid) continue;
          voteCountMap[vote.candidateid] = (voteCountMap[vote.candidateid] || 0) + (vote.weight || 1);
        }
  
        let highestVotes = -1;
        let selectedCandidateId = null;
        for (const [candidateId, count] of Object.entries(voteCountMap)) {
          if (count > highestVotes) {
            highestVotes = count;
            selectedCandidateId = candidateId;
          }
        }
  
        if (selectedCandidateId) {
          const { error } = await supabase
            .from("candidates")
            .update({ is_manual_winner: true })
            .eq("id", selectedCandidateId);
  
          if (!error) {
            window.location.reload();
          }
        }
      }
    };
    resolveRoleBasedTie();
  }, [selectedElection]);
  

  const renderTieMessage = () => {
    if (!selectedElection) return null;

    const reevaluatedHasEnded = new Date(selectedElection.enddate) < new Date();
    const manualWinner = selectedElection.candidates.find(c => c.is_manual_winner);

    if (manualWinner) {
      let method = "Creator Decision";
      let explanation = "This tie has been resolved manually by the election creator.";

      if (selectedElection.tie_break_type_id === 102) {
        method = "Random";
        explanation = "This tie was resolved automatically using a random method.";
      } else if (selectedElection.tie_break_type_id === 104) {
        method = "Role-Based";
        explanation = `This tie was resolved using role-based logic, giving priority to the role: ${selectedElection.tiebreak_role}`;
      }

      return (
        <div className="winner-box">
          <FaTrophy style={{ marginRight: 6 }} />
          <strong>Final Winner ({method}):</strong> {manualWinner.name}<br />
          <em>{explanation}</em>
        </div>
      );
    }

    if (!selectedElection?.isTie || !reevaluatedHasEnded) {
      return (
        selectedElection.winner && (
          <div className="winner-box">
            <FaTrophy style={{ marginRight: 6 }} />
            <strong>Currently Leading:</strong> {selectedElection.winner.name} with {selectedElection.winner.voteCount} vote(s)
          </div>
        )
      );
    }

    switch (selectedElection.tie_break_type_id) {
      case 103:
        return (
          <div className="winner-box">
            <FaBalanceScale style={{ marginRight: 6 }} /> <strong>Tie Detected:</strong> Awaiting decision from creator for: {selectedElection.tiedCandidates.map(c => c.name).join(", ")}
          </div>
        );
      case 104:
        return (
          <div className="winner-box">
            <FaGavel style={{ marginRight: 6 }} /> <strong>Tie Detected:</strong> Voting required by specific role to decide: {selectedElection.tiedCandidates.map(c => c.name).join(", ")}
          </div>
        );
      case 105:
        return (
          <div className="winner-box">
            <FaRedo style={{ marginRight: 6 }} /> <strong>Tie Detected:</strong> A revote is required between: {selectedElection.tiedCandidates.map(c => c.name).join(", ")}
          </div>
        );
      default:
        return (
          <div className="winner-box">
            <FaExclamationTriangle style={{ marginRight: 6 }} /> <strong>Tie Detected:</strong> No tie-breaking method specified.
          </div>
        );
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email);
        await fetchUserVotes(session.user.id);
        await fetchUserJoins(session.user.id);
      }

      const params = new URLSearchParams(location.search);
      const accessToken = params.get("token");
      const electionIdParam = params.get("id");

      let query = supabase
        .from("filteredelectionbydate")
        .select(`*, candidates(*, votes(*))`);

      if (accessToken) {
        query = query.eq("access_token", accessToken).eq("visibility", false);
      } else if (electionIdParam) {
        query = query.eq("electionid", electionIdParam);
      } else {
        query = query.eq("visibility", true);
      }

      const { data: electionsData, error } = await query;
      if (error) return console.error("Error fetching elections:", error);

      const electionIds = electionsData.map((e) => e.electionid);
      const validElectionIds = electionIds.filter(id => typeof id === "string" || typeof id === "number");

      const { data: roleAssignments, error: roleError } = await supabase
        .from("user_role")
        .select("email, weight, electionid")
        .in("electionid", validElectionIds);

      if (roleError || !roleAssignments) {
        console.error("Failed to fetch user roles:", roleError);
        return;
      }

      const emailWeightMap = {};
      for (const r of roleAssignments) {
        emailWeightMap[`${r.electionid}|${r.email}`] = r.weight;
      }

      const processedElections = electionsData.map((filteredelectionbydate) => {
        const candidates = filteredelectionbydate.candidates.map((candidate) => {
          const voteCount = candidate.votes?.reduce((sum, vote) => {
            let weight = 1;
            if (filteredelectionbydate.typecode === 2 && vote.email) {
              const key = `${filteredelectionbydate.electionid}|${vote.email}`;
              weight = emailWeightMap[key] || 1;
            }
            return sum + weight;
          }, 0);

          return {
            ...candidate,
            voteCount,
          };
        });

        const sortedCandidates = [...candidates].sort((a, b) => b.voteCount - a.voteCount);

        const topVotes = sortedCandidates[0]?.voteCount || 0;
        const tiedCandidates = sortedCandidates.filter(c => c.voteCount === topVotes);
        const isTie = tiedCandidates.length > 1;

        return {
          ...filteredelectionbydate,
          candidates: sortedCandidates,
          winner: sortedCandidates[0] || null,
          isTie,
          tiedCandidates: isTie ? tiedCandidates : []
        };
      });

      setElections(processedElections);
      if (processedElections.length === 1 && (accessToken || electionIdParam)) {
        setSelectedElection(processedElections[0]);
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

    const handleVote = async (candidateId, electionId) => {
    if (!userId) return;

    const { data: electionData, error: electionError } = await supabase
      .from("election")
      .select("typecode")
      .eq("electionid", electionId)
      .single();

    if (electionError || !electionData) {
      alert("Failed to fetch election type.");
      return;
    }

    let weight = 1;

    if (electionData.typecode === 2 && userEmail) {
      const { data: role } = await supabase
        .from("user_role")
        .select("weight")
        .eq("email", userEmail)
        .eq("electionid", electionId)
        .maybeSingle();

      weight = role?.weight || 1;
    }

    const { error } = await supabase
      .from("votes")
      .update({ candidateid: candidateId, weight, email: userEmail })
      .match({ userid: userId, electionid: electionId });

    if (!error) {
      setVotedElections([...votedElections, electionId]);
      alert(`Vote cast successfully with weight ${weight}!`);

      // Fetch candidate name
      const { data: candidateData } = await supabase
        .from("candidates")
        .select("name")
        .eq("id", candidateId)
        .maybeSingle();

      // Fetch election name
      const { data: electionMeta } = await supabase
        .from("election")
        .select("electionname")
        .eq("electionid", electionId)
        .maybeSingle();

      // Send receipt email
      const response = await fetch("https://cxlrsjulixkuhbgtxwho.supabase.co/functions/v1/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: userEmail,
          candidateName: candidateData?.name,
          electionName: electionMeta?.electionname
        })
      });

      if (response.ok) {
        alert("✅ Vote receipt email sent!");
      } else {
        const errorText = await response.text();
        console.warn("Email failed to send:", errorText);
        alert("⚠️ Vote receipt email failed to send.");
      }

      
    } 
    else {
        alert("Failed to cast vote.");
      }

  };

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

  if (loading) return <p>Loading elections...</p>;

  if (selectedElection) {
    const hasJoined = joinedElections.includes(selectedElection.electionid);
    const hasVoted = votedElections.includes(selectedElection.electionid);

    return (
      <div className="election-detail-container">
        <button className="back-btn" onClick={() => {
  setSelectedElection(null);
  const params = new URLSearchParams(location.search);
  if (params.has("id") || params.has("token")) {
    navigate("/view-elections", { replace: true });
  }
}}>
  ← Back to Elections
</button>
        <div className="election-card expanded">
          <h2>{selectedElection.electionname}</h2>
          <p className="election-dates">
            <strong>Duration:</strong> {new Date(selectedElection.startdate).toLocaleString()} to {new Date(selectedElection.enddate).toLocaleString()}
          </p>
          <p className="election-description">
            <strong>Tie-Breaking Method:</strong>{" "}
            {selectedElection.tie_break_type_id === 101 ? "None" :
            selectedElection.tie_break_type_id === 102 ? "Random" :
            selectedElection.tie_break_type_id === 103 ? "Creator" :
            selectedElection.tie_break_type_id === 104 ? "Role-Based" :
            selectedElection.tie_break_type_id === 105 ? "Revote" :
            "Unknown"}
          </p>
          <p className="election-description">
            <strong>Type:</strong> {selectedElection.typecode === 2 ? "Weighted" : "Normal"}
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

          {!hasJoined && new Date(selectedElection.enddate) > new Date() && (
            <button className="view-btn" onClick={() => handleJoin(selectedElection.electionid)}>
              Join Election
            </button>
          )}


          {renderTieMessage()}

          <button className="view-btn" onClick={() => setShowLog(!showLog)}>
            {showLog ? "Hide Voting Log" : "View Voting Log"}
          </button>

          {showLog && (
            <div className="voting-log-container">
              <VoteLog electionId={selectedElection.electionid} />
            </div>
          )}
        </div>
      </div>
    );
  }

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

      {activeTab === "available" && (
        <>
          <h2>Available Elections</h2>
          {elections.filter(e => e.has_started && e.not_ended).map((e) => (
            <div key={e.electionid} className="election-card">
              <h3>{e.electionname}</h3>
              <p>Description: {e.description}</p>
              <p>
                Duration: {new Date(e.startdate).toLocaleString()} to {new Date(e.enddate).toLocaleString()}
              </p>
              <div className="candidate-box">
                <h4>Candidates</h4>
                <ul>
                  {e.candidates.map((c) => (
                    <li key={c.id}>
                      {c.name} - {c.voteCount} vote(s)
                    </li>
                  ))}
                </ul>
              </div>
              {e.winner && (
                <div className="winner-box">
                  <strong>Leading:</strong> {e.winner.name} with {e.winner.voteCount} vote(s)
                </div>
              )}
              <button
                className="view-btn"
                onClick={() => navigate(`/view-elections?id=${e.electionid}`)}
              >
                View Details
              </button>
            </div>
          ))}
        </>
      )}

      {activeTab === "ended" && (
        <>
          <h2>Ended Elections</h2>
          {elections.filter(e => !e.not_ended).map((e) => (
            <div key={e.electionid} className="election-card">
              <h3>{e.electionname}</h3>
              <p>Description: {e.description}</p>
              <p>
                Duration: {new Date(e.startdate).toLocaleString()} to {new Date(e.enddate).toLocaleString()}
              </p>
              <div className="candidate-box">
                <h4>Candidates</h4>
                <ul>
                  {e.candidates.map((c) => (
                    <li key={c.id}>
                      {c.name} - {c.voteCount} vote(s)
                    </li>
                  ))}
                </ul>
              </div>
              {e.candidates?.some(c => c.is_manual_winner) ? (
              <div className="winner-box">
                🏆 <strong>Final Winner (Creator Decision):</strong> {e.candidates.find(c => c.is_manual_winner)?.name}
              </div>
            ) : e.winner && (
                <div className="winner-box">
                  <strong>Top Voted:</strong> {e.winner.name} with {e.winner.voteCount} vote(s)
                </div>
              )}
              <button
                className="view-btn"
                onClick={() => navigate(`/view-elections?id=${e.electionid}`)}
              >
                View Details
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default ViewElection;

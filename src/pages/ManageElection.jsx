import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./ManageElection.css";

const ManageElection = () => {
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [winnerName, setWinnerName] = useState("");
  const [tieBreakTypes, setTieBreakTypes] = useState([]);
  const [tiedCandidates, setTiedCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [newRole, setNewRole] = useState({ description: "", voteweight: 1 });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [editingDescription, setEditingDescription] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [newAssignment, setNewAssignment] = useState({ email: "", role: "", weight: 1 });
  const [revoteStartDate, setRevoteStartDate] = useState("");
  const [revoteEndDate, setRevoteEndDate] = useState("");
  const [newElectionLink, setNewElectionLink] = useState("");

  const electionId = searchParams.get("id");
  const accessToken = searchParams.get("token");

  useEffect(() => {
    const loadElection = async () => {
      const { data: tieData } = await supabase.from("types").select("id, description").gte("id", 101);
      if (tieData) setTieBreakTypes(tieData);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return navigate("/login");
      setUser(session.user);

      let query;
      if (accessToken) {
        query = supabase.from("election").select("*, candidates(*)").eq("access_token", accessToken);
      } else if (electionId) {
        query = supabase.from("election").select("*, candidates(*)").eq("electionid", electionId);
      } else {
        return alert("No election identifier provided.");
      }

      const { data, error } = await query;
      if (error || !data) return alert("Election not found.");
      const electionData = Array.isArray(data) ? data[0] : data;
      if (electionData.userid && electionData.userid !== session.user.id) {
        alert("You are not authorized to manage this election.");
        return navigate("/");
      }
      setElection(electionData);
      setNewDescription(electionData.description);

      const { data: candidates } = await supabase
        .from("candidates")
        .select("*")
        .eq("electionid", electionData.electionid);

      if (candidates) {
        electionData.candidates = candidates;
        setElection({ ...electionData, candidates });
      }

      const { data: votes } = await supabase
        .from("votes")
        .select("candidateid, email")
        .eq("electionid", electionData.electionid);

      const voteCountMap = {};
      for (const vote of votes) {
        if (!vote.candidateid) continue;
        voteCountMap[vote.candidateid] = (voteCountMap[vote.candidateid] || 0) + 1;
      }

      const maxVotes = Math.max(...Object.values(voteCountMap));
      const tied = Object.entries(voteCountMap).filter(([_, count]) => count === maxVotes);

      if (electionData.tie_break_type_id === 105 && new Date(electionData.enddate) < new Date() && tied.length > 1) {
        setTiedCandidates(candidates.filter(c => tied.map(([id]) => parseInt(id)).includes(c.id)));
        setShowWinnerPopup(true);
      }
    };

    loadElection();
  }, [electionId, accessToken, navigate]);

  const createElectionFromTemplate = async (templateElection, candidateList, startDate, endDate) => {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const accessToken = templateElection.visibility ? null : crypto.randomUUID();

  const electionData = {
    electionname: `${templateElection.electionname} (Revote)`,
    description: `Revote due to tie in election: ${templateElection.electionname}`,
    startdate: startDate,
    enddate: endDate,
    statuscode: 1,
    typecode: templateElection.typecode,
    permittedrolecodes: templateElection.permittedrolecodes || [],
    visibility: templateElection.visibility,
    access_token: accessToken,
    userid: session.user.id,
    tie_break_type_id: templateElection.tie_break_type_id,
    tiebreak_role: templateElection.tiebreak_role || null
  };

  // Insert new election
  const { data: newElection, error } = await supabase
    .from("election")
    .insert(electionData)
    .select()
    .single();

  if (error || !newElection) {
    console.error("❌ Supabase Insert Error:", error);
    alert("Failed to create new election.");
    throw new Error("Election insert failed.");
  }

  // Duplicate only tied candidates
  const insertCandidates = candidateList.map(c => ({
    name: c.name,
    description: c.description,
    image: c.image,
    electionid: newElection.electionid
  }));

  const { error: candidateError } = await supabase
    .from("candidates")
    .insert(insertCandidates);

  if (candidateError) {
    console.error("❌ Failed to insert candidates:", candidateError);
    alert("Election was created but candidates failed to duplicate.");
  }

  return {
    id: newElection.electionid,
    link: accessToken
      ? `${window.location.origin}/Suffragium/#/view-elections?token=${accessToken}`
      : `${window.location.origin}/Suffragium/#/view-elections?id=${newElection.electionid}`
  };
};


  const handleRevoteSubmit = async () => {
    if (!revoteStartDate || !revoteEndDate) return alert("Please provide both start and end dates.");
    try {
      const { id, link } = await createElectionFromTemplate(election, tiedCandidates, revoteStartDate, revoteEndDate);
      setNewElectionLink(link);
    } catch (err) {
      console.error(err);
      alert("Failed to create revote.");
    }
  };

  const loadRoles = async () => {
    const { data, error } = await supabase
      .from("user_role")
      .select("*")
      .eq("electionid", election.electionid);
    if (!error) setRoles(data);
  };

  useEffect(() => {
    if (election) loadRoles();
  }, [election]);

  const handleRemoveRole = async (email, role) => {
    const { error } = await supabase
      .from("user_role")
      .delete()
      .eq("electionid", election.electionid)
      .eq("email", email)
      .eq("role", role);
    if (!error) loadRoles();
  };

  const handleAssignRole = async () => {
    if (!newAssignment.email || !newAssignment.role) return;
    const { error } = await supabase.from("user_role").insert({
      email: newAssignment.email,
      role: newAssignment.role,
      weight: newAssignment.weight,
      electionid: election.electionid,
    });
    if (!error) {
      loadRoles();
      setNewAssignment({ email: "", role: "", weight: 1 });
    }
  };

  const handleAddRole = async () => {
    if (!newRole.description.trim()) return;
    const existing = roles.find(r => r.role === newRole.description);
    if (existing) return alert("Role already exists.");

    setRoles([...roles, { role: newRole.description, weight: newRole.voteweight }]);
    setNewRole({ description: "", voteweight: 1 });
  };

  const handleApplyChanges = async () => {
    const uniqueRoles = [...new Set(roles.map(r => r.role))];
    for (const role of uniqueRoles) {
      const exists = roles.find(r => r.role === role);
      if (!exists) {
        await supabase.from("user_role").insert({
          role,
          weight: 1,
          electionid: election.electionid,
          email: "placeholder@example.com"
        });
      }
    }

    alert("Role changes applied successfully.");
  };

  if (!election) return <p>Loading election...</p>;

  return (
    <div className="page-wrapper">
      <div className="manage-election-wrapper">
        <button className="back-btn" onClick={() => navigate("/my-elections")}>← Back to My Elections</button>

        <h2>Manage Election</h2>

        <section>
          <h3>Election Info</h3>
          <p><strong>Name:</strong> {election.electionname}</p>
          <p>
            <strong>Description:</strong>{" "}
            {editingDescription ? (
              <>
                <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
                <button onClick={async () => {
                  const { error } = await supabase.from("election").update({ description: newDescription }).eq("electionid", election.electionid);
                  if (!error) {
                    setElection({ ...election, description: newDescription });
                    setEditingDescription(false);
                  }
                }}>Save</button>
              </>
            ) : (
              <>
                {election.description} <button onClick={() => setEditingDescription(true)}>Edit</button>
              </>
            )}
          </p>
          <p><strong>Type:</strong> {election.typecode === 2 ? "Weighted" : "Normal"}</p>
          <p><strong>Start:</strong> {new Date(election.startdate).toLocaleString()}</p>
          <p><strong>End:</strong> {new Date(election.enddate).toLocaleString()}</p>
          <p><strong>Visibility:</strong> {election.visibility ? "Public" : "Private"}</p>
          <p><strong>Status:</strong> {new Date(election.enddate) < new Date() ? "Ended" : "Open"}</p>
          <p><strong>Tie-Break Method:</strong> {tieBreakTypes.find(t => t.id === election.tie_break_type_id)?.description || 'None'}</p>
          {election.tie_break_type_id === 104 && election.tiebreak_role && (
            <p><strong>Role-Based Priority:</strong> {election.tiebreak_role}</p>
          )}
          <h4>Candidates</h4>
          <ul>
            {election.candidates?.map((c, i) => (
              <li key={i}>
                <strong>{c.name}</strong>: {c.description || "No description"}
              </li>
            ))}
          </ul>

          {new Date(election.enddate) < new Date() && election.candidates && (() => {
            const manualWinner = election.candidates.find(c => c.is_manual_winner);
            const sorted = [...election.candidates].sort((a, b) => b.voteCount - a.voteCount);
            const topVoted = sorted[0];
            const topVoteCount = topVoted?.voteCount;
            const tied = sorted.filter(c => c.voteCount === topVoteCount);

            if (manualWinner) {
              const methodLabel = election.tie_break_type_id === 105 ? "Revote" : "Creator Decision";
              const explanation = election.tie_break_type_id === 105
                ? "This tie was resolved through a revote."
                : "This tie has been resolved by the election creator.";

              return (
                <div className="winner-box">
                  <p><strong>Winner:</strong> {manualWinner.name}</p>
                  <em>{explanation}</em>
                </div>
              );
            } else if (tied.length === 1) {
              return (
                <div className="winner-box">
                  <p><strong>Winner:</strong> {topVoted.name}</p>
                  <em>This election has concluded with a clear winner.</em>
                </div>
              );
            } else {
              return null;
            }
          })()}
        </section>

        <section>
          <h3>Shareable Link</h3>
          <input
            type="text"
            value={
              accessToken
                ? `${window.location.origin}/Suffragium/#/view-elections?token=${accessToken}`
                : `${window.location.origin}/Suffragium/#/view-elections?id=${election.electionid}`
            }
            readOnly
            onClick={(e) => e.target.select()}
          />
        </section>

        {election.typecode === 2 && (
          <section>
            <h3>Role Management</h3>
            <input
              type="text"
              placeholder="Role Name"
              value={newRole.description}
              onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
            />
            <input
              type="number"
              step="0.1"
              placeholder="Vote Weight"
              value={newRole.voteweight}
              onChange={(e) => setNewRole({ ...newRole, voteweight: parseFloat(e.target.value) || 0 })}
            />
            <button onClick={handleAddRole}>Add Role</button>

            <h4 style={{ marginTop: '32px' }}>Assigned Roles</h4>
            {roles.length === 0 && <p>No roles assigned yet.</p>}
            <ul>
              {roles.map((role, i) => (
                <li key={i}>
                  <strong>{role.role}</strong> → {role.email} (Weight: {role.weight})
                  <button style={{ marginLeft: 10 }} onClick={() => handleRemoveRole(role.email, role.role)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 24 }}>
              <h4>Assign New Role</h4>
              <input
                type="email"
                placeholder="User Email"
                value={newAssignment.email}
                onChange={(e) => setNewAssignment({ ...newAssignment, email: e.target.value })}
              />
              <select value={newAssignment.role} onChange={(e) => setNewAssignment({ ...newAssignment, role: e.target.value })}>
                <option value="">Select Role</option>
                {[...new Set(roles.map(r => r.role))].map((roleName, i) => (
                  <option key={i} value={roleName}>{roleName}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Weight"
                value={newAssignment.weight}
                onChange={(e) => setNewAssignment({ ...newAssignment, weight: parseFloat(e.target.value) })}
              />
              <button onClick={handleAssignRole}>Assign Role</button>
            </div>
            <button style={{ marginTop: 20 }} className="submit-btn" onClick={handleApplyChanges}>Apply Role Changes</button>
          </section>
        )}

        {election.tie_break_type_id === 103 && new Date(election.enddate) < new Date() && (
        <section style={{ marginTop: 32 }}>
  <h3>Resolve Tie (Creator Decision)</h3>
  {tiedCandidates.length > 1 ? (
    election.candidates?.some(c => c.is_manual_winner) ? (
      <div className="winner-box">
        <p><strong>Winner:</strong> {election.candidates.find(c => c.is_manual_winner)?.name}</p>
        <em>This tie has been resolved by the election creator.</em>
      </div>
    ) : (
      <div style={{ marginTop: 16 }}>
        <select value={selectedCandidate} onChange={(e) => setSelectedCandidate(e.target.value)}>
          <option value="">Select Winner</option>
          {tiedCandidates.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          style={{ marginLeft: 10 }}
          onClick={async () => {
            if (!selectedCandidate) return alert("Please select a candidate");
            const winner = tiedCandidates.find(c => c.id === parseInt(selectedCandidate));
            await supabase
              .from("candidates")
              .update({ is_manual_winner: false })
              .eq("electionid", election.electionid);
            const { error } = await supabase
              .from("candidates")
              .update({ is_manual_winner: true })
              .eq("id", parseInt(selectedCandidate));
            if (!error && winner) {
              setWinnerName(winner.name);
              setShowWinnerPopup(true);
              setTiedCandidates([]);
              setSelectedCandidate("");
            }
          }}>
          Confirm Winner
        </button>
      </div>
    )
  ) : <p>No tie to resolve.</p>}

  
</section>
      )}

{showWinnerPopup && (
      <div className="popup-message">
        <p>✅ Winner selected: <strong>{winnerName}</strong></p>
        {election?.tie_break_type_id === 105 ? (
          <>
            <p>This tie is going to be resolved through a revote. Configure the new election below.</p>
            <input type="datetime-local" value={revoteStartDate} onChange={(e) => setRevoteStartDate(e.target.value)} />
            <input type="datetime-local" value={revoteEndDate} onChange={(e) => setRevoteEndDate(e.target.value)} />
            <button onClick={handleRevoteSubmit}>Create Election</button>
            {newElectionLink && (
              <div style={{ marginTop: 12 }}>
                <p>New election created:</p>
                <a href={newElectionLink}>{newElectionLink}</a>
              </div>
            )}
          </>
        ) : (
          <p>This tie has been resolved manually.</p>
        )}
        <button onClick={() => setShowWinnerPopup(false)}>Close</button>
      </div>
    )}
    </div>
  </div>
  );
};

export default ManageElection;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../supabaseClient";
import "./CreateElection.css";

const MAX_FILE_SIZE_MB = 2;

const CreateElection = () => {
  const [activeTab, setActiveTab] = useState("election");
  const [electionName, setElectionName] = useState("");
  const [electionDescription, setElectionDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [typeCode, setTypeCode] = useState(1);
  const [hasPassword, setHasPassword] = useState(false);
  const [electionPassword, setElectionPassword] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [candidates, setCandidates] = useState([]);
  const [newCandidate, setNewCandidate] = useState("");
  const [newCandidateDescription, setNewCandidateDescription] = useState("");
  const [newCandidateImage, setNewCandidateImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState({ description: "", voteweight: 1 });
  const [emailAssignments, setEmailAssignments] = useState([]);
  const [newAssignment, setNewAssignment] = useState({ email: "", role: "" });
  const [shareMessage, setShareMessage] = useState(null);
  const [shareableLink, setShareableLink] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tieBreakTypeId, setTieBreakTypeId] = useState(null);
  const [tieBreakTypes, setTieBreakTypes] = useState([]);
  const [tiebreakRole, setTiebreakRole] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) navigate("/login");
    };
    checkSession();

    const loadTieBreakTypes = async () => {
      const { data, error } = await supabase
        .from("types")
        .select("id, description")
        .gte("id", 101);

      if (!error) setTieBreakTypes(data);
    };
    loadTieBreakTypes();
  }, [navigate]);

  const uploadImage = async (file) => {
    if (file.size / 1024 / 1024 > MAX_FILE_SIZE_MB) {
      alert(`Image exceeds ${MAX_FILE_SIZE_MB}MB size limit.`);
      return null;
    }
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from("candidate-pictures").upload(fileName, file);
    if (error) return null;
    return supabase.storage.from("candidate-pictures").getPublicUrl(fileName).data.publicUrl;
  };

  const addCandidate = async () => {
    if (!newCandidate.trim()) return;
    let imageUrl = null;
    if (newCandidateImage) {
      imageUrl = await uploadImage(newCandidateImage);
      if (!imageUrl) return;
    }
    setCandidates([...candidates, {
      name: newCandidate,
      description: newCandidateDescription.trim() || null,
      image_url: imageUrl || null
    }]);
    setNewCandidate("");
    setNewCandidateDescription("");
    setNewCandidateImage(null);
    setImagePreview(null);
  };

  const addRole = () => {
    if (!newRole.description.trim()) return;
    const newRoleWithId = { ...newRole, id: roles.length + 1 };
    setRoles([...roles, newRoleWithId]);
    setNewRole({ description: "", voteweight: 1 });
  };

  const removeCandidate = (index) => {
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (typeCode === 2 && roles.length === 0) {
      alert("Please add at least one role for a weighted election.");
      setIsSubmitting(false);
      return;
    }

    if (candidates.length < 2) {
      alert("Please add at least two candidates to create an election.");
      setIsSubmitting(false);
      return;
    }

    const formattedStartDate = startDate;
    const formattedEndDate = endDate;
    const isPrivate = visibility === "private";
    const accessToken = isPrivate ? uuidv4() : null;

    const {
      data: { session }
    } = await supabase.auth.getSession();

    const electionData = {
      electionname: electionName,
      description: electionDescription,
      startdate: formattedStartDate,
      enddate: formattedEndDate,
      statuscode: 1,
      typecode: typeCode,
      permittedrolecodes: [],
      visibility: visibility === "public",
      access_token: accessToken,
      userid: session.user.id,
      tie_break_type_id: tieBreakTypeId || null,
      tiebreak_role: tieBreakTypeId === 104 ? tiebreakRole : null
    };

    const { data, error } = await supabase.from("election").insert([electionData]).select();
    if (error || !data?.length) {
      alert("Failed to create the election.");
      setIsSubmitting(false);
      return;
    }
    const electionId = data[0].electionid;

    await supabase.from("candidates").insert(
      candidates.map((c) => ({
        electionid: electionId,
        name: c.name,
        description: c.description || null,
        image: c.image_url || null
      }))
    );

    await Promise.all(emailAssignments.map(async (assignment) => {
      await supabase.from("user_role").insert({
        email: assignment.email,
        role: assignment.role,
        weight: assignment.weight,
        electionid: electionId
      });
    }));

    const url = isPrivate
      ? `${window.location.origin}/Suffragium/#/view-elections?token=${accessToken}`
      : `${window.location.origin}/Suffragium/#/view-elections?id=${electionId}`;

    setShareableLink(url);
    setShareMessage("Election and candidates created successfully!");
    setShowPopup(true);

    navigate(`/manage-election?id=${electionId}`);
  };

  return (
    <div className="page-wrapper">
      <div className="create-election-wrapper">
        <h2>Create New Election</h2>
        <div className="dashboard-tabs">
          <button onClick={() => setActiveTab("election")} className={activeTab === "election" ? "active" : ""}>🗳️ Election Info</button>
          <button onClick={() => setActiveTab("candidates")} className={activeTab === "candidates" ? "active" : ""}>👤 Candidates</button>
          <button onClick={() => setActiveTab("roles")} className={activeTab === "roles" ? "active" : ""}>📊 Roles</button>
        </div>

        <main className="content">
          <form onSubmit={handleSubmit}>
            {activeTab === "election" && (
              <div className="form-section">
                <label>Election Name:</label>
                <input type="text" value={electionName} onChange={(e) => setElectionName(e.target.value)} maxLength={20} required />
                <label>Election Description:</label>
                <textarea value={electionDescription} onChange={(e) => setElectionDescription(e.target.value)} rows="4" required />
                <label>Start Date:</label>
                <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                <label>End Date:</label>
                <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                <label>Election Type:</label>
                <select value={typeCode} onChange={(e) => setTypeCode(parseInt(e.target.value))}>
                  <option value={1}>Normal</option>
                  <option value={2}>Weighted</option>
                  <option value={3}>Placeholder</option>
                </select>
                <label>Tie-Breaking Method:</label>
                <select value={tieBreakTypeId || ""} onChange={(e) => setTieBreakTypeId(parseInt(e.target.value))}>
                  <option value="">Select a method</option>
                  {tieBreakTypes?.map((t) => (
                    <option key={t.id} value={t.id}>{t.description}</option>
                  ))}
                </select>
                {tieBreakTypeId === 104 && (
                  <>
                    <label>Role to resolve tie:</label>
                    <select value={tiebreakRole} onChange={(e) => setTiebreakRole(e.target.value)}>
                      <option value="">Select Role</option>
                      {roles.map((r, i) => (
                        <option key={i} value={r.description}>{r.description}</option>
                      ))}
                    </select>
                  </>
                )}
                <div className="password-toggle">
                  <label>
                    Add Password to Election
                    <input type="checkbox" checked={hasPassword} onChange={(e) => setHasPassword(e.target.checked)} style={{ marginLeft: "12px", transform: "scale(1.5)" }} />
                  </label>
                </div>
                {hasPassword && (
                  <div className="password-input">
                    <label>Password:</label>
                    <input type="password" value={electionPassword} onChange={(e) => setElectionPassword(e.target.value)} placeholder="Enter election password" />
                  </div>
                )}
              </div>
            )}

            {activeTab === "candidates" && (
              <div className="form-section">
                <label>Candidates:</label>
                <div className="candidate-list">
                  {candidates.map((candidate, index) => (
                    <div key={index} className="candidate-item">
                      <strong>{candidate.name}</strong>
                      <p>{candidate.description}</p>
                      <button type="button" onClick={() => removeCandidate(index)}>❌</button>
                    </div>
                  ))}
                </div>
                <div className="add-candidate">
                  <input type="text" value={newCandidate} onChange={(e) => setNewCandidate(e.target.value)} placeholder="Enter candidate name" />
                  <textarea value={newCandidateDescription} onChange={(e) => setNewCandidateDescription(e.target.value)} rows="4" placeholder="Enter candidate description"></textarea>
                  <input type="file" accept="image/*" onChange={(e) => {
                    setNewCandidateImage(e.target.files[0]);
                    setImagePreview(URL.createObjectURL(e.target.files[0]));
                  }} />
                  {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxHeight: 150, marginTop: 8 }} />}
                  <button type="button" onClick={addCandidate}>Add Candidate</button>
                </div>
              </div>
            )}

            {activeTab === "roles" && (
              <div className="form-section">
                <label>Add Role:</label>
                <input type="text" value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} placeholder="Role Name" />
                <input type="number" step="0.1" value={isNaN(newRole.voteweight) ? '' : newRole.voteweight} onChange={(e) => setNewRole({ ...newRole, voteweight: parseFloat(e.target.value) || 0 })} placeholder="Vote Weight" />
                <button type="button" onClick={addRole}>Add Role</button>

                <div className="candidate-list">
                  {roles.map((r, i) => (
                    <p key={i}><strong>{r.description}</strong> - Weight: {r.voteweight}</p>
                  ))}
                </div>

                <label style={{ marginTop: 12 }}>Assign Role to Email:</label>
                <input type="email" value={newAssignment.email} onChange={(e) => setNewAssignment({ ...newAssignment, email: e.target.value })} placeholder="User Email" />
                <select value={newAssignment.role} onChange={(e) => setNewAssignment({ ...newAssignment, role: e.target.value })}>
                  <option value="">Select Role</option>
                  {roles.map((r, i) => (
                    <option key={i} value={r.description}>{r.description}</option>
                  ))}
                </select>
                <button type="button" onClick={() => {
                  const selectedRole = roles.find(r => r.description === newAssignment.role);
                  if (!newAssignment.email || !selectedRole) return;
                  setEmailAssignments([...emailAssignments, {
                    email: newAssignment.email,
                    role: selectedRole.description,
                    weight: selectedRole.voteweight
                  }]);
                  setNewAssignment({ email: "", role: "" });
                }}>Assign Role</button>

                <div className="candidate-list">
                  {emailAssignments.map((a, i) => (
                    <p key={i}><strong>{a.email}</strong> → {a.role} (Weight: {a.weight})</p>
                  ))}
                </div>
              </div>
            )}

            {!shareMessage && (
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Election"}
              </button>
            )}
          </form>

          {showPopup && shareMessage && (
            <div className="popup-message">
              <p>{shareMessage}</p>
              {shareableLink && (
                <div className="shareable-link-box">
                  <p><strong>Private Election Link:</strong></p>
                  <input type="text" value={shareableLink} readOnly onClick={(e) => e.target.select()} />
                  <p className="shareable-note">Share this with participants to let them access the election.</p>
                </div>
              )}
              <button onClick={() => setShowPopup(false)}>Close</button>
              <button onClick={() => navigate('/view-elections')}>View Election</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CreateElection;

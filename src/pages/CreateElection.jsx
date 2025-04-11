import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../supabaseClient";
import "./CreateElection.css";

const MAX_FILE_SIZE_MB = 2; // Max file size in megabytes

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
  const [shareMessage, setShareMessage] = useState(null);
  const [shareableLink, setShareableLink] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

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
        console.warn("❌ No active session. Redirecting to login...");
        navigate("/login");
      }
    };

    checkSession();
  }, [navigate]);

  const uploadImage = async (file) => {
    if (file.size / 1024 / 1024 > MAX_FILE_SIZE_MB) {
      alert(`Image exceeds ${MAX_FILE_SIZE_MB}MB size limit.`);
      return null;
    }

    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from("candidate-pictures").upload(fileName, file);
    if (error) {
      console.error("Image upload error:", error);
      return null;
    }
    const url = supabase.storage.from("candidate-pictures").getPublicUrl(fileName).data.publicUrl;
    return url;
  };

  const addCandidate = async () => {
    if (newCandidate.trim() !== "") {
      let imageUrl = null;
      if (newCandidateImage) {
        imageUrl = await uploadImage(newCandidateImage);
        if (!imageUrl) return;
      }

      setCandidates([...candidates, {
        name: newCandidate,
        description: newCandidateDescription?.trim() || null,
        image_url: imageUrl || null
      }]);

      setNewCandidate("");
      setNewCandidateDescription("");
      setNewCandidateImage(null);
    }
  };

  const removeCandidate = (index) => {
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (candidates.length < 2) {
      alert("Please add at least two candidates to create an election.");
      return;
    }

    const formattedStartDate = startDate.split("T")[0];
    const formattedEndDate = endDate.split("T")[0];
    const isPrivate = visibility === "private";
    const accessToken = isPrivate ? uuidv4() : null;

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
    };

    const { data, error } = await supabase.from("election").insert([electionData]).select();

    if (error || !data || data.length === 0) {
      console.error("Election creation failed:", error);
      alert("Failed to create the election.");
      return;
    }

    const electionId = data[0].electionid;
    const candidateInserts = candidates.map((c) => ({
      electionid: electionId,
      name: c.name,
      description: c.description || null,
      image: c.image_url || null
    }));

    const { error: candidateError } = await supabase.from("candidates").insert(candidateInserts);

    if (candidateError) {
      console.error("Candidate insertion failed:", candidateError);
      alert("Election was created but candidates couldn't be added.");
      return;
    }

    if (isPrivate) {
      const shareURL = `${window.location.origin}/view-elections?token=${accessToken}`;
      setShareableLink(shareURL);
      setShareMessage("Election and candidates created successfully!");
    } else {
      setShareMessage("Election and candidates created successfully!");
    }

    setShowPopup(true);
  };

  return (
    <div className="page-wrapper">
      <div className="create-election-wrapper">
        <h2 className="">Create New Election</h2>
        <div className="dashboard-tabs">
          <button onClick={() => setActiveTab("election")} className={activeTab === "election" ? "active" : ""}>🗳️ Election Info</button>
          <button onClick={() => setActiveTab("candidates")} className={activeTab === "candidates" ? "active" : ""}>👤 Candidates</button>
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

                <label>Visibility:</label>
                <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                  <option value="public">Public</option>
                  <option value="private">Private (Shareable Link)</option>
                </select>

                <div className="password-toggle">
                  <label>
                    Add Password to Election
                    <input
                      type="checkbox"
                      checked={hasPassword}
                      onChange={(e) => setHasPassword(e.target.checked)}
                      style={{ marginLeft: "12px", transform: "scale(1.5)" }}
                    />
                  </label>
                </div>

                {hasPassword && (
                  <div className="password-input">
                    <label>Password:</label>
                    <input
                      type="password"
                      value={electionPassword}
                      onChange={(e) => setElectionPassword(e.target.value)}
                      placeholder="Enter election password"
                    />
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
                  <input
                    type="text"
                    value={newCandidate}
                    onChange={(e) => setNewCandidate(e.target.value)}
                    placeholder="Enter candidate name"
                  />
                  <textarea
                    value={newCandidateDescription}
                    onChange={(e) => setNewCandidateDescription(e.target.value)}
                    rows="4"
                    placeholder="Enter candidate description"
                  ></textarea>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewCandidateImage(e.target.files[0])}
                  />
                  <button type="button" onClick={addCandidate}>Add Candidate</button>
                </div>
              </div>
            )}

            <button type="submit" className="submit-btn">Create Election</button>
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CreateElection;

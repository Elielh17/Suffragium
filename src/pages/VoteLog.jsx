import React, { useState, useEffect } from 'react';
import { supabase } from "../supabaseClient";
import "./VoteLog.css";

const VoteLog = ({ electionId }) => {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const idAsNumber = Number(electionId);


  useEffect(() => {
    if (!electionId) return;

    const fetchLog = async () => {
      setLoading(true);
      console.log("electionId being sent to RPC:", electionId, typeof electionId);

      const { data, error } = await supabase.rpc('votelogperelection', {
        electioninput: idAsNumber,
      });

      if (error) {
        console.error('Failed to fetch voting log:', error.message);
        setLog([]);
      } else {
        setLog(data);
      }

      setLoading(false);
    };

    fetchLog();
  }, [electionId]);
  
  

  if (loading) return <p>Loading voting log...</p>;
  if (log.length === 0) return <p>No votes logged yet.</p>;

  return (
    <div className="voting-log">
      <h4>Voting Log</h4>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Candodate</th>
          </tr>
        </thead>
        <tbody>
          {log.map((entry, i) => (
            <tr key={i}>
              <td>{new Date(entry.timestamper).toLocaleString()}</td>
              <td>{entry.useremail}</td>
              <td>{entry.candidatename}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VoteLog;
import React from "react";
import "./TableTest.css"; // Import CSS file
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://cxlrsjulixkuhbgtxwho.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4bHJzanVsaXhrdWhiZ3R4d2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MzA1ODcsImV4cCI6MjA1ODUwNjU4N30.UGWWsAvzNCIBrgyGkT21e7Tl163jbZZIRsmh810YAIU");

function TableTest() {
    const [election, setElections] = useState([]);
    useEffect(() => {
      getElections();
    }, []);

    async function getElections() {
        const { data } = await supabase.from("election").select();
        setElections(data);
      }

      return (
        <ul>
          {election.map((election) => (
            <li key={election.electionname}>{election.electionname}</li>
          ))}
        </ul>
      );
    }

export default TableTest;

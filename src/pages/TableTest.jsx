// import React from "react";
// import "./TableTest.css"; // Import CSS file
// import { useState, useEffect } from "react";
// import { createClient } from "@supabase/supabase-js";

// const supabase = createClient("https://cxlrsjulixkuhbgtxwho.supabase.co", Anon-Key);

// function TableTest() {
//     const [election, setElections] = useState([]);
//     useEffect(() => {
//       getElections();
//     }, []);

//     async function getElections() {
//         const { data } = await supabase.from("election").select();
//         setElections(data);
//       }

//       return (
//         <ul>
//           {election.map((election) => (
//             <li key={election.electionname}>{election.electionname}</li>
//           ))}
//         </ul>
//       );
//     }

// export default TableTest;

import React from 'react';
import ReactDOM from "react-dom";
import App from './App';
import './index.scss';
import { Principal } from "@dfinity/principal";
// Import the agent used by your actors (usually from your declarations folder)
import { HttpAgent } from "@dfinity/agent"; 

const CURRENT_USER_ID = Principal.fromText("2vxsx-fae");
export default CURRENT_USER_ID;

const init = async () => {
  // 1. Create or access the agent
  // If you use generated declarations, they often export a default agent or create one.
  const agent = new HttpAgent({ host: "http://localhost:3002" }); 

  // 2. Fetch the root key for local development
  // This is the CRITICAL fix for "Signature verification failed"
  if (process.env.DFX_NETWORK !== "ic") {
    agent.fetchRootKey().catch(err => {
      console.warn("Unable to fetch root key. Check if your local replica is running.");
      console.error(err);
    });
  }

  ReactDOM.render(<App />, document.getElementById("root"));
};

init();

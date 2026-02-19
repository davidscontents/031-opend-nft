import React from 'react';
import ReactDOM from "react-dom";
// import ReactDOM from 'react-dom/client';
import App from './App';
import './index.scss';
import { Principal } from "@dfinity/principal";

const CURRENT_USER_ID = Principal.fromText("2vxsx-fae");
export default CURRENT_USER_ID;

ReactDOM.render(<App />, document.getElementById("root"));

// const init = async () => {
//   ReactDOM.render(<App />, document.getElementById("root"));
// };

// init();

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
// );

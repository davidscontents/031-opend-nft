import React, { useState } from 'react';
import ReactDOM from "react-dom";
import { nft } from '../../declarations/nft';
import Header from "./components/Header";
import Footer from "./components/Footer";
import "bootstrap/dist/css/bootstrap.min.css";
import Item from './components/Item';
import Minter from './components/Minter';

function App() {
  // const NFTID = "uxrrr-q7777-77774-qaaaq-cai";

  return (
    <main>
      <div className="App">
        <Header />
        {/* <Minter /> */}
        {/* <Item id={NFTID} /> */}
        <Footer />
      </div>
    </main>
  );
}

export default App;

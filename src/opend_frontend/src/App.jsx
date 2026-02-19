import React, { useState } from 'react';
import ReactDOM from "react-dom";
import { opend_backend } from '../../declarations/opend_backend';
import Header from "./components/Header";
import Footer from "./components/Footer";
import "bootstrap/dist/css/bootstrap.min.css";
import homeImage from "/home-img.png";
import Item from './components/Item';

function App() {
  const NFTID = "uxrrr-q7777-77774-qaaaq-cai";

  return (
    <main>
      <div className="App">
        <Header />
        <Item id={NFTID} />
        {/* <img className="bottom-space" src={homeImage} /> */}
        <Footer />
      </div>
    </main>
  );
}

export default App;

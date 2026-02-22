import React, { useEffect, useState } from "react";
import logo from "/logo.png";
import homeImage from "/home-img.png";
import { BrowserRouter, Link, Switch, Route } from "react-router-dom";
import Minter from "./Minter";
import Gallery from "./Gallery";
import { opend_backend } from "../../../declarations/opend_backend";
import CURRENT_USER_ID from "../main";
import { Actor, HttpAgent } from "@dfinity/agent";

function Header() {
  const [userOwnedGallery, setOwnedGallery] = useState();
  const [listingGallery, setListingGallery] = useState();

  async function getNFTs() {
    // Use a direct HttpAgent check
    if (process.env.DFX_NETWORK !== "ic") {
      // Create a local agent pointing to your local replica
      const agent = new HttpAgent({ host: "http://localhost:3002" });
      
      try {
        await agent.fetchRootKey();
      } catch (err) {
        console.warn("Unable to fetch root key. Check if 'dfx start' is running.");
        console.error(err);
      }
    }

    const userNFTIds = await opend_backend.getOwnedNFTs(CURRENT_USER_ID);
    console.log(userNFTIds);
    setOwnedGallery(<Gallery title="My NFTs" ids={userNFTIds} role="collection" />);

    const listedNFTsIds = await opend_backend.getListedNFTs();
    console.log(listedNFTsIds);
    setListingGallery(<Gallery title="Discover" ids={listedNFTsIds} role="discover" />);
  }

  useEffect(() => {
    getNFTs();
  }, []);

  return (
    <BrowserRouter forceRefresh={true}>
      <div className="app-root-1">
        <header className="Paper-root AppBar-root AppBar-positionStatic AppBar-colorPrimary Paper-elevation4">
          <div className="Toolbar-root Toolbar-regular header-appBar-13 Toolbar-gutters">
            <div className="header-left-4"></div>
            <img className="header-logo-11" src={logo} />
            <div className="header-vertical-9"></div>
            <Link to="/">
              <h5 className="Typography-root header-logo-text">OpenD</h5>
            </Link>
            <div className="header-empty-6"></div>
            <div className="header-space-8"></div>
            <button className="ButtonBase-root Button-root Button-text header-navButtons-3">
              <Link to="/discover">Discover</Link>
            </button>
            <button className="ButtonBase-root Button-root Button-text header-navButtons-3">
              <Link to="/minter">Minter</Link>
            </button>
            <button className="ButtonBase-root Button-root Button-text header-navButtons-3">
              <Link to="collection">My NFTs</Link>
            </button>
          </div>
        </header>
      </div>
      <Switch>
        <Route exact path="/">
          <img className="bottom-space" src={homeImage} />
        </Route>
        <Route path="/discover">
          {listingGallery}
        </Route>
        <Route path="/minter">
          <Minter />
        </Route>
        <Route path="/collection">
          {userOwnedGallery}
        </Route>
      </Switch>
    </BrowserRouter>
  );
}

export default Header;

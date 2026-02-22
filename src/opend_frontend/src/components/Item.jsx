import React, { useEffect, useRef, useState } from "react";
import logo from "/logo.png";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/nft";
import { idlFactory as dtokenIdlFactory } from "../../../declarations/dtoken_backend";
import { Principal } from "@dfinity/principal";
import Button from "./Button";
import { opend_backend } from "../../../declarations/opend_backend";
import CURRENT_USER_ID from "../main";
import PriceLabel from "./PriceLabel";

function Item(props) {
  const id = props.id;
  const localHost = "http://localhost:3002/";
  const agent = new HttpAgent({host: localHost});

  // 2. Use useRef to persist the actor immediately across async calls
  const nftActorRef = useRef(); 

  const [nftData, setNftData] = useState({
    name: "",
    owner: "",
    image: "",
  });
  const [button, setButton] = useState();
  const [priceInput, setPriceInput] = useState();
  const [loaderHidden, setLoaderHidden] = useState(true);
  const [blur, setBlur] = useState();
  const [sellStatus, setSellStatus] = useState();
  const [priceLabel, setPriceLabel] = useState();
  const [shouldDisplay, setDisplay] = useState(true);

  // FIX 2: Create a state for the price value
  const [priceValue, setPriceValue] = useState("");

  async function loadNFT() {
    if (process.env.NODE_ENV !== "production") {
      await agent.fetchRootKey();
    }

    // FIX 1: Ensure id is string for actor creation
    const canisterIdString = typeof props.id === "string" ? props.id : props.id.toText();
    // FIX 2: Ensure we have a Principal object for backend calls
    const nftPrincipal = typeof props.id === "string" ? Principal.fromText(props.id) : props.id;

    const actor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: canisterIdString, // Use string
    });

    // 3. Store in Ref (Synchronous update)
    nftActorRef.current = actor; 

    const [name, owner, imageData] = await Promise.all([
      actor.getName(),
      actor.getOwner(),
      actor.getAsset(),
    ]);

    const imageContent = new Uint8Array(imageData);
    const image = URL.createObjectURL(new Blob([imageContent.buffer], { type: "image/png" }));

    setNftData({ name, owner: owner.toText(), image });

    if (props.role == "collection") {
       // 2. Safely convert to Principal for the backend call
      const nftPrincipal = typeof props.id === "string" 
        ? Principal.fromText(props.id) 
        : props.id;

       // FIX: Convert props.id (string) to Principal
      const nftIsListed = await opend_backend.isListed(nftPrincipal); 

      if (nftIsListed) {
        setNftData(prev => ({
          ...prev,
          owner: "openD"
        }));
        setBlur({ filter: "blur(4px)" });
        setSellStatus("Listed");
      } else {
        setButton(<Button handleClick={handleSell} text="Sell" />);
      }
    } else if (props.role == "discover") {
      // FIX 3: Pass the Principal object here
      const originalOwner = await opend_backend.getOriginalOwner(nftPrincipal);
      if (originalOwner.toText() !== CURRENT_USER_ID.toText()) {
        setButton(<Button handleClick={handleBuy} text="Buy" />);
      }

      const price = await opend_backend.getListedNFTPrice(nftPrincipal);
      setPriceLabel(<PriceLabel sellPrice={price.toString()} />);
    }
  }

  useEffect(() => {
    loadNFT();
    // Cleanup function to free memory when component unmounts
    return () => {
      if (nftData.image) URL.revokeObjectURL(nftData.image);
    };
  }, []);

  let price;
  function handleSell() {
    setPriceInput(
      <input
        placeholder="Price in DEM"
        type="number"
        className="price-input"
        onChange={(e) => (window.priceTemp = e.target.value)} // Temporary storage for demo/simplicity
      />
    );
    setButton(<Button handleClick={sellItem} text="Confirm" />)
  }

  async function sellItem() {
    setBlur({ filter: "blur(4px)" });
    setLoaderHidden(false);
    const priceToSell = window.priceTemp;

     // FIX 4: Safety check before calling fromText
    const nftPrincipal = typeof props.id === "string" ? Principal.fromText(props.id) : props.id;
    const listingResult = await opend_backend.listItem(nftPrincipal, BigInt(priceToSell));
    
    if (listingResult === "Success") {
      const openDId = await opend_backend.getOpenDCanisterID();
      
      // 4. Access the actor via the .current property of the Ref
      if (nftActorRef.current) {
        // Use openDId directly as it is already a Principal
        const transferResult = await nftActorRef.current.transferOwnership(openDId);
        
        if (transferResult === "Success") {
          setLoaderHidden(true);
          setButton();
          setPriceInput();
          setNftData(prev => ({ ...prev, owner: "OpenD" }));
          setSellStatus("Listed");
        }
      } else {
        console.error("NFT Actor not initialized.");
        setLoaderHidden(true);
      }
    }
  }

  async function handleBuy() {
    console.log("Buy was triggered");
    setLoaderHidden(false);
    const dtokenActor = await Actor.createActor(dtokenIdlFactory, {
      agent,
      canisterId: Principal.fromText("uxrrr-q7777-77774-qaaaq-cai"),
    });
    const sellerId = await opend_backend.getOriginalOwner(props.id);
    const itemPrice = await opend_backend.getListedNFTPrice(props.id);

    const result = await dtokenActor.transfer(sellerId, itemPrice);
    if (result == "Success") {
      const transferResult = await opend_backend.completePurchase(props.id, sellerId, CURRENT_USER_ID);
      console.log("Purchase: ", transferResult);
      setLoaderHidden(true);
      setDisplay(false);
    };
  }

  return (
    <div style={{display: shouldDisplay ? "inline" : "none"}} className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={nftData.image}
          style={blur}
        />
        <div hidden={loaderHidden} className="lds-ellipsis">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="disCardContent-root">
          {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {nftData.name}<span className="purple-text"> {sellStatus}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {nftData.owner}
          </p>
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;

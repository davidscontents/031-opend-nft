import React, { useEffect, useState } from "react";
import logo from "/logo.png";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/nft";
import { Principal } from "@dfinity/principal";

function Item(props) {
  const id = Principal.fromText(props.id);
  const localHost = "http://localhost:3000/";
  const agent = new HttpAgent({host: localHost});
  const [name, setName] = useState();
  const [owner, setOwner] = useState();
  const [imageURL, setImageURL] = useState();

  async function loadNFT() {
    // Fetch Root Key for local dev (fixes the TrustError)
    if (process.env.NODE_ENV !== "production") {
      await agent.fetchRootKey();
    }

    const NFTActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: id,
    });

    // This block to allow local certificate verification
    if (process.env.NODE_ENV !== "production") {
      await agent.fetchRootKey().catch((err) => {
        console.warn("Unable to fetch root key. Check if your local replica is running.");
        console.error(err);
      });
    }

    const name = await NFTActor.getName();
    const owner = await NFTActor.getOwner();
    const imageData = await NFTActor.getAsset();
    console.log(imageData);
    const imageContent = new Uint8Array(imageData);
    console.log(imageContent);
    const image = URL.createObjectURL(new Blob ([imageContent.buffer], {type: "image/png"}));

    setName(name);
    setOwner(owner.toText());
    setImageURL(image);
    console.log("image:", image," / imageURL:", imageURL);
  }

  useEffect(() => {
      loadNFT();
  }, []);

  return (
    <div className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={imageURL}
        />
        <div className="disCardContent-root">
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text"></span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Item;

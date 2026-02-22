import Principal "mo:base/Principal";
import ExperimentalCycles "mo:base/ExperimentalCycles";
import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import NFTActorClass "../NFT/nft";
import List "mo:base/List";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Error "mo:base/Error";

persistent actor OpenD {
    // 1. Define a local type alias for the NFT actor interface to avoid scoping issues
    type NFT = NFTActorClass.NFT;

    private type Listing = {
        itemOwner : Principal;
        itemPrice : Nat;
    };

    // Use the local type 'NFT'
    transient var mapOfNFTs = HashMap.HashMap<Principal, NFT>(1, Principal.equal, Principal.hash);
    transient var mapOfOwners = HashMap.HashMap<Principal, List.List<Principal>>(1, Principal.equal, Principal.hash);
    transient var mapOfListings = HashMap.HashMap<Principal, Listing>(1, Principal.equal, Principal.hash);

    // 2. IMPORTANT: Actors are NOT stable. Store Principals instead.
    stable var stableNFTPrincipals : [Principal] = [];
    stable var stableOwners : [(Principal, [Principal])] = [];
    stable var stableListings : [(Principal, Listing)] = [];

    // 3. Save state before upgrade
    system func preupgrade() {
        stableNFTPrincipals := Iter.toArray(mapOfNFTs.keys());

        stableOwners := Array.map<(Principal, List.List<Principal>), (Principal, [Principal])>(
            Iter.toArray(mapOfOwners.entries()),
            func(x) = (x.0, List.toArray(x.1)),
        );

        stableListings := Iter.toArray(mapOfListings.entries());
    };

    // 4. Restore state after upgrade
    system func postupgrade() {
        for (p in stableNFTPrincipals.vals()) {
            // Re-wrap the Principal into the actor type
            let nftActor : NFT = actor (Principal.toText(p));
            mapOfNFTs.put(p, nftActor);
        };

        for ((k, v) in stableOwners.vals()) {
            mapOfOwners.put(k, List.fromArray(v));
        };

        for ((k, v) in stableListings.vals()) {
            mapOfListings.put(k, v);
        };

        // Clear stable vars to save memory
        stableNFTPrincipals := [];
        stableOwners := [];
        stableListings := [];
    };

    public shared (msg) func mint(imgData : [Nat8], name : Text) : async Principal {
        let owner : Principal = msg.caller;

        // Define the amount of cycles needed to create the NFT canister
        // 200_000_000_000 (200B) is usually sufficient for local creation and storage
        let cyclesToAttach = 2_000_000_000_000;

        // Safety Check: Only add cycles if our current balance allows it
        let currentBalance = ExperimentalCycles.balance();

        // Ensure we don't drain the backend below a safety threshold (e.g. 1T)
        let safetyReserve = 1_000_000_000_000;
        if (currentBalance < cyclesToAttach + safetyReserve) {
            throw Error.reject("Backend canister is low on cycles. Please top up.");
        };

        // Attach cycles and create canister
        ExperimentalCycles.add(cyclesToAttach);
        let newNFT = await NFTActorClass.NFT(name, owner, imgData);

        let newNFTPrincipal = Principal.fromActor(newNFT);
        mapOfNFTs.put(newNFTPrincipal, newNFT);
        addToOwnershipMap(owner, newNFTPrincipal);

        return newNFTPrincipal;
    };

    private func addToOwnershipMap(owner : Principal, nftId : Principal) {
        let ownedNFTs = switch (mapOfOwners.get(owner)) {
            case null List.nil<Principal>();
            case (?result) result;
        };
        mapOfOwners.put(owner, List.push(nftId, ownedNFTs));
    };

    public query func getOwnedNFTs(user : Principal) : async [Principal] {
        let userNFTs = switch (mapOfOwners.get(user)) {
            case null List.nil<Principal>();
            case (?result) result;
        };
        return List.toArray(userNFTs);
    };

    public query func getListedNFTs() : async [Principal] {
        let ids = Iter.toArray(mapOfListings.keys());
        return ids;
    };

    public shared (msg) func listItem(id : Principal, price : Nat) : async Text {
        let item = switch (mapOfNFTs.get(id)) {
            case null return "NFT does not exist";
            case (?result) result;
        };

        let owner = await item.getOwner();
        if (Principal.equal(owner, msg.caller)) {
            mapOfListings.put(id, { itemOwner = owner; itemPrice = price });
            return "Success";
        } else {
            return "You don't own the NFT";
        };
    };

    public query func getOpenDCanisterID() : async Principal {
        return Principal.fromActor(OpenD);
    };

    public query func isListed(id : Principal) : async Bool {
        if (mapOfListings.get(id) == null) {
            return false;
        } else {
            return true;
        };
    };

    public query func getOriginalOwner(id : Principal) : async Principal {
        var listing : Listing = switch (mapOfListings.get(id)) {
            case null return Principal.fromText("");
            case (?result) result;
        };

        return listing.itemOwner;
    };

    public query func getListedNFTPrice(id : Principal) : async Nat {
        var listing : Listing = switch (mapOfListings.get(id)) {
            case null return 0;
            case (?result) result;
        };

        return listing.itemPrice;
    };

    public shared (msg) func completePurchase(id : Principal, ownerId : Principal, newOwnerId : Principal) : async Text {
        var purchasedNFT : NFTActorClass.NFT = switch (mapOfNFTs.get(id)) {
            case null return "NFT does not exist";
            case (?result) result;
        };

        let transferResult = await purchasedNFT.transferOwnership(newOwnerId);
        if (transferResult == "Success") {
            mapOfListings.delete(id);
            var ownedNFTs : List.List<Principal> = switch (mapOfOwners.get(ownerId)) {
                case null List.nil<Principal>();
                case (?result) result;
            };
            ownedNFTs := List.filter(
                ownedNFTs,
                func(listItemId : Principal) : Bool {
                    return listItemId != id;
                },
            );
            addToOwnershipMap(newOwnerId, id);
            return "Success";
        } else {
            return transferResult;
        };
    };
};

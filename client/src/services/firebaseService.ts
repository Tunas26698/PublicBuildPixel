import { db } from '../firebaseConfig';
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";

export interface PlayerProfile {
    id: string; // Unique ID (e.g., wallet or uuid, or simpler: name + random)
    name: string;
    spriteUrl: string;
    portraitUrl?: string; // Optional
    createdAt: number;
}

// Save Player Profile
export const savePlayerProfile = async (player: PlayerProfile) => {
    try {
        const playerRef = doc(db, "players", player.id);
        await setDoc(playerRef, player);
        console.log("Player profile saved:", player.id);
        return true;
    } catch (e) {
        console.error("Error saving player profile: ", e);
        return false;
    }
};

// Get Player Profile
export const getPlayerProfile = async (id: string): Promise<PlayerProfile | null> => {
    try {
        const docRef = doc(db, "players", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as PlayerProfile;
        } else {
            console.log("No such player profile!");
            return null;
        }
    } catch (e) {
        console.error("Error getting player profile:", e);
        return null;
    }
};

// Get All Players (Limit to recent/online in future)
export const getAllPlayers = async (): Promise<PlayerProfile[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, "players"));
        const players: PlayerProfile[] = [];
        querySnapshot.forEach((doc) => {
            players.push(doc.data() as PlayerProfile);
        });
        return players;
    } catch (e) {
        console.error("Error getting players:", e);
        return [];
    }
};

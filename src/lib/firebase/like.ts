import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { collection, getDocs } from "firebase/firestore";

export const toggleLike = async (postId: string, uid: string) => {
  const postLikeRef = doc(db, "posts", postId, "likes", uid);
  const userLikeRef = doc(db, "users", uid, "likes", postId);
  const likeSnap = await getDoc(postLikeRef);

  if (likeSnap.exists()) {
    await deleteDoc(postLikeRef);
    await deleteDoc(userLikeRef);
    return false;
  } else {
    await setDoc(postLikeRef, { liked: true });
    await setDoc(userLikeRef, { likedAt: Date.now() });
    return true;
  }
};

export const hasLiked = async (postId: string, uid: string) => {
  const likeRef = doc(db, "posts", postId, "likes", uid);
  const likeSnap = await getDoc(likeRef);
  return likeSnap.exists();
};

export async function getLikeCount(postId: string): Promise<number> {
  const likesRef = collection(db, "posts", postId, "likes");
  const snapshot = await getDocs(likesRef);
  return snapshot.size;
}
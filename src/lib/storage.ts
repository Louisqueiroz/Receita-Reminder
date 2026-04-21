import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "./firebase";

export async function uploadReceitaImage(file: File, index: number): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const timestamp = Date.now();
  const path = `receitas/${user.uid}/${timestamp}-${index}-${file.name}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

"use client";

import { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import type { User } from "@/lib/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        } else {
          // Create user document if it doesn't exist
          const newUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName:
              firebaseUser.displayName ||
              firebaseUser.email?.split("@")[0] ||
              "User",
            photoURL: firebaseUser.photoURL || null, // Change undefined to null
            isAdmin: false,
            createdAt: Date.now(),
          };
          await setDoc(doc(db, "users", firebaseUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update the signUp function to handle errors better
  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      console.log("Starting signup process...");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;
      console.log("User created in Firebase Auth:", firebaseUser.uid);

      // Update profile with display name
      await updateProfile(firebaseUser, { displayName });
      console.log("Profile updated with display name");

      // Create user document
      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName,
        photoURL: firebaseUser.photoURL || null,
        isAdmin: false,
        createdAt: Date.now(),
      };

      console.log("Creating user document in Firestore...");
      await setDoc(doc(db, "users", firebaseUser.uid), newUser);
      console.log("User document created successfully");

      return newUser;
    } catch (error: any) {
      console.error("Error in signUp function:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = googleProvider;
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if user document exists
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "User",
          photoURL: firebaseUser.photoURL || null,
          isAdmin: false,
          createdAt: Date.now(),
        };
        await setDoc(doc(db, "users", firebaseUser.uid), newUser);
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";

export default function FirebaseTestPage() {
  const [authStatus, setAuthStatus] = useState<string>("Not tested");
  const [firestoreStatus, setFirestoreStatus] = useState<string>("Not tested");
  const [error, setError] = useState<string | null>(null);

  const testAuth = async () => {
    try {
      setAuthStatus("Testing...");
      setError(null);

      // Just check if auth is initialized
      if (auth) {
        const currentUser = auth.currentUser;
        setAuthStatus(
          `Auth initialized. ${
            currentUser ? "User is signed in" : "No user is signed in"
          }`
        );
      } else {
        setAuthStatus("Auth not initialized properly");
      }
    } catch (err: any) {
      console.error("Auth test error:", err);
      setAuthStatus("Failed");
      setError(err.message);
    }
  };

  const testFirestore = async () => {
    try {
      setFirestoreStatus("Testing...");
      setError(null);

      // Try to read from Firestore
      const usersQuery = query(collection(db, "users"), limit(1));
      const snapshot = await getDocs(usersQuery);

      setFirestoreStatus(`Firestore working. Found ${snapshot.size} users.`);
    } catch (err: any) {
      console.error("Firestore test error:", err);
      setFirestoreStatus("Failed");
      setError(err.message);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Firebase Connection Test</CardTitle>
          <CardDescription>Test your Firebase connection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">Authentication Status:</p>
            <p
              className={`${
                authStatus.includes("Failed")
                  ? "text-red-500"
                  : authStatus !== "Not tested"
                  ? "text-green-500"
                  : ""
              }`}
            >
              {authStatus}
            </p>
          </div>

          <div>
            <p className="font-medium">Firestore Status:</p>
            <p
              className={`${
                firestoreStatus.includes("Failed")
                  ? "text-red-500"
                  : firestoreStatus !== "Not tested"
                  ? "text-green-500"
                  : ""
              }`}
            >
              {firestoreStatus}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={testAuth}>Test Auth</Button>
          <Button onClick={testFirestore}>Test Firestore</Button>
        </CardFooter>
      </Card>

      <div className="mt-6 text-sm text-gray-500">
        <p>Firebase environment variables:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>
            API Key:{" "}
            {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✓ Set" : "✗ Not set"}
          </li>
          <li>
            Auth Domain:{" "}
            {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
              ? "✓ Set"
              : "✗ Not set"}
          </li>
          <li>
            Project ID:{" "}
            {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
              ? "✓ Set"
              : "✗ Not set"}
          </li>
          <li>
            Storage Bucket:{" "}
            {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
              ? "✓ Set"
              : "✗ Not set"}
          </li>
          <li>
            Messaging Sender ID:{" "}
            {process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
              ? "✓ Set"
              : "✗ Not set"}
          </li>
          <li>
            App ID:{" "}
            {process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "✓ Set" : "✗ Not set"}
          </li>
        </ul>
      </div>
    </div>
  );
}

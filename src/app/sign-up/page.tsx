"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCreateUserWithEmailAndPassword,
  useSendEmailVerification,
} from "react-firebase-hooks/auth";
import { auth, db } from "@/firebase";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, Mail, Lock } from "lucide-react";

import fullLogo from "../../../src/app/images/convo-logo-full.png";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function SignUpPage() {
  const router = useRouter();
  const [createUserWithEmailAndPassword, user, loading, error] =
    useCreateUserWithEmailAndPassword(auth);
  const [sendEmailVerification] = useSendEmailVerification(auth);

  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    username: "",
  });

  const handleSubmit = async () => {
    const { email, password, username } = signupData;
    const result = await createUserWithEmailAndPassword(email, password);
    if (result?.user) {
      await sendEmailVerification();

      // Set displayName in Firebase Auth
      await updateProfile(result.user, {
        displayName: username,
      });

      // Store additional user data in Firestore (optional but recommended)
      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email,
        username,
        createdAt: new Date(),
      });

      router.push("/dashboard");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        {/* Card */}
        <Card className="shadow-lg ring-2 ring-indigo-500/50 hover:ring-indigo-600/70 transition duration-300">
          <CardHeader className="text-center space-y-2">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex items-center justify-center space-x-2"
            >
              <Image src={fullLogo} alt="Convo" width={200} />
            </motion.div>
            <CardTitle className="text-md text-gray-400">
              where event sparks conversations.
            </CardTitle>
            <CardDescription className="text-xl font-bold text-indigo-600">
              Join Convo Today
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={signupData.email}
                  onChange={(e) =>
                    setSignupData({ ...signupData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={signupData.username}
                onChange={(e) =>
                  setSignupData({ ...signupData, username: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter a strong password"
                  className="pl-10"
                  value={signupData.password}
                  onChange={(e) =>
                    setSignupData({ ...signupData, password: e.target.value })
                  }
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">
                {error.message}
              </p>
            )}

            <Button
              className="mt-4 px-6 py-2 w-full cursor-pointer rounded-lg font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Creating account..." : "Sign Up"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              {"Already have an account? "}
              <Link
                href="/sign-in"
                className="text-indigo-600 hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

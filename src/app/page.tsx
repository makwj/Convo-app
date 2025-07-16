"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import Image from "next/image";
import heroImage from "../../src/app/images/hero-image.png";
import fullLogo from "../../src/app/images/convo-logo-full.png";
import { motion } from "framer-motion";

export default function LandingPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (loading) return null;

  return (
    <main className="min-h-screen bg-white flex flex-col relative">
      <header className="absolute top-6 right-6 z-10">
        <Link
          href="/sign-in"
          className="inline-block bg-gradient-to-r from-blue-600 to-indigo-500 text-white text-lg font-medium px-6 py-3 rounded-lg shadow hover:from-blue-700 hover:to-purple-700 transition cursor-pointer"
        >
          Sign In
        </Link>
      </header>

      <section className="flex flex-1 flex-col lg:flex-row items-center justify-between px-8 md:px-20 py-6 gap-8">
        <div className="max-w-xl text-center lg:text-left flex-shrink-0">
          <h1 className="text-4xl md:text-6xl font-bold text-indigo-600 mb-6 leading-tight">
            Plan your next adventure with{" "}
            <span>
              <Image
                src={fullLogo}
                alt="Convo Logo"
                width={300}
                height={200}
                className="inline-block"
              />
            </span>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            From RSVPs to reminders, streamline your event management in one
            powerful platform.
          </p>
          <Link
            href="/sign-up"
            className="inline-block bg-gradient-to-r from-blue-600 to-indigo-500 text-white text-lg font-medium px-6 py-3 rounded-lg shadow hover:from-blue-700 hover:to-purple-700 transition cursor-pointer"
          >
            Get Started
          </Link>
        </div>

        <motion.div
          className="w-full max-w-3xl flex-1"
          initial={{ y: 0 }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative w-full aspect-[4/3]">
            <Image
              src={heroImage}
              alt="Hero"
              fill
              className="object-contain"
              priority
            />
          </div>
        </motion.div>
      </section>
    </main>
  );
}

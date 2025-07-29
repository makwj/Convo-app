"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase";
import Navbar from "../components/navbar";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { MapPin, ChevronRight, Clock, Calendar } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Activity() {
  const [user, loadingAuth] = useAuthState(auth);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<
    "all" | "created" | "joined" | "completed" | "cohosted"
  >("all");

  const router = useRouter();

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push("/sign-in");
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    const fetchUserEvents = async () => {
      try {
        const q = query(collection(db, "events"), orderBy("date"));
        const snapshot = await getDocs(q);

        const eventsWithCreators = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const creatorUid = data.createdBy?.uid || "";
            let creatorUsername = data.createdBy?.username || "";

            if (!creatorUsername && creatorUid) {
              const userDoc = await getDoc(doc(db, "users", creatorUid));
              if (userDoc.exists()) {
                creatorUsername = userDoc.data().username || "";
              }
            }

            return {
              id: docSnap.id,
              ...data,
              createdBy: {
                uid: creatorUid,
                email: data.createdBy?.email || "",
                username: creatorUsername,
              },
            };
          })
        );

        const filtered = eventsWithCreators.filter(
          (event: any) =>
            event.createdBy?.uid === user?.uid ||
            event.attendees?.some((a: any) => a.uid === user?.uid) ||
            event.cohosts?.some((c: any) => c.uid === user?.uid)
        );

        setUserEvents(filtered);
      } catch (error) {
        console.error("Failed to fetch user events:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchUserEvents();
  }, [user]);

  const visibleEvents = userEvents.filter((event) => {
    const isCreator = event.createdBy?.uid === user?.uid;
    const isCoHost = event.cohosts?.some((c: any) => c.uid === user?.uid);
    const isAttendee = event.attendees?.some((a: any) => a.uid === user?.uid);

    if (filterType === "created") return isCreator || isCoHost;
    if (filterType === "cohosted") return isCoHost && !isCreator;
    if (filterType === "joined")
      return (
        event.status !== "completed" && isAttendee && !isCreator && !isCoHost
      );
    if (filterType === "completed") return event.status === "completed";
    return true;
  });

  if (loadingAuth || !user) return null;

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Your Events</h1>

        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filterType === "all"
                ? "bg-indigo-600 text-white"
                : "border border-indigo-600 text-indigo-600 hover:bg-indigo-50 cursor-pointer"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType("created")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filterType === "created"
                ? "bg-indigo-600 text-white"
                : "border border-indigo-600 text-indigo-600 hover:bg-indigo-50 cursor-pointer"
            }`}
          >
            Created
          </button>
          <button
            onClick={() => setFilterType("cohosted")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filterType === "cohosted"
                ? "bg-indigo-600 text-white"
                : "border border-indigo-600 text-indigo-600 hover:bg-indigo-50 cursor-pointer"
            }`}
          >
            Co-hosted
          </button>
          <button
            onClick={() => setFilterType("joined")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filterType === "joined"
                ? "bg-indigo-600 text-white"
                : "border border-indigo-600 text-indigo-600 hover:bg-indigo-50 cursor-pointer"
            }`}
          >
            Joined
          </button>
          <button
            onClick={() => setFilterType("completed")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filterType === "completed"
                ? "bg-indigo-600 text-white"
                : "border border-indigo-600 text-indigo-600 hover:bg-indigo-50 cursor-pointer"
            }`}
          >
            Completed
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-center">Loading your events...</p>
        ) : visibleEvents.length === 0 ? (
          <p className="text-gray-500 text-center">
            No events found for this filter.
          </p>
        ) : (
          <div className="space-y-8">
            {visibleEvents.map((event) => {
              const rawDate = new Date(
                typeof event.date.toDate === "function"
                  ? event.date.toDate()
                  : event.date
              );

              const formattedDate = `${rawDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}, ${rawDate.toLocaleDateString("en-GB", { weekday: "long" })}`;

              const isCreator = event.createdBy?.uid === user?.uid;
              const isCoHost = event.cohosts?.some(
                (c: any) => c.uid === user?.uid
              );

              return (
                <div
                  key={event.id}
                  className="relative flex items-start space-x-8"
                >
                  <div className="relative flex-1 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    {event.status === "completed" && (
                      <div className="absolute top-2 right-2 bg-gray-300 text-gray-700 text-xs font-semibold px-2 py-1 rounded">
                        Completed
                      </div>
                    )}
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <Image
                          src={event.imageUrl || "/placeholder.svg"}
                          alt="Event"
                          width={160}
                          height={120}
                          className="w-40 h-30 object-cover rounded-lg bg-gray-200"
                        />
                      </div>

                      <div className="flex-1 space-y-3">
                        <h3 className="text-xl font-bold text-indigo-600">
                          {event.title}
                        </h3>

                        <div className="text-sm text-gray-500 flex items-center bg-gray-50 p-2 rounded-md w-fit">
                          <Calendar className="inline w-4 h-4 mr-1" />
                          {formattedDate}
                        </div>

                        <div className="text-sm text-gray-500 flex items-center bg-gray-50 p-2 rounded-md w-fit">
                          <Clock className="inline w-4 h-4 mr-1" />
                          {event.startTime} - {event.endTime}
                        </div>

                        <div className="text-sm text-gray-500 flex items-center bg-gray-50 p-2 rounded-md w-fit">
                          <MapPin className="w-4 h-4 mr-1" />
                          {event.location}
                        </div>

                        <p className="text-sm text-gray-500 italic">
                          Created by{" "}
                          <span className="text-md text-indigo-600 font-bold">
                            {event.createdBy?.username ||
                              event.createdBy?.email?.split("@")[0] ||
                              "Unknown"}
                          </span>
                        </p>
                        {isCoHost && !isCreator && (
                          <div className="w-fit bg-blue-300 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                            Co-hosted
                          </div>
                        )}

                        <div className="pt-2">
                          <Button
                            variant="outline"
                            className="text-purple-600 bg-transparent cursor-pointer hover:bg-purple-200 hover:text-purple-700"
                            onClick={() => router.push(`/event/${event.id}`)}
                          >
                            View Event Details
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

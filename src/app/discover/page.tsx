"use client";
import { toast } from "sonner";
import Image from "next/image";
import { MapPin, ChevronRight, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import Navbar from "../components/navbar";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
} from "firebase/firestore";

export default function EventListPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();

  type EventType = {
    id: string;
    date: string;
    day?: string;
    startTime?: string;
    endTime?: string;
    title?: string;
    location?: string;
    imageUrl?: string;
    createdBy?: { uid: string; email?: string; username?: string };
    attendees?: { uid: string; email?: string }[];
  };

  const [events, setEvents] = useState<EventType[]>([]);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push("/sign-in");
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsQuery = query(collection(db, "events"), orderBy("date"));
        const querySnapshot = await getDocs(eventsQuery);

        const fetchedEvents = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const creatorUid = data.createdBy?.uid;
            let creatorUsername = "";

            if (creatorUid) {
              try {
                const userDoc = await getDoc(doc(db, "users", creatorUid));
                if (userDoc.exists()) {
                  creatorUsername = userDoc.data().username || "";
                }
              } catch (err) {
                console.warn("Failed to fetch creator username:", err);
              }
            }

            return {
              id: docSnap.id,
              date: data.date || "",
              day: data.day || "",
              startTime: data.startTime || "",
              endTime: data.endTime || "",
              title: data.title || "",
              location: data.location || "",
              imageUrl: data.imageUrl || "",
              createdBy: {
                uid: creatorUid,
                email: data.createdBy?.email || "",
                username: creatorUsername,
              },
              attendees: data.attendees || [],
            };
          })
        );

        const filteredEvents = fetchedEvents.filter((event) => {
          const isCreator = event.createdBy?.uid === user?.uid;
          const hasJoined = event.attendees?.some((a) => a.uid === user?.uid);
          return !isCreator && !hasJoined;
        });

        setEvents(filteredEvents);

        const joinedIds = fetchedEvents
          .filter((event) => event.attendees?.some((a) => a.uid === user?.uid))
          .map((event) => event.id);

        setJoinedEventIds(joinedIds);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        setLoadingEvents(false);
      }
    };

    if (user) fetchEvents();
  }, [user]);

  const handleJoinEvent = async (eventId: string) => {
    if (!user) {
      alert("Please log in first.");
      return;
    }

    try {
      const eventRef = doc(db, "events", eventId);
      const eventSnap = await getDoc(eventRef);
      const eventData = eventSnap.data();

      if (!eventData) {
        alert("Event not found.");
        return;
      }

      const hasJoined = (eventData.attendees || []).some(
        (a: any) => a.uid === user.uid
      );
      if (hasJoined) {
        alert("You already joined this event.");
        return;
      }

      await updateDoc(eventRef, {
        attendees: arrayUnion({
          uid: user.uid,
          email: user.email,
          joinedAt: new Date().toISOString(),
        }),
      });

      toast("Successfully joined event", { duration: 5000 });
      setJoinedEventIds((prev) => [...prev, eventId]);
    } catch (error) {
      console.error("Error joining event:", error);
      alert("Failed to join event. Try again.");
    }
  };

  if (loadingAuth || !user) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Events</h1>
          </div>

          {loadingEvents ? (
            <p className="text-gray-500 text-center">Loading events...</p>
          ) : error ? (
            <p className="text-red-500 text-center">Error: {error}</p>
          ) : events.length === 0 ? (
            <div className="text-center py-20 border rounded-lg bg-gray-50 shadow-inner">
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                No Events Found
              </h2>
              <p className="text-gray-500">
                There are currently no available events to join.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="relative flex items-start space-x-8"
                >
                  <div className="text-sm text-gray-500">{event.day || ""}</div>

                  <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <Image
                          src={event.imageUrl || "/placeholder.svg"}
                          alt="Event"
                          width={160}
                          height={160}
                          className="w-40 h-30 object-cover rounded-lg bg-gray-200"
                        />
                      </div>

                      <div className="flex-1 space-y-3">
                        <h3 className="text-xl font-bold text-indigo-600">
                          {event.title}
                        </h3>

                        <div className="text-sm text-gray-500 flex items-center bg-gray-50 p-2 rounded-md w-fit p-2">
                          <Calendar className="inline w-4 h-4 mr-1" />
                          {event.date
                            ? new Date(event.date).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })
                            : ""}
                        </div>

                        <div className="text-sm text-gray-500 flex items-center bg-gray-50 p-2 rounded-md w-fit p-2">
                          <Clock className="inline w-4 h-4 mr-1" />
                          {event.startTime} - {event.endTime}
                        </div>

                        <div className="text-sm text-gray-500 flex items-center bg-gray-50 p-2 rounded-md w-fit p-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{event.location}</span>
                        </div>

                        <p className="text-sm text-gray-500 italic">
                          Created by{" "}
                          <span className="text-md text-indigo-600 font-bold">
                            {event.createdBy?.username || "Unknown"}
                          </span>
                        </p>

                        <div className="pt-2 space-y-2">
                          {event.createdBy?.uid === user.uid ? (
                            <Button
                              variant="outline"
                              className="text-gray-600 border-gray-300 bg-transparent"
                              onClick={() => router.push(`/event/${event.id}`)}
                            >
                              Manage Event
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          ) : (
                            <>
                              {joinedEventIds.includes(event.id) ? (
                                <Button
                                  disabled
                                  className="text-white bg-green-500 cursor-default hover:bg-green-500"
                                >
                                  Joined
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  className="mt-4 px-6 py-2 rounded-lg font-medium text-white bg-gradient-to-r cursor-pointer from-blue-600 to-purple-600 hover:text-white hover:from-blue-700 hover:to-purple-700"
                                  onClick={() => handleJoinEvent(event.id)}
                                >
                                  Join Event
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                              )}

                              <Button
                                variant="outline"
                                className="ml-2 text-purple-600 bg-transparent cursor-pointer hover:bg-purple-200 hover:text-purple-700"
                                onClick={() =>
                                  router.push(`/event/${event.id}`)
                                }
                              >
                                View Event Details
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

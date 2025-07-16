"use client";

import { Calendar, CalendarDays, Clock, MapPin } from "lucide-react";
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
  updateDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const formatFullDate = (date: Date) => {
  const day = date.toLocaleDateString("en-MY", { day: "numeric" });
  const month = date.toLocaleDateString("en-MY", { month: "long" });
  const year = date.toLocaleDateString("en-MY", { year: "numeric" });
  const weekday = date.toLocaleDateString("en-MY", { weekday: "long" });
  return `${day} ${month} ${year}, ${weekday}`;
};

export default function Dashboard() {
  const [user, loadingAuth] = useAuthState(auth);
  const [createdEvents, setCreatedEvents] = useState<any[]>([]);
  const [attendedEvents, setAttendedEvents] = useState<any[]>([]);
  const [invitedEvents, setInvitedEvents] = useState<any[]>([]);
  const [upcomingEvent, setUpcomingEvent] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push("/sign-in");
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    if (!user) return;

    const fetchEvents = async () => {
      try {
        const q = query(collection(db, "events"), orderBy("date"));
        const snapshot = await getDocs(q);

        const created: any[] = [];
        const attended: any[] = [];
        const invited: any[] = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const event = { id: docSnap.id, ...data };

          if (data.createdBy?.uid) {
            const userDoc = await getDoc(doc(db, "users", data.createdBy.uid));
            if (userDoc.exists()) {
              event.createdBy.username = userDoc.data().username || "Unknown";
            }
          }

          if (data.createdBy?.uid === user.uid) {
            created.push(event);
          }

          if (
            Array.isArray(data.attendees) &&
            data.attendees.some((a: any) => a.uid === user.uid)
          ) {
            attended.push(event);
          }

          if (
            Array.isArray(data.invited) &&
            data.invited.some((i: any) => i.uid === user.uid)
          ) {
            invited.push(event);
          }
        }

        setCreatedEvents(created);
        setAttendedEvents(attended);
        setInvitedEvents(invited);

        const allUpcoming = [...created, ...attended]
          .filter((e) => e.status !== "completed")
          .sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
            const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
            return dateA.getTime() - dateB.getTime();
          });

        setUpcomingEvent(allUpcoming[0] || null);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, [user]);

  const handleAcceptInvitation = async (eventId: string, event: any) => {
    const eventRef = doc(db, "events", eventId);
    const updatedInvited = event.invited.filter(
      (i: any) => i.uid !== user?.uid
    );
    const updatedAttendees = [
      ...(event.attendees || []),
      {
        uid: user?.uid,
        email: user?.email,
        username: user?.displayName || user?.email?.split("@")[0],
        joinedAt: new Date().toISOString(),
        attended: false,
      },
    ];
    await updateDoc(eventRef, {
      invited: updatedInvited,
      attendees: updatedAttendees,
    });
    setInvitedEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  if (loadingAuth || !user) return null;

  const getRoleBadge = (event: any) => {
    if (event.createdBy?.uid === user.uid) {
      return (
        <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">
          Hosting
        </span>
      );
    } else if (event.attendees?.some((a: any) => a.uid === user.uid)) {
      return (
        <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
          Attending
        </span>
      );
    }
    return null;
  };

  return (
    <>
      <Navbar />
      <main className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">
          Welcome back, {user.displayName || "User"}!
        </h1>

        {upcomingEvent && (
          <div className="relative bg-white border rounded-xl overflow-hidden shadow-md mb-6 transition hover:shadow-lg hover:border-indigo-600 border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 h-full">
              <div className="h-40 md:h-full w-full">
                <img
                  src={upcomingEvent.imageUrl || "/placeholder.svg"}
                  alt="Event"
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="col-span-2 p-6 flex flex-col justify-between bg-gray-50">
                <div>
                  <h2 className="text-xl font-semibold text-indigo-700 mb-2">
                    Your Upcoming Event
                  </h2>
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                    {upcomingEvent.title}
                    {getRoleBadge(upcomingEvent)}
                  </h3>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3 bg-gray-100 p-4 rounded-lg shadow-sm">
                      <CalendarDays className="w-6 h-6 text-indigo-600 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500 font-bold">Date</p>
                        <p className="text-base text-gray-800 font-semibold">
                          {formatFullDate(
                            upcomingEvent.date?.toDate?.() ||
                              new Date(upcomingEvent.date)
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-gray-100 p-4 rounded-lg shadow-sm">
                      <Clock className="w-6 h-6 text-indigo-600 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500 font-bold">
                          Start Time
                        </p>
                        <p className="text-base text-gray-800 font-semibold">
                          {upcomingEvent.startTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-gray-100 p-4 rounded-lg shadow-sm">
                      <Clock className="w-6 h-6 text-indigo-600 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500 font-bold">
                          End Time
                        </p>
                        <p className="text-base text-gray-800 font-semibold">
                          {upcomingEvent.endTime}
                        </p>
                      </div>
                    </div>
                  </div>

                  {upcomingEvent.createdBy?.username && (
                    <p className="text-sm mt-4 text-gray-500 italic bg-gray-200 p-2 rounded-lg w-fit">
                      Hosted by{" "}
                      <span className="font-bold text-md text-indigo-500">
                        {upcomingEvent.createdBy.username}
                      </span>
                    </p>
                  )}
                </div>
                <div
                  onClick={() => router.push(`/event/${upcomingEvent.id}`)}
                  className="self-end mt-4 text-indigo-600 flex items-center gap-1 text-sm font-medium cursor-pointer"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        )}

        {invitedEvents.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-indigo-700">
              Your Invitations{" "}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invitedEvents.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg bg-white shadow-md overflow-hidden"
                >
                  <img
                    src={event.imageUrl || "/placeholder.svg"}
                    alt="Event"
                    className="w-full h-80 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-indigo-600 mb-2">
                      {event.title}
                    </h3>
                    <div className="text-sm text-gray-500 flex items-center bg-gray-50 p-2 rounded-md w-fit p-2 mb-1">
                      <Calendar className="inline w-4 h-4 mr-1" />
                      {formatFullDate(
                        event.date?.toDate?.() || new Date(event.date)
                      )}
                    </div>

                    <div className="text-sm text-gray-500 flex items-center bg-gray-50 p-2 rounded-md w-fit p-2 mb-1">
                      <Clock className="inline w-4 h-4 mr-1" />
                      {event.startTime} - {event.endTime}
                    </div>

                    <div className="text-sm text-gray-500 flex items-center bg-gray-50 p-2 rounded-md w-fit p-2 mb-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {event.location}
                    </div>

                    <div className="flex justify-between items-center">
                      <Button
                        onClick={() => handleAcceptInvitation(event.id, event)}
                        className="mt-4 px-6 py-2 rounded-lg font-medium text-white bg-gradient-to-r cursor-pointer from-blue-600 to-purple-600 hover:text-white hover:from-blue-700 hover:to-purple-700"
                      >
                        Accept Invitation
                      </Button>
                      <button
                        onClick={() => router.push(`/event/${event.id}`)}
                        className="text-sm text-indigo-600 bg-gray-100 p-2 rounded-lg hover:bg-gray-200 mt-4 cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mb-6 flex justify-end">
          <Button
            variant="outline"
            className="text-indigo-700 border-indigo-300 hover:bg-indigo-700 hover:text-white cursor-pointer"
            onClick={() => router.push("/your-events")}
          >
            See All Upcoming Events
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <p className="text-2xl font-bold">{createdEvents.length}</p>
            <p className="text-sm text-gray-500">Events Created</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <p className="text-2xl font-bold">{attendedEvents.length}</p>
            <p className="text-sm text-gray-500">Events Attended</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <p className="text-2xl font-bold">{invitedEvents.length}</p>
            <p className="text-sm text-gray-500">Events Invited To</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-lg shadow text-white mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold mb-1">
                Got something planned?
              </h2>
              <p className="text-sm opacity-90">
                Host your own event and invite people to join. Start organizing
                now!
              </p>
            </div>
            <Button
              onClick={() => router.push("/create-event")}
              className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold px-6 py-2 rounded-md cursor-pointer"
            >
              + Create Event
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}

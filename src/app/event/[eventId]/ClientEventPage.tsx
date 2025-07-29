"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  arrayUnion,
  arrayRemove,
  query,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Pencil,
  LogOut,
  Check,
  UserPlus,
} from "lucide-react";
import { auth, db } from "@/firebase";
import Navbar from "../../components/navbar";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ClientEventPage({
  event,
  eventId,
}: {
  event: any;
  eventId: string;
}) {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [attendees, setAttendees] = useState(event.attendees || []);
  const [hasJoined, setHasJoined] = useState(false);
  const [status, setStatus] = useState(event.status || "upcoming");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [inviteSearch, setInviteSearch] = useState("");
  const [cohosts, setCohosts] = useState(event.cohosts || []);
  const [cohostSearch, setCohostSearch] = useState("");
  const [showCohostModal, setShowCohostModal] = useState(false);
  const remainingSlots = Number(event.capacity) - attendees.length;
  const isCreator = user?.uid === event.createdBy?.uid;
  const isCohost = cohosts.some((c: any) => c.uid === user?.uid);
  const canManage = isCreator || isCohost;

  const filteredCohostUsers = allUsers.filter(
    (u) =>
      u.email.toLowerCase().includes(cohostSearch.toLowerCase()) &&
      u.uid !== user?.uid &&
      !cohosts.some((c: any) => c.uid === u.uid)
  );

  const handleDeleteEvent = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this event?"
    );
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "events", eventId));
      toast.success("Event deleted successfully.");
      router.push("/your-events");
    } catch (error) {
      toast.error("Failed to delete event.");
      console.error("Delete failed:", error);
    }
  };

  useEffect(() => {
    if (user) {
      const alreadyJoined = attendees.some((a: any) => a.uid === user.uid);
      setHasJoined(alreadyJoined);
    }
  }, [user, attendees]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      setAllUsers(snapshot.docs.map((doc) => ({ ...doc.data(), uid: doc.id })));
    };
    fetchUsers();
  }, []);

  const updateEventField = async (updatedFields: any) => {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, updatedFields);
  };

  const handleInviteCohost = async (u: any) => {
    const cohostInfo = {
      uid: u.uid,
      email: u.email,
      username: u.username || u.email.split("@")[0],
    };

    if (cohosts.some((c: any) => c.uid === cohostInfo.uid)) {
      toast.error("User is already a co-host.");
      return;
    }

    try {
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, {
        cohosts: arrayUnion(cohostInfo),
      });

      setCohosts((prev) => [...prev, cohostInfo]);
      toast.success("Co-host invited!");
      setShowCohostModal(false);
    } catch (err) {
      console.error("Error inviting co-host:", err);
      toast.error("Failed to invite co-host.");
    }
  };

  const handleRemoveCohost = async (cohost: any) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${
        cohost.username || cohost.email?.split("@")[0]
      } as a co-host?`
    );
    if (!confirmed) return;

    try {
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, {
        cohosts: arrayRemove(cohost),
      });

      setCohosts((prev) => prev.filter((c: any) => c.uid !== cohost.uid));
      toast.success("Co-host removed.");
    } catch (err) {
      console.error("Error removing co-host:", err);
      toast.error("Failed to remove co-host.");
    }
  };

  const handleInviteUser = async (userToInvite: any) => {
    if (!event.invited?.some((u: any) => u.uid === userToInvite.uid)) {
      const updatedInvited = [...(event.invited || []), userToInvite];
      await updateEventField({ invited: updatedInvited });
      toast.success(`${userToInvite.email} invited!`);
    } else {
      toast.error("User already invited.");
    }
  };

  const handleJoinEvent = async () => {
    if (!user) return toast.error("Please log in to join the event.");

    const confirmed = window.confirm(
      "Are you sure you want to join this event?"
    );
    if (!confirmed) return;

    const eventRef = doc(db, "events", eventId);
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) return toast.error("Event no longer exists.");

    const data = eventSnap.data();
    const currentAttendees = data?.attendees || [];

    if (currentAttendees.length >= Number(data.capacity))
      return toast.error("This event is full.");
    if (currentAttendees.some((a: any) => a.uid === user.uid))
      return toast.error("You already joined.");

    const updated = [
      ...currentAttendees,
      {
        uid: user.uid,
        email: user.email,
        username: user.displayName || user.email?.split("@")[0],
        joinedAt: new Date().toISOString(),
        attended: false,
      },
    ];
    await updateEventField({ attendees: updated });
    setAttendees(updated);
    setHasJoined(true);
    toast.success("You joined the event!");
  };

  const handleLeaveEvent = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to leave this event?"
    );
    if (!confirmed) return;

    const updated = attendees.filter((a: any) => a.uid !== user.uid);
    await updateEventField({ attendees: updated });
    setAttendees(updated);
    setHasJoined(false);
    toast.success("You left the event.");
  };

  const handleEdit = () => {
    window.location.href = `/event/${eventId}/edit`;
  };

  const handleRemoveAttendee = async (uid: string) => {
    const updated = attendees.filter((a: any) => a.uid !== uid);
    await updateEventField({ attendees: updated });
    setAttendees(updated);
    toast.success("Attendee removed.");
  };

  const handleToggleAttendance = async (uid: string) => {
    const updated = attendees.map((a: any) =>
      a.uid === uid ? { ...a, attended: !a.attended } : a
    );
    await updateEventField({ attendees: updated });
    setAttendees(updated);
    toast.success("Attendance updated.");
  };

  const handleMarkAsCompleted = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to mark this event as completed?"
    );
    if (!confirmed) return;

    await updateEventField({ status: "completed" });
    setStatus("completed");
    toast.success("Event marked as completed.");
  };

  const hostDisplay =
    isCreator && user
      ? "You"
      : `${
          event.createdBy?.username || event.createdBy?.email?.split("@")[0]
        } (${event.createdBy?.email})`;

  const filteredUsers = allUsers.filter(
    (u) =>
      u.email.toLowerCase().includes(inviteSearch.toLowerCase()) &&
      u.uid !== user?.uid &&
      !attendees.some((a) => a.uid === u.uid)
  );

  const rawDate = new Date(
    typeof event.date.toDate === "function" ? event.date.toDate() : event.date
  );

  const formattedDate = `${rawDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })}, ${rawDate.toLocaleDateString("en-GB", { weekday: "long" })}`;

  return (
    <>
      <Navbar />

      {canManage && (
        <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
          <DialogTrigger asChild>
            <button
              className="fixed bottom-6 right-6 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 cursor-pointer transition"
              title="Invite Users"
            >
              <UserPlus className="w-6 h-6" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogTitle>Invite Users</DialogTitle>
            <input
              type="text"
              placeholder="Search by email..."
              value={inviteSearch}
              onChange={(e) => setInviteSearch(e.target.value)}
              className="w-full px-4 py-2 mt-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="mt-4 max-h-64 overflow-y-auto">
              {filteredUsers.length > 0 ? (
                <ul className="space-y-2">
                  {filteredUsers.map((u) => (
                    <li
                      key={u.uid}
                      className="flex justify-between items-center border-b pb-2"
                    >
                      <div>
                        <p className="font-medium">
                          {u.username || u.email?.split("@")[0]}
                        </p>
                        <p className="text-sm text-gray-600">{u.email}</p>
                      </div>
                      <button
                        onClick={() => handleInviteUser(u)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm cursor-pointer transition"
                      >
                        Invite
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No users found.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <main className="relative max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-xl shadow-md mt-8 border">
        {canManage && (
          <button
            onClick={handleEdit}
            title="Edit Event"
            className="absolute top-4 right-4 text-gray-600 hover:text-indigo-800 transition cursor-pointer"
          >
            <Pencil className="w-5 h-5" />
          </button>
        )}

        <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
          <img
            src={event.imageUrl || "/placeholder.svg"}
            alt="Event"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-indigo-700">{event.title}</h1>
          {isCreator && (
            <Dialog open={showCohostModal} onOpenChange={setShowCohostModal}>
              <DialogTrigger asChild>
                <button
                  onClick={() => setShowCohostModal(true)}
                  className="cursor-pointer mt-4 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  <UserPlus className="w-4 h-4" /> Invite Co-Host
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogTitle>Invite Co-Host</DialogTitle>
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={cohostSearch}
                  onChange={(e) => setCohostSearch(e.target.value)}
                  className="w-full px-4 py-2 mt-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="mt-4 max-h-64 overflow-y-auto">
                  {filteredCohostUsers.length > 0 ? (
                    <ul className="space-y-2">
                      {filteredCohostUsers.map((u) => (
                        <li
                          key={u.uid}
                          className="flex justify-between items-center border-b pb-2"
                        >
                          <div>
                            <p className="font-medium">
                              {u.username || u.email?.split("@")[0]}
                            </p>
                            <p className="text-sm text-gray-600">{u.email}</p>
                          </div>
                          <button
                            onClick={() => handleInviteCohost(u)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm cursor-pointer transition"
                          >
                            Invite
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No users found.</p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}

          <p className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-1" /> {formattedDate}
          </p>
          <p className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-1" /> {event.startTime} -{" "}
            {event.endTime}
          </p>
          <p className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-1" /> {event.location}
          </p>
          <p className="text-gray-700">
            <strong>Description:</strong>{" "}
            {event.description || "No description provided"}
          </p>
          <p className="text-sm font-medium text-green-700 bg-green-100 px-3 py-1 rounded inline-block">
            Host: {hostDisplay}
          </p>
          {cohosts.length > 0 && (
            <p className="text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1 rounded inline-block mt-2">
              Co-hosts:{" "}
              {cohosts.map((c: any) => c.username || c.email).join(", ")}
            </p>
          )}
          <p className="text-gray-700 flex items-center">
            <Users className="w-4 h-4 mr-1" />
            Capacity: {event.capacity}
            <span className="ml-2 text-red-600 text-sm bg-red-100 px-2 py-1 rounded">
              {remainingSlots <= 0 ? "Full" : `${remainingSlots} slots left!`}
            </span>
          </p>
          {status === "completed" && (
            <p className="text-green-600 font-semibold">
              This event is completed.
            </p>
          )}
          {!isCreator &&
            !isCohost &&
            (hasJoined ? (
              <div className="flex items-center gap-4">
                <button
                  disabled
                  className="px-6 py-2 rounded-lg font-medium text-white bg-green-500 cursor-default"
                >
                  You’ve joined this event
                </button>
                <button
                  onClick={handleLeaveEvent}
                  className="flex items-center gap-1 bg-red-200 p-2 rounded-lg text-red-600 hover:text-white hover:bg-red-600 text-sm cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Leave Event?
                </button>
              </div>
            ) : attendees.length >= Number(event.capacity) ? (
              <button
                disabled
                className="mt-4 px-6 py-2 rounded-lg font-medium text-white bg-red-400 cursor-not-allowed"
              >
                Event Full
              </button>
            ) : (
              <button
                onClick={handleJoinEvent}
                className="mt-4 px-6 py-2 rounded-lg font-medium text-white bg-gradient-to-r cursor-pointer from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Join Event
              </button>
            ))}

          {canManage && status !== "completed" && (
            <>
              <button
                onClick={handleMarkAsCompleted}
                className="text-sm text-white bg-green-600 px-4 py-2 rounded-md cursor-pointer hover:bg-green-700 mt-2"
              >
                Mark as Completed
              </button>
              {isCreator && (
                <button
                  onClick={handleDeleteEvent}
                  className="ml-2 text-sm text-white bg-red-600 px-4 py-2 rounded-md mt-2 hover:bg-red-700 cursor-pointer"
                >
                  Delete Event
                </button>
              )}
            </>
          )}
        </div>
      </main>

      <section className="max-w-6xl mx-auto p-6 mt-8 bg-white rounded-xl shadow-md border">
        <h2 className="text-2xl font-semibold mb-4 text-indigo-700">
          Host and Co-hosts
        </h2>
        <ul className="space-y-2">
          <li className="flex items-center justify-between text-gray-700 border-b py-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-medium">
                {event.createdBy?.username ||
                  event.createdBy?.email?.split("@")[0]}
                {isCreator && " (You)"}
              </span>
              <span className="text-sm bg-green-100 text-black px-2 py-1 rounded">
                {event.createdBy?.email}
              </span>
            </div>
            <span className="text-sm text-green-700 font-medium">Host</span>
          </li>
          {cohosts.map((c: any, i: number) => (
            <li
              key={i}
              className="flex items-center justify-between text-gray-700 border-b py-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-medium">
                  {c.username || c.email?.split("@")[0]}
                  {c.uid === user?.uid && " (You)"}
                </span>
                <span className="text-sm bg-blue-100 text-black px-2 py-1 rounded">
                  {c.email}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-700 font-medium">
                  Co-host
                </span>
                {isCreator && (
                  <button
                    onClick={() => handleRemoveCohost(c)}
                    className="text-sm px-2 py-1 rounded-md border text-red-600 hover:bg-red-100 cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="max-w-6xl mx-auto p-6 mt-8 bg-white rounded-xl shadow-md border">
        <h2 className="text-2xl font-semibold mb-4 text-indigo-700">
          Attendees
        </h2>
        {attendees.length === 0 ? (
          <p className="text-gray-500">No attendees yet.</p>
        ) : (
          <ul className="space-y-2">
            {attendees.map((a: any, i: number) => (
              <li
                key={i}
                className="flex items-center justify-between text-gray-700 border-b py-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-medium">
                    {a.uid === user?.uid && canManage
                      ? "You"
                      : a.username || a.email?.split("@")[0]}
                  </span>
                  <span className="text-sm bg-indigo-100 text-black px-2 py-1 rounded">
                    {a.email}
                  </span>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleAttendance(a.uid)}
                      className="text-sm px-2 py-1 rounded-md border text-blue-600 hover:bg-blue-100 cursor-pointer"
                    >
                      {a.attended ? (
                        <>
                          <Check className="w-4 h-4 inline" /> Attended
                        </>
                      ) : (
                        "Mark Attended"
                      )}
                    </button>
                    <button
                      onClick={() => handleRemoveAttendee(a.uid)}
                      className="text-sm px-2 py-1 rounded-md border text-red-600 hover:bg-red-100 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

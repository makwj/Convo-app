import { adminDb } from "@/lib/firebaseAdmin";
import EditEventForm from "./EditEventForm";

interface EditEventPageProps {
  params: { eventId: string };
}

function convertToISOString(date: any): string | null {
  if (!date) return null;
  if (typeof date === "string") return date;
  if (typeof date.toDate === "function") return date.toDate().toISOString();
  if (date instanceof Date) return date.toISOString();
  return null;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { eventId } = params;
  const docRef = adminDb.collection("events").doc(eventId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) return <div>Event not found</div>;

  const event = docSnap.data();

  return (
    <EditEventForm
      event={{
        ...event,
        createdAt: convertToISOString(event.createdAt),
        attendees: event.attendees || [],
        createdBy: event.createdBy || null,
      }}
      eventId={eventId}
    />
  );
}

import { adminDb } from "@/lib/firebaseAdmin";
import ClientEventPage from "./ClientEventPage";

interface EventDetailsPageProps {
  params: { eventId: string };
}

function convertTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (typeof obj.toDate === "function") {
    return obj.toDate();
  }

  const newObj: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    newObj[key] = convertTimestamps(obj[key]);
  }
  return newObj;
}

export default async function EventDetailsPage({
  params,
}: EventDetailsPageProps) {
  const { eventId } = params;

  const docRef = adminDb.collection("events").doc(eventId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) return <div>Event not found</div>;

  const event = docSnap.data();

  if (!event) {
    return <div>Event data is missing</div>;
  }

  const safeEvent = convertTimestamps(event);

  return <ClientEventPage event={safeEvent} eventId={eventId} />;
}

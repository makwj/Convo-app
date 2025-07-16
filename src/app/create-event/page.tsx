"use client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  MapPin,
  Clock,
  Users,
  FileText,
} from "lucide-react";
import { auth, db, storage } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import Navbar from "../components/navbar";

export default function CreateEventPage() {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [capacity, setCapacity] = useState("100");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(
    null
  );
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      console.log(
        "Selected file:",
        file.name,
        "Size:",
        file.size,
        "Type:",
        file.type
      );

      setImageFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setEventImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setEventImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImageToFirebase = async (file: File): Promise<string> => {
    try {
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(2)}_${file.name}`;
      const imageRef = ref(storage, `eventImages/${fileName}`);

      console.log("Uploading image to:", imageRef.fullPath);

      const snapshot = await uploadBytes(imageRef, file);
      console.log("Upload successful:", snapshot.metadata);

      const downloadURL = await getDownloadURL(imageRef);
      console.log("Download URL:", downloadURL);

      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Failed to upload image");
    }
  };

  const handleCreateEvent = async () => {
    if (!user) {
      toast.error("Please log in to create an event.");
      return;
    }

    if (!eventTitle || !eventDate || !startTime || !endTime || !location) {
      toast.warning("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Creating event...");

    try {
      let imageUrl = "";

      // Upload image if one is selected
      if (imageFile) {
        try {
          toast.loading("Uploading image...", { id: toastId });
          imageUrl = await uploadImageToFirebase(imageFile);
          console.log("Image uploaded successfully:", imageUrl);
        } catch (error) {
          console.error("Image upload failed:", error);
          toast.error("Failed to upload image. Creating event without image.", {
            id: toastId,
          });
        }
      }

      toast.loading("Creating event...", { id: toastId });

      const eventData = {
        title: eventTitle,
        date: eventDate,
        startTime,
        endTime,
        location,
        description,
        capacity: parseInt(capacity),
        imageUrl,
        createdAt: Timestamp.now(),
        createdBy: {
          uid: user.uid,
          email: user.email,
        },
        attendees: [],
      };

      console.log("Creating event with data:", eventData);

      const eventRef = await addDoc(collection(db, "events"), eventData);

      toast.success("Event created successfully!", {
        id: toastId,
        description: "Redirecting to event details...",
      });

      console.log("New event ID:", eventRef.id);

      setTimeout(() => {
        router.push(`/event/${eventRef.id}`);
      }, 1000);
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event. Please try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <main className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">
            Create an Event
          </h1>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 bg-gray-50 border-r border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-blue-600" /> Event Image
                </h3>
                <div className="relative">
                  {eventImagePreview ? (
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                      <img
                        src={eventImagePreview}
                        alt="Event preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-[4/3] bg-white border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg flex items-center justify-center cursor-pointer group transition-colors"
                    >
                      <div className="text-center text-gray-500 group-hover:text-blue-600">
                        <Upload className="w-12 h-12 mx-auto mb-3" />
                        <p className="text-sm font-medium">
                          Click to upload event image
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PNG, JPG up to 10MB
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" /> Event Title
                  </label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter event title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" /> Event Date
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" /> Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" /> End Time
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" /> Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter event location"
                  />
                </div>
                <div>
                  <button
                    onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                    className="w-full flex items-center justify-between text-left text-gray-700 mb-2 hover:text-blue-600 transition-colors"
                  >
                    <span className="text-sm font-medium">
                      <FileText className="w-4 h-4 inline mr-1" /> Description
                      (Optional)
                    </span>
                    {descriptionExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {descriptionExpanded && (
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      placeholder="Describe your event..."
                    />
                  )}
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <Users className="w-4 h-4 mr-1" /> Capacity
                  </span>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-20 px-3 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    min="1"
                  />
                </div>
                <button
                  onClick={handleCreateEvent}
                  disabled={loading}
                  className={`w-full py-3 text-white font-medium rounded-lg transition-all transform focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none cursor-pointer
    ${
      loading
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-[1.02]"
    }`}
                >
                  {loading ? "Creating..." : "Create Event"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

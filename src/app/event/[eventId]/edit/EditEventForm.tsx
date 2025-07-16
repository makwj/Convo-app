"use client";

import { useState, useRef, useEffect } from "react";
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
import { db, storage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/navbar";

export default function EditEventPage({ event, eventId }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...event });
  const [imageFile, setImageFile] = useState(null);
  const [eventImagePreview, setEventImagePreview] = useState(form.imageUrl);
  const [descriptionExpanded, setDescriptionExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setEventImagePreview(form.imageUrl);
  }, [form.imageUrl]);

  const handleImageUpload = (event) => {
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

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setEventImagePreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setEventImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImageToFirebase = async (file) => {
    const imageRef = ref(storage, `eventImages/${eventId}_${file.name}`);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = form.imageUrl;
      if (imageFile) {
        toast.loading("Uploading image...");
        imageUrl = await uploadImageToFirebase(imageFile);
        toast.dismiss();
      }

      await updateDoc(doc(db, "events", eventId), {
        ...form,
        imageUrl,
      });

      toast.success("Event updated!");
      router.push(`/event/${eventId}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update event.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <main className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Edit Event</h1>
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
          >
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
                        type="button"
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
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="Event Title"
                />

                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="time"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="time"
                    name="endTime"
                    value={form.endTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="Event Location"
                />

                <button
                  type="button"
                  onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  className="w-full flex items-center justify-between text-left text-gray-700 mb-2 hover:text-blue-600"
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
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none"
                    placeholder="Describe your event..."
                  />
                )}

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <Users className="w-4 h-4 mr-1" /> Capacity
                  </span>
                  <input
                    type="number"
                    name="capacity"
                    value={form.capacity}
                    onChange={handleChange}
                    className="w-20 px-3 py-1 text-center border border-gray-300 rounded"
                    min="1"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 text-white font-medium rounded-lg transition-all transform focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none cursor-pointer
                    ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-[1.02]"
                    }`}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}

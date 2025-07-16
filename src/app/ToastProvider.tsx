// This file mounts the Sonner Toaster for toast notifications globally
import { Toaster } from "sonner";

export default function ToastProvider() {
  return <Toaster richColors position="top-center" />;
}

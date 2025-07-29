"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, Telescope, Ticket, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import Logo from "../images/CONVO.png";
import { toast } from "sonner";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
      toast("You have been logged out", { duration: 5000 });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
      path: "/dashboard",
    },
    {
      name: "Your Events",
      icon: <Ticket className="w-4 h-4" />,
      path: "/your-events",
    },
    {
      name: "Discover",
      icon: <Telescope className="w-4 h-4" />,
      path: "/discover",
    },
  ];

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-8">
        <div
          className="flex items-center justify-center rounded-full font-bold cursor-pointer"
          onClick={() => router.push("/dashboard")}
        >
          <Image src={Logo} alt="Logo" className="w-10 h-10" />
        </div>

        <nav className="flex items-center space-x-8 text-sm font-medium text-gray-700">
          {navItems.map((item) => {
            const isActive =
              pathname === item.path ||
              (item.name === "Your Events" &&
                (pathname.startsWith("/event/") || pathname.includes("/edit")));

            return (
              <button
                key={item.name}
                className={`flex items-center space-x-2 transition cursor-pointer ${
                  isActive
                    ? "font-bold text-indigo-600"
                    : "hover:text-indigo-600"
                }`}
                onClick={() => router.push(item.path)}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative group">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-700 hover:text-indigo-600 cursor-pointer"
            onClick={() => router.push("/create-event")}
          >
            <Plus className="w-5 h-5" />
          </Button>
          <div className="absolute top-10 right-1 whitespace-nowrap bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Create Event
          </div>
        </div>

        <div className="relative group">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-700 hover:text-indigo-600 cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
          </Button>
          <div className="absolute top-10 right-0 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Logout
          </div>
        </div>
      </div>
    </header>
  );
}

import AppSidebar from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import React from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppSidebar />
      <main className="w-full">
        <Navbar />
        <section className="p-4">{children}</section>
      </main>
    </>
  );
}

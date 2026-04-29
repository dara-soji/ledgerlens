import NavBar from "@/components/NavBar"
import { Toaster } from "react-hot-toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <div>
      <NavBar />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
        }}
      />
      <main>{children}</main>
    </div>
  )
}
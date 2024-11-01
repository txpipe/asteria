import Sidebar from "@/components/Sidebar";

import "./markdown.css";
export default function HowToPlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container 2xl mx-auto flex flex-row min-h-[calc(100vh-64px)]">
      <Sidebar />

      <div className="flex-initial basis-3/5 pt-4 pb-8 px-8">
        <div className="markdown-body">{children}</div>
      </div>
    </div>
  );
}

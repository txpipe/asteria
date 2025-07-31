import "./markdown.css";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="markdown-body py-4">{children}</div>
  );
}

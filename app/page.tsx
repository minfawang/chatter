import Chat from "./chat";

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6">
      <div className="max-w-5xl w-full font-mono">
        <Chat inputSource="customer" defaultResponseSource="assistant/bruvi" />
      </div>
    </main>
  );
}

export const fetchCache = "default-no-store";

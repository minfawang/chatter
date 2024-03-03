import Chat from "../chat";

export default async function HumanAssistant() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="max-w-5xl w-full font-mono">
        <Chat inputSource="assistant/human" defaultResponseSource="null" />
      </div>
    </main>
  );
}

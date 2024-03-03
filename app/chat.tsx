import RealtimeChat from "./realtime-chat";
import supabase from "./supabase";

export default async function Chat({
  inputSource,
  defaultResponseSource,
}: {
  inputSource: String;
  defaultResponseSource: string;
}) {
  const { data: messagesReversed } = await supabase
    .from("messages")
    .select("id,text,source,created_at,references")
    .order("created_at", { ascending: false })
    .limit(100);
  const messages = messagesReversed?.reverse();
  return (
    <RealtimeChat
      serverMessages={messages ?? []}
      inputSource={inputSource}
      defaultResponseSource={defaultResponseSource}
    />
  );
}

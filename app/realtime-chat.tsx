"use client";
import { useEffect, useRef, useState } from "react";
import supabase from "./supabase";
import { BRUVI_URL, LLAMA_URL } from "./constants";
import { ChatResponse, ReferenceData } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clsx } from "clsx";
import SourceSelect from "@/components/ui/source-select";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Link2Icon } from "@radix-ui/react-icons";

type Message = {
  id: String;
  text: String;
  source: String;
  references?: ReferenceData[];
};

async function getResponseFromLlama(messages: Omit<Message, "id">[]) {
  const response = await fetch(LLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  const json = await response.json();
  const content = json.choices[0].text.trim();
  return content;
}

async function getResponseFromBruvi(messages: Omit<Message, "id">[]) {
  const response = await fetch(BRUVI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  const { content, references } = await response.json();
  console.log(references);
  return { content, references };
}

async function insertMessage({
  text,
  source,
  references,
}: {
  text: string;
  source: string;
  references?: ReferenceData[];
}) {
  return supabase.from("messages").insert({ text, source, references });
}

function ReferenceView({
  index,
  reference,
}: {
  index: number;
  reference: ReferenceData;
}) {
  return (
    <div className="flex">
      <Link2Icon className="mr-2" />
      <a href={reference.url}>{reference.page_title}</a>
    </div>
  );
}

function MessageView({ text, source, references }: Message) {
  const hasReferences = !!references && references.length > 0;
  return (
    <div
      className={clsx(
        "w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 my-2 text-sm",
        source === "customer"
          ? "ml-auto bg-primary text-primary-foreground"
          : "bg-muted"
      )}
    >
      <div>{text}</div>
      {hasReferences && (
        <div>
          <hr className="my-2" />
          {/* Reference container */}
          <div>
            {references.map((reference, index) => (
              <ReferenceView key={index} index={index} reference={reference} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RealtimeChat({
  inputSource,
  defaultResponseSource,
  serverMessages,
}: {
  inputSource: string;
  defaultResponseSource: string;
  serverMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(serverMessages);
  const [text, setText] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [responseSource, setResponseSource] = useState<string>(
    defaultResponseSource
  );

  // Get different response based on different response source.
  const getResponse = (messages: Omit<Message, "id">[]) => {
    if (responseSource === "assistant/tiny_llama_1b") {
      return getResponseFromLlama(messages).then((text) =>
        insertMessage({ text, source: responseSource })
      );
    } else if (responseSource === "assistant/bruvi") {
      return getResponseFromBruvi(messages).then(({ content, references }) =>
        insertMessage({ text: content, source: responseSource, references })
      );
    } else if (
      responseSource === "assistant/human" ||
      responseSource === "null"
    ) {
      // Do nothing. Wait for human response.
      return;
    } else {
      alert(`source ${responseSource} is not supported yet`);
      return;
    }
  };

  // Send the user message.
  const sendMessage = () => {
    if (!text) return;
    if (isSending) return;
    setIsSending(true);
    const newMessage = { text, source: inputSource };
    insertMessage(newMessage)
      .then(() => setText(""))
      .then(() => getResponse([...messages, newMessage]))
      .finally(() => setIsSending(false));
  };
  // The ref element used for the scroll-to-end effect.
  const olEndRef = useRef(null);

  // Clear all messages to reset the session.
  const clearAllMessages = () => {
    supabase
      .from("messages")
      .delete()
      .neq("id", 0)
      .then(({ error }) => {
        if (error != null) {
          alert(error);
        } else {
          setMessages([]);
        }
      });
  };

  // Scroll to bottom whenever messages change.
  useEffect(() => {
    olEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime update the messages whenever a new message is inserted.
  useEffect(() => {
    const channel = supabase
      .channel("new-message")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages([...messages, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, messages]);

  return (
    <div>
      <div className="flex justify-between">
        <h2 style={{ marginBottom: 20 }}>Chat</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearAllMessages}>
            Clear all
          </Button>
          <SourceSelect
            value={responseSource}
            onValueChange={setResponseSource}
          />
          <ThemeToggle />
        </div>
      </div>

      <div className="mb-8" />

      <div
        style={{ height: 800, maxHeight: "80vh", overflowY: "auto" }}
        className="text-sm"
      >
        {messages?.map((message) => (
          <MessageView key={message.id} {...message} />
        ))}

        {/* Dummy div used to scroll to bottom of the ol */}
        <div ref={olEndRef}></div>
      </div>

      <br />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex w-full items-center space-x-2"
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} />
        <Button onClick={sendMessage} disabled={isSending || !text}>
          {isSending ? "Sending..." : "Send"}
        </Button>
      </form>
    </div>
  );
}

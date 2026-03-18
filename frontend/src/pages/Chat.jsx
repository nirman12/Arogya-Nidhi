import { useEffect, useState } from "react";
import ChatPostForm from "../components/ChatPostForm";
import ChatList from "../components/ChatList";
import ChatThread from "../components/ChatThread";

const STORAGE_KEY = "arogyanidhi_chat_posts";

const sampleData = [
  {
    id: "p1",
    title: "How can I reduce fever at home?",
    body: "I've had a fever for 2 days. What can I try at home before visiting?",
    author: "patient",
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    replies: [
      {
        id: "r1",
        body: "Stay hydrated, take paracetamol as per dose. If fever > 39°C or persists >3 days, visit a doctor.",
        author: "doctor",
        createdAt: Date.now() - 1000 * 60 * 60 * 23,
      },
    ],
  },
];

const Chat = () => {
  const [posts, setPosts] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : sampleData;
    } catch (e) {
      return sampleData;
    }
  });

  const [activePost, setActivePost] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }, [posts]);

  const addPost = (title, body) => {
    const newPost = {
      id: `p${Date.now()}`,
      title,
      body,
      author: "patient",
      createdAt: Date.now(),
      replies: [],
    };
    setPosts([newPost, ...posts]);
    setActivePost(newPost);
  };

  const addReply = (postId, replyBody, author = "doctor") => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              replies: [
                ...p.replies,
                { id: `r${Date.now()}`, body: replyBody, author, createdAt: Date.now() },
              ],
            }
          : p
      )
    );
  };

  return (
    <div className="my-8 md:mx-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold">Community Chat</h1>
        <p className="text-sm text-gray-500">Post health queries & get answers from doctors — समुदायमा प्रश्न राख्नुहोस् र चिकित्सकबाट जवाफ पाउनुहोस्</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="sticky top-20">
            <ChatPostForm onSubmit={addPost} />
            <div className="mt-6">
              <h2 className="font-medium mb-3">Recent Questions</h2>
              <ChatList posts={posts} onOpen={(p) => setActivePost(p)} />
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          {activePost ? (
            <ChatThread post={posts.find((p) => p.id === activePost.id) || activePost} onReply={addReply} />
          ) : (
            <div className="p-8 border border-gray-200 rounded text-center text-gray-500">Select a question or create a new one to view thread.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;

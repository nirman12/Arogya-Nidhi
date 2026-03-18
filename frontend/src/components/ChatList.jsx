import { assets } from "../assets/assets_frontend/assets";

const ChatList = ({ posts = [], onOpen }) => {
  return (
    <div className="flex flex-col gap-3">
      {posts.length === 0 && <p className="text-sm text-gray-500">No questions yet.</p>}
      {posts.map((p) => (
        <div
          key={p.id}
          className="p-3 border border-gray-100 rounded hover:shadow-md cursor-pointer bg-white flex gap-3 items-start"
          onClick={() => onOpen(p)}
        >
          <img src={assets.profile_pic} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{p.title}</h4>
              <span className="text-xs text-gray-400">{p.replies.length} replies</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.body}</p>
            <div className="text-xs text-gray-400 mt-2">{new Date(p.createdAt).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList;

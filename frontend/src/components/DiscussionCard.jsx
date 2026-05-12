import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const AUTHOR_LABELS = {
  doctor: "Doctor",
  patient: "Patient",
  student: "Student",
};

const DiscussionCard = ({ post, onView, onVote }) => {
  const votes = post.votes ?? 0;
  const comments = post.replies?.length ?? 0;
  const views = post.views ?? Math.floor(Math.random() * 500) + 20;
  const authorLabel = AUTHOR_LABELS[post.author] || "Community";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:min-w-[88px] sm:flex-col sm:justify-start sm:border-b-0 sm:border-r sm:px-3">
          <button
            type="button"
            onClick={() => onVote?.(post.id, 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
            aria-label="Upvote discussion"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </button>

          <div className="text-center">
            <div className="text-base font-semibold text-slate-900">{votes}</div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
              votes
            </div>
          </div>

          <button
            type="button"
            onClick={() => onVote?.(post.id, -1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
            aria-label="Downvote discussion"
          >
            <ArrowDownIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {post.category || "General"}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {authorLabel}
            </span>
            <span className="text-xs text-slate-400">
              Posted {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h3 className="mt-3 break-words text-lg font-semibold leading-7 text-slate-900 sm:text-xl">
            {post.title}
          </h3>

          <p className="mt-2 break-words text-sm leading-6 text-slate-600 sm:text-[15px]">
            {post.body}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1">
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              {comments} {comments === 1 ? "reply" : "replies"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1">
              <EyeIcon className="h-4 w-4" />
              {views} views
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              Join the discussion and share a helpful next step.
            </div>
            <button
              type="button"
              onClick={() => onView?.(post)}
              className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto"
            >
              View Discussion
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default DiscussionCard;

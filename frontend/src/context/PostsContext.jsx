import { createContext, useContext, useState } from "react";

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_POSTS = [
  {
    id: 1,
    authorInitials: "JD",
    authorName: "John Doe",
    authorRole: "patient",
    title: "What are the early warning signs of heart disease I should watch out for?",
    body: `I've been experiencing occasional chest tightness and shortness of breath when climbing stairs. My father had heart disease in his 50s, so I'm concerned about my risk factors.\n\nI recently had a routine blood test and my LDL cholesterol came back slightly elevated at 145 mg/dL. My GP told me it wasn't alarming yet but recommended I keep an eye on it.\n\nI'm 47 years old, moderately active (walk ~30 minutes most days), non-smoker, and my blood pressure is usually around 128/82. What symptoms specifically should I be watching for, and at what point should I push for a cardiology referral?`,
    category: "Cardiology",
    comments: 3,
    views: "1.2k",
    votes: 247,
    userVote: null,
    postedAt: "2026-04-08T09:30:00Z",
    comments_data: [
      {
        id: 101,
        authorInitials: "SJ",
        authorName: "Dr. Sarah Johnson",
        authorRole: "doctor",
        body: "Great question. The classic warning signs to watch for include chest pain or pressure (especially radiating to your left arm, neck, or jaw), unexplained shortness of breath even at rest, palpitations, dizziness, and excessive fatigue that's new or worsening.\n\nGiven your family history and your current symptoms with exertion, I'd recommend asking your GP for a resting ECG and possibly a stress test. An LDL of 145 isn't alarming, but combined with your other risk factors (family history, slightly elevated BP) it's worth discussing with a cardiologist sooner rather than later.",
        votes: 89,
        userVote: null,
        postedAt: "2026-04-08T11:15:00Z",
        replies: [
          {
            id: 1011,
            authorInitials: "JD",
            authorName: "John Doe",
            authorRole: "patient",
            body: "Thank you Dr. Johnson! I'll ask my GP for a referral at my next appointment. Should I be worried about the shortness of breath specifically, or is that more of a general fitness issue at my age?",
            votes: 12,
            userVote: null,
            postedAt: "2026-04-08T12:00:00Z",
            replies: [],
          },
          {
            id: 1012,
            authorInitials: "SJ",
            authorName: "Dr. Sarah Johnson",
            authorRole: "doctor",
            body: "Shortness of breath with moderate exertion (like climbing stairs) at 47 is worth investigating rather than dismissing. It could be deconditioning, but with your family history, it warrants a proper evaluation. Don't delay.",
            votes: 34,
            userVote: null,
            postedAt: "2026-04-08T12:45:00Z",
            replies: [],
          },
        ],
      },
      {
        id: 102,
        authorInitials: "MK",
        authorName: "Maria Kim",
        authorRole: "student",
        body: "From what I've studied in cardiology — the HEART score is commonly used in ER settings to assess risk. As a layperson though, the most actionable thing you can do right now is track your symptoms (when they occur, duration, severity) and bring that log to your doctor. Pattern recognition is key for diagnosis.",
        votes: 45,
        userVote: null,
        postedAt: "2026-04-08T14:30:00Z",
        replies: [
          {
            id: 1021,
            authorInitials: "JD",
            authorName: "John Doe",
            authorRole: "patient",
            body: "That's a really practical tip, I'll start keeping a symptom diary. Is there an app you'd recommend for tracking this kind of thing?",
            votes: 8,
            userVote: null,
            postedAt: "2026-04-08T15:10:00Z",
            replies: [],
          },
        ],
      },
      {
        id: 103,
        authorInitials: "RC",
        authorName: "Robert Chen",
        authorRole: "patient",
        body: "I went through something similar two years ago. My advice: don't wait. I kept brushing off my chest tightness as stress for almost a year. Eventually had a 70% blockage found on a stress echo. Early detection made a huge difference in my treatment options.",
        votes: 67,
        userVote: null,
        postedAt: "2026-04-09T08:00:00Z",
        replies: [],
      },
    ],
  },
  {
    id: 2,
    authorInitials: "SJ",
    authorName: "Dr. Sarah Johnson",
    authorRole: "doctor",
    title: "Understanding Migraine Triggers: A Comprehensive Guide",
    body: `As a neurologist, I see patients struggling with migraines daily. I've compiled this guide based on the latest research and clinical experience.\n\n**Common Dietary Triggers:**\n- Aged cheeses (tyramine content)\n- Red wine and other alcohols\n- Caffeine (both excess and withdrawal)\n- Processed meats with nitrates\n- MSG in certain foods\n\n**Environmental & Lifestyle Triggers:**\n- Changes in sleep schedule (sleeping in on weekends is a common culprit)\n- Bright or flickering lights, especially screens\n- Strong perfumes or chemical smells\n- Weather changes, especially barometric pressure drops\n- Hormonal fluctuations in women\n\n**Stress & Psychological:**\n- The "let-down" migraine — often hits after a stressful period ends\n- Anxiety and depression are strongly comorbid with chronic migraine\n\nKeeping a migraine diary for 2-3 months is the most effective way to identify YOUR personal triggers. Apps like Migraine Buddy can help.`,
    category: "Neurology",
    comments: 2,
    views: "856",
    votes: 189,
    userVote: null,
    postedAt: "2026-04-07T14:00:00Z",
    comments_data: [
      {
        id: 201,
        authorInitials: "AL",
        authorName: "Alex Lee",
        authorRole: "patient",
        body: "This is incredibly helpful. I've had chronic migraines for 6 years and never connected the weather changes pattern. I live in a city with very variable weather and my bad weeks often coincide with storm fronts. Is there actually a physiological explanation for this?",
        votes: 34,
        userVote: null,
        postedAt: "2026-04-07T16:20:00Z",
        replies: [
          {
            id: 2011,
            authorInitials: "SJ",
            authorName: "Dr. Sarah Johnson",
            authorRole: "doctor",
            body: "Yes, absolutely. Barometric pressure changes affect the pressure equilibrium in the sinuses and potentially the intracranial pressure balance. Some migraine brains are hyper-sensitive to these shifts. There's ongoing research into pressure-sensing neurons in the trigeminal system. Some patients benefit from tracking weather apps alongside their migraine diary.",
            votes: 28,
            userVote: null,
            postedAt: "2026-04-07T17:00:00Z",
            replies: [],
          },
        ],
      },
      {
        id: 202,
        authorInitials: "MK",
        authorName: "Maria Kim",
        authorRole: "student",
        body: "Just want to add from a pharmacology perspective — CGRP antagonists (gepants like rimegepant, ubrogepant) are a relatively new class that's showing great results for both acute treatment and prevention. Worth asking your neurologist about if you haven't tried them.",
        votes: 41,
        userVote: null,
        postedAt: "2026-04-08T09:00:00Z",
        replies: [],
      },
    ],
  },
  {
    id: 3,
    authorInitials: "MK",
    authorName: "Maria Kim",
    authorRole: "student",
    title: "Best practices for maintaining work-life balance during medical school?",
    body: `I'm in my second year of medical school and really struggling. The workload is enormous — we have lectures from 8am to 5pm most days, then studying until midnight, clinical placements on weekends, and constant exam pressure.\n\nI've started noticing signs of burnout: I'm not enjoying things I used to love, I feel emotionally numb sometimes, and my sleep quality has tanked. I know this is common in medical school but I don't want to just "push through" if there are smarter strategies.\n\nSome things I've tried:\n- Pomodoro technique for studying (helps somewhat)\n- Gym 3x per week (getting harder to maintain)\n- Weekly calls with friends from home\n\nWhat has worked for you? Especially interested in hearing from practicing doctors who made it through — does it get better?`,
    category: "General Health",
    comments: 2,
    views: "523",
    votes: 142,
    userVote: null,
    postedAt: "2026-04-06T18:00:00Z",
    comments_data: [
      {
        id: 301,
        authorInitials: "SJ",
        authorName: "Dr. Sarah Johnson",
        authorRole: "doctor",
        body: "It does get better — but only if you build intentional habits now rather than deferring self-care until after residency (a trap many fall into).\n\nWhat worked for me: scheduling recovery time the same way I scheduled studying. Non-negotiable. Also, finding one person in your cohort who you can be honest with about struggles, not just compete with. The culture of appearing fine is toxic.\n\nFor sleep specifically: no studying after 10pm. Whatever you don't know by then, you won't meaningfully retain. The return diminishes sharply with fatigue.",
        votes: 78,
        userVote: null,
        postedAt: "2026-04-06T19:30:00Z",
        replies: [
          {
            id: 3011,
            authorInitials: "MK",
            authorName: "Maria Kim",
            authorRole: "student",
            body: "The 10pm cutoff is actually something I haven't tried. I always assumed studying later was better because it's quieter. I'll try this next week. Thank you.",
            votes: 15,
            userVote: null,
            postedAt: "2026-04-06T20:00:00Z",
            replies: [],
          },
        ],
      },
      {
        id: 302,
        authorInitials: "RC",
        authorName: "Robert Chen",
        authorRole: "patient",
        body: "Not in medicine but went through a brutal PhD program. One thing that helped: reframing 'rest' as productive, not lazy. Your brain consolidates learning during sleep and downtime. Protecting rest IS studying smarter. The guilt around resting is the real enemy.",
        votes: 52,
        userVote: null,
        postedAt: "2026-04-07T09:00:00Z",
        replies: [],
      },
    ],
  },
  {
    id: 4,
    authorInitials: "AL",
    authorName: "Alex Lee",
    authorRole: "patient",
    title: "Dealing with adult acne: Treatment options that actually work?",
    body: `I'm 28 and still struggling with breakouts, mostly around my jawline and chin (hormonal pattern, apparently). I've been dealing with this since my early 20s and it's genuinely affecting my confidence.\n\nThings I've tried:\n- Benzoyl peroxide washes (helpful but very drying)\n- Salicylic acid (minimal effect)\n- Diet changes (cutting dairy for 3 months — some improvement but not dramatic)\n- Multiple OTC spot treatments\n\nMy dermatologist mentioned spironolactone as a next step (I'm female) but I'm nervous about a systemic medication. Has anyone had experience with it? Also curious about tretinoin — I've been using a 0.025% for 6 months with okay results but wondering if I should go stronger.`,
    category: "Dermatology",
    comments: 2,
    views: "412",
    votes: 98,
    userVote: null,
    postedAt: "2026-04-05T11:00:00Z",
    comments_data: [
      {
        id: 401,
        authorInitials: "SJ",
        authorName: "Dr. Sarah Johnson",
        authorRole: "doctor",
        body: "Spironolactone is actually very well-studied for hormonal acne in women. It works by blocking androgen receptors in the skin. The main side effects to watch for are increased urination (especially initially), mild breast tenderness, and menstrual changes. For most women, 50-100mg is effective with a very acceptable side effect profile.\n\nFor tretinoin: 0.025% for 6 months is a reasonable trial but if you're tolerating it well, stepping up to 0.05% could give you more meaningful results. Talk to your derm about the combination approach.",
        votes: 56,
        userVote: null,
        postedAt: "2026-04-05T14:00:00Z",
        replies: [
          {
            id: 4011,
            authorInitials: "AL",
            authorName: "Alex Lee",
            authorRole: "patient",
            body: "This is really reassuring. I think I was scared by some forum posts about side effects. I'll bring this up with my dermatologist and ask about stepping up the tret as well. Thank you!",
            votes: 19,
            userVote: null,
            postedAt: "2026-04-05T15:30:00Z",
            replies: [],
          },
        ],
      },
      {
        id: 402,
        authorInitials: "MK",
        authorName: "Maria Kim",
        authorRole: "student",
        body: "I was on spironolactone for 18 months — it genuinely changed my skin. It took about 3 months to see real results but the improvement was significant. The only side effect I noticed was needing to drink more water. Don't be scared off by the theoretical side effect list.",
        votes: 44,
        userVote: null,
        postedAt: "2026-04-05T17:00:00Z",
        replies: [],
      },
    ],
  },
  {
    id: 5,
    authorInitials: "RC",
    authorName: "Robert Chen",
    authorRole: "patient",
    title: "Keto diet vs Mediterranean diet: Which is better for heart health?",
    body: `My doctor flagged my LDL at 162 mg/dL and triglycerides at 195 mg/dL and told me to make dietary changes before we consider statins.\n\nI've been doing a deep dive into the research and I'm confused. Some studies show keto dramatically lowers triglycerides and raises HDL, but also raises LDL in some people. Mediterranean diet has a strong evidence base for cardiovascular outcomes but the effect on lipids seems more modest.\n\nI'm 52, male, BMI 27, relatively sedentary (desk job). I don't hate cooking and am willing to commit to a diet properly if I pick the right one. What does the evidence actually say, and has anyone here made a switch that moved their lipids meaningfully?`,
    category: "Nutrition",
    comments: 2,
    views: "289",
    votes: 45,
    userVote: null,
    postedAt: "2026-04-04T10:00:00Z",
    comments_data: [
      {
        id: 501,
        authorInitials: "SJ",
        authorName: "Dr. Sarah Johnson",
        authorRole: "doctor",
        body: "The evidence base for the Mediterranean diet for cardiovascular outcomes is substantially stronger than for keto. The PREDIMED trial (large RCT) showed ~30% relative risk reduction in major cardiovascular events. Keto can improve triglycerides and HDL significantly, but the LDL response is highly variable — some people ('hyper-responders') see dramatic LDL increases on keto.\n\nFor your profile (elevated triglycerides, desk job), reducing refined carbohydrates and alcohol would likely help triglycerides regardless of which approach you take. I'd lean Mediterranean for long-term adherence and evidence quality.",
        votes: 31,
        userVote: null,
        postedAt: "2026-04-04T12:30:00Z",
        replies: [
          {
            id: 5011,
            authorInitials: "RC",
            authorName: "Robert Chen",
            authorRole: "patient",
            body: "The PREDIMED reference is exactly what I needed — something I can actually look up and evaluate. Thank you. I'll start with Mediterranean and retest at 3 months.",
            votes: 10,
            userVote: null,
            postedAt: "2026-04-04T13:00:00Z",
            replies: [],
          },
        ],
      },
      {
        id: 502,
        authorInitials: "MK",
        authorName: "Maria Kim",
        authorRole: "student",
        body: "Worth noting: the quality of the fat matters enormously. Replacing saturated fats (butter, red meat) with unsaturated fats (olive oil, nuts, avocado, fatty fish) consistently improves the LDL particle profile even before you label it Mediterranean or keto. That single change alone can move lipids meaningfully within 8 weeks.",
        votes: 22,
        userVote: null,
        postedAt: "2026-04-04T15:00:00Z",
        replies: [],
      },
    ],
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────

const PostsContext = createContext(null);

export const PostsProvider = ({ children }) => {
  const [posts, setPosts] = useState(SEED_POSTS);

  const addPost = (post) => setPosts((prev) => [post, ...prev]);

  const votePost = (id, dir) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const prev_vote = p.userVote;
        let delta = 0, nextVote = null;
        if (dir === "up") {
          if (prev_vote === "up")        { delta = -1; nextVote = null; }
          else if (prev_vote === "down") { delta = 2;  nextVote = "up"; }
          else                           { delta = 1;  nextVote = "up"; }
        } else {
          if (prev_vote === "down")      { delta = 1;  nextVote = null; }
          else if (prev_vote === "up")   { delta = -2; nextVote = "down"; }
          else                           { delta = -1; nextVote = "down"; }
        }
        return { ...p, votes: p.votes + delta, userVote: nextVote };
      })
    );
  };

  // Vote on a top-level comment
  const voteComment = (postId, commentId, dir) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments_data: p.comments_data.map((c) =>
            c.id === commentId ? applyVote(c, dir) : c
          ),
        };
      })
    );
  };

  // Vote on a reply
  const voteReply = (postId, commentId, replyId, dir) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments_data: p.comments_data.map((c) => {
            if (c.id !== commentId) return c;
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === replyId ? applyVote(r, dir) : r
              ),
            };
          }),
        };
      })
    );
  };

  // Add a top-level comment
  const addComment = (postId, text) => {
    const comment = {
      id: Date.now(),
      authorInitials: "Me",
      authorName: "You",
      authorRole: "patient",
      body: text,
      votes: 1,
      userVote: "up",
      postedAt: new Date().toISOString(),
      replies: [],
    };
    setPosts((prev) =>
      prev.map((p) =>
        p.id !== postId
          ? p
          : { ...p, comments_data: [comment, ...p.comments_data], comments: p.comments + 1 }
      )
    );
  };

  // Add a reply to a comment
  const addReply = (postId, commentId, text) => {
    const reply = {
      id: Date.now(),
      authorInitials: "Me",
      authorName: "You",
      authorRole: "patient",
      body: text,
      votes: 1,
      userVote: "up",
      postedAt: new Date().toISOString(),
      replies: [],
    };
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: p.comments + 1,
          comments_data: p.comments_data.map((c) =>
            c.id !== commentId
              ? c
              : { ...c, replies: [...c.replies, reply] }
          ),
        };
      })
    );
  };

  return (
    <PostsContext.Provider value={{ posts, addPost, votePost, voteComment, voteReply, addComment, addReply }}>
      {children}
    </PostsContext.Provider>
  );
};

// helper
function applyVote(item, dir) {
  const prev_vote = item.userVote;
  let delta = 0, nextVote = null;
  if (dir === "up") {
    if (prev_vote === "up")        { delta = -1; nextVote = null; }
    else if (prev_vote === "down") { delta = 2;  nextVote = "up"; }
    else                           { delta = 1;  nextVote = "up"; }
  } else {
    if (prev_vote === "down")      { delta = 1;  nextVote = null; }
    else if (prev_vote === "up")   { delta = -2; nextVote = "down"; }
    else                           { delta = -1; nextVote = "down"; }
  }
  return { ...item, votes: item.votes + delta, userVote: nextVote };
}

export const usePosts = () => useContext(PostsContext);

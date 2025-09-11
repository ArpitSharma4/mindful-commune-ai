// In-memory storage for posts (in production, use a database)
let posts = [
  {
    id: "1",
    title: "Finding peace in small moments",
    content: "Today I realized that happiness doesn't always come from big achievements. Sometimes it's found in the quiet moments - like watching the sunrise with my coffee, hearing a favorite song on the radio, or simply taking a deep breath. These little pockets of peace have become my anchors during difficult times. I'm learning to notice them more and hold onto their warmth when anxiety creeps in.",
    author: "Sarah M.",
    isAnonymous: false,
    timeAgo: "2 hours ago",
    upvotes: 24,
    comments: 8,
    tags: ["mindfulness", "gratitude", "peace"],
    community: "r/Mindfulness",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "2",
    title: "The weight of perfectionism",
    content: "I've been struggling with perfectionism lately. Every task feels like it needs to be flawless, and when it's not, I spiral into self-doubt. Today I tried something different - I set a timer for 30 minutes and just started writing without editing. The result wasn't perfect, but it was honest. Sometimes 'good enough' really is good enough.",
    author: "Anonymous",
    isAnonymous: true,
    timeAgo: "4 hours ago",
    upvotes: 18,
    comments: 12,
    tags: ["perfectionism", "self-compassion", "writing"],
    community: "r/Therapy",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  }
];

// Get all journal entries
const getJournalEntries = (req, res) => {
  try {
    res.json({
      success: true,
      data: posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch journal entries",
      error: error.message
    });
  }
};

// Create a new journal post
const createJournalPost = (req, res) => {
  try {
    const { title, content, community, isAnonymous, tags } = req.body;

    // Validation
    if (!title || !content || !community) {
      return res.status(400).json({
        success: false,
        message: "Title, content, and community are required"
      });
    }

    // Create new post
    const newPost = {
      id: (posts.length + 1).toString(),
      title: title.trim(),
      content: content.trim(),
      author: isAnonymous ? "Anonymous" : "User",
      isAnonymous: Boolean(isAnonymous),
      timeAgo: "just now",
      upvotes: 0,
      comments: 0,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      community: community,
      createdAt: new Date().toISOString()
    };

    posts.unshift(newPost); // Add to beginning of array

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: newPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create post",
      error: error.message
    });
  }
};

module.exports = { getJournalEntries, createJournalPost };



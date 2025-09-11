let posts = []; // later replace with DB

// Create post
const createPost = (req, res) => {
  const { title, content, community, isAnonymous, tags } = req.body;

  if (!title || !content || !community) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newPost = {
    id: posts.length + 1,
    title,
    content,
    community,
    isAnonymous,
    tags: tags ? tags.split(",").map(t => t.trim()) : [],
    createdAt: new Date()
  };

  posts.push(newPost);
  res.status(201).json(newPost);
};

// Get all posts
const getPosts = (req, res) => {
  res.json(posts);
};

module.exports = { createPost, getPosts };

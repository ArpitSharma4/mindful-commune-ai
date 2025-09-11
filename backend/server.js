const express = require("express");
const app = express();
const PORT = 5000;

app.use(express.json()); // middleware to parse JSON

// Community feature
const communityRoutes = require("./community/community.routes");
app.use("/api/community", communityRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// const express = require("express");
// const app = express();
// const PORT = 5000;

// // Middleware
// app.use(express.json());

// // Import routes from feature folders
// const chatbotRoutes = require("./chatbot/chatbot.routes");
// const communityRoutes = require("./community/community.routes");
// const journalingRoutes = require("./journal/journal.routes");

// // Use routes
// app.use("/api/chatbot", chatbotRoutes);
// app.use("/api/community", communityRoutes);
// app.use("/api/journaling", journalingRoutes);

// // Start server
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });


const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
const express = require('express')

const healthRoutes = require("./routes/health")
const imageRoutes = require("./routes/image")

const app = express()
app.use(express.json())

app.use("/health", healthRoutes)
app.use("/image", imageRoutes)

// run server
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Example app listening on port ${port}. Check out http://localhost:${port} if you running this API locally.`)
})



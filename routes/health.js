const express = require('express')
const router = express.Router()

const controllers = require("../controllers/health")

router.get("/", controllers.healthCheckup)

module.exports = router

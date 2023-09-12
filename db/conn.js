const mongoose = require("mongoose")

mongoose.connect("mongodb://0.0.0.0:27017/newRegistration")
.then(() => console.log("Connection established"))
.catch((err) => console.log(err)); 
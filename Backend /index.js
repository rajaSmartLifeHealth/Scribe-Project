const express = require('express');
const app = express()
const bodyParser = require('body-parser');
require('dotenv').config()
const searchRoute = require("./routes/search");

app.use("/api/search", searchRoute);
app.use(bodyParser.json());

app.get('/', async(req,res) => {
  res.send({msg : 'Welcome to the server'});
})


app.listen(process.env.PORT, () => {
    console.log(`server started please listen, http://localhost:${process.env.PORT}`);
})


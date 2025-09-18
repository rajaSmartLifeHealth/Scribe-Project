const express = require('express');
const app = express()
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config()
const searchRoute = require("./routes/search");

app.use("/api/search", searchRoute);
app.use(bodyParser.json());

let allowedOrigins

allowedOrigins = 'http://localhost:3001'

const corsOptions = {
  origin: allowedOrigins,
  exposedHeaders: ['Content-Disposition', 'Set-Cookie'],
  credentials: true // Allow cookies to be sent
} 

app.use(cors(corsOptions));

app.get('/', async(req,res) => {
  res.send({msg : 'Welcome to the server'});
})


app.listen(process.env.PORT, () => {
    console.log(`server started please listen, http://localhost:${process.env.PORT}`);
})


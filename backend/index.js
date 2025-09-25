const express= require('express');
const app = express();
require('dotenv').config()
const {userRouter} = require('./routes/user.routes');
const {auth} = require('./middleware/auth.middleware');
const{connection} = require('./config/db');
const {noteRouter} =require('./routes/note.routes')
const cors = require('cors');
const { summaryRouter } = require('./routes/summary.routes');
const { transcriptRouter } = require('./routes/transcript.routes');

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "https://scribe-project-nextjs-ed0t9wpgj-narendras-projects-be87aeb5.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // if using cookies/auth headers
  })
);

app.get('/', (req,res)=>{
    res.send({"msg": "welcome to the server"});
})

app.use(express.json());
// app.use(cors());
app.use('/users',userRouter);
app.use('/notes', auth, noteRouter);
app.use('/ai', auth, summaryRouter);
app.use('/transcript', auth, transcriptRouter)


app.listen(process.env.PORT, async()=> {
    try {
        await connection
        console.log("hi this is mongodb");
        console.log(`The server is running on port http://localhost:${process.env.PORT}`);
    } catch (error) {
        console.log(error);
    }
})
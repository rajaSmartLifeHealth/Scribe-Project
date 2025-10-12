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
const searchRouter = require('./routes/search');
const { consultationRouter } = require('./routes/consultation.routes');
const { promptRouter } = require('./routes/prompts.routes');

app.use(
  cors({
    origin: ["https://scribe-project-nextjs.vercel.app", "http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.get('/', (req,res)=>{
    res.send({"msg": "welcome to the server"});
})

app.use(express.json());
// app.use(cors());
app.use('/users',userRouter);
app.use('/api/ai', auth, searchRouter);
app.use('/api/notes', auth, noteRouter);
app.use('/api/ai', auth, summaryRouter);
app.use('/api/transcript', auth, transcriptRouter)
app.use('/api/consultation', auth, consultationRouter);
app.use('/api/prompts', auth, promptRouter)

app.listen(process.env.PORT, async()=> {
    try {
        await connection
        console.log("hi this is mongodb");
        console.log(`The server is running on port http://localhost:${process.env.PORT}`);
    } catch (error) {
        console.log(error);
    }
})
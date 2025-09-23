const express= require('express');
const app = express();
require('dotenv').config()
const {userRouter} = require('./routes/user.routes');
const {auth} = require('./middleware/auth.middleware');
const{connection} = require('./config/db');
const {noteRouter} =require('./routes/note.routes')
const cors = require('cors');
const { summaryRouter } = require('./routes/summary.routes');

app.get('/', (req,res)=>{
    res.send({"msg": "welcome to the server"});
})

app.use(express.json());
app.use('/users',userRouter);
app.use('/notes',noteRouter);
app.use('/ai', summaryRouter);
app.use(auth);

// app.use(cors({
//   origin: ["http://localhost:3000", "http://localhost:3001"], // dev URLs
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization", "application/json"]
// }));

app.listen(process.env.PORT, async()=> {
    try {
        await connection
        console.log("hi this is mongodb");
        console.log(`The server is running on port http://localhost:${process.env.PORT}`);
    } catch (error) {
        console.log(error);
    }
})
const express = require('express');
const {UserModel} = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { BlackTokenModel } =require('../models/token.models');
const { equal } = require('assert');
const { auth } = require('../middleware/auth.middleware');

const userRouter = express.Router();


userRouter.get('/users/checkEmail', async (req, res) => {
    try {
        const email = req.query.email;
        const user = await UserModel.findOne({ email });
        res.json({ available: !user }); // Return whether the email is available or not
    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).send('Internal Server Error');
    }
});

userRouter.post('/register', async(req, res)=> {

    const {username, email, password, role } = req.body;
    try {
         const existinguser = await UserModel.findOne({email});
         if(existinguser){
            res.status(401).json({msg: "User already exists"});
         } else{
            bcrypt.hash(password, 8, async(err, hash)=>{
                if(err){
                    console.log(err);
                    res.send({err: "error hashing password"});
                }
                else if(hash){
                    const newUser = new UserModel({username, email, password: hash, role});
                    await newUser.save();
                    res.send({"msg": "User has been registered"});
                }
            })
         }

    } catch (error) {
        console.log("error", error);
    }
})

userRouter.post('/login', async(req, res)=>{
    const {email, password} =req.body;
    try {
          const existingUser = await UserModel.findOne({email});
          if(!existingUser){
            res.send({msg: "user doesnt exist"});
          } else{
            bcrypt.compare(password, existingUser.password, (err,result)=> {
                if(result){
                    const token = jwt.sign({userID : existingUser._id, author : existingUser.username},process.env.tokenSecretKey,{expiresIn:'1h'})
                    res.send({msg: "login successful", token});
                } else if(err){
                    res.send({msg: "wrong credentials", err});
                }
            })
          }
    } catch (error) {
        res.send(error);
    }
})

userRouter.post('/logout', async(req,res) =>{
    try{

        const token =req.headers.authorization?.split(' ')[1];

        if(token){
            const blacktoken = await BlackTokenModel({blackToken:token})
            await blacktoken.save();

            res.status(200).send({msg:'user logged out successfully'})
        }

    }catch(err){
        res.status(404).send({msg:'error in user logout',Errors:err})
    }
})

userRouter.get('/profile',  auth, async(req, res) => {
     try {

        const id = req.clinician;
     const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      success: true,
      data: {
        name: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
})

module.exports = {
    userRouter
}
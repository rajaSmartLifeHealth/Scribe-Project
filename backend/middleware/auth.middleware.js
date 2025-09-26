const jwt = require('jsonwebtoken');
const { BlackTokenModel } = require('../models/token.models');
const e = require('express');
const { raw } = require('body-parser');

const auth = async(req,res, next)=>{

    const token = req.headers.authorization?.split(" ")[1];

     const blacklisted = await BlackTokenModel.findOne({ blackToken: token });

    if (blacklisted) {
      return res.status(401).json({ msg: "Session logged out. Please log in again." });
    }

    if(token){
       const decoded = jwt.verify(token,"masai");
            if(decoded){
                req.clinicianId = decoded.userID;
                next();
            } else {
                res.send({msg: "not authorized no access", "error":err});
            }
        }
    else {
       res.send({msg: "please login"});
    }
}
module.exports = {
    auth
}
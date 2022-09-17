const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const redis_client = require('../redis_connect');

async function Register(req, res){

    // encrypt password
    users = await User.find();
    if(users.length === 0){
        role = "admin";
    }else {
        role = "user";
    }
    const user = new User({ 
        address: req.body.address,
        password: req.body.password,
        role : role
    });

    try {
        const saved_user = await user.save();
        res.json({status: true, message: "Registered successfully."});
    } catch (error) {
        // do logging in DB or file.  
        res.json({status: false, message: "Something went wrong."});
    }
}
 
async function Login (req, res) {  
    const address = req.body.address;
    const password = req.body.password;   

    try {
        const user = await User.findOne({address: address, password: password}).exec();
        if(user === null) res.status(401).json({status: false, message: "password is not valid."});
        const access_token = jwt.sign({sub: user._id}, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_TIME});
        const refresh_token = GenerateRefreshToken(user._id);
       
        return res.json({status: true, message: "login success.", access_token, refresh_token});
    } catch (error) {
        return res.json({status: false, message: "login fail.", error});
    }

    
}
 
async function Logout (req, res) {
    const user_id = req.userData.sub;
    const token = req.token;

    // remove the refresh token 
    await redis_client.del(user_id.toString());

    // blacklist current access token 
    await redis_client.set('BL_' + user_id.toString(), token);
    
    return res.json({status: true, message: "Logged out."});
}

function GetAccessToken (req, res) {
    const user_id = req.userData.sub;
    const access_token = jwt.sign({sub: user_id}, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_TIME});
    const refresh_token = GenerateRefreshToken(user_id);

    return res.json({status: true, message: "success", access_token, refresh_token});
}
 
function GenerateRefreshToken(user_id) {
    const refresh_token = jwt.sign({ sub: user_id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_TIME });
     
    redis_client.get(user_id.toString(), (err, data) => {
        if(err) throw err;   

        redis_client.set(user_id.toString(), JSON.stringify({token: refresh_token}));
    })

    return refresh_token;
}

module.exports = { 
    Register,
    Login,
    Logout,
    GetAccessToken
}
const jwt = require('jsonwebtoken');
const redis_client = require('../redis_connect');


function verifyToken(req, res, next) {

    try {

        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        
        req.userData = decoded;
        req.token = token; 

        redis_client.get('BL_' + decoded.sub.toString(), (err, data) => {

            if(err) throw err;

            if(data === token) return res.json({status: false, message: "blacklisted token."});
            next();
        })
    } catch (error) {   
        return res.json({status: false, message: "Your session is not valid.", error});
    }
}

function verifyRefreshToken(req, res, next) {  
    const token = req.body.token;
    
    if(token === null) return res.json({status: false, message: "Invalid request."});
    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        req.userData = decoded;
        

        redis_client.get(decoded.sub.toString(), (err, data) => {
            if(err) throw err;


            if(data === null) return res.json({status: false, message: "Invalid request. Token is not in store."});

            if(JSON.parse(data).token != token) return res.json({status: false, message: "Invalid request. Token is not same in store."});
            next(); 
        })
    } catch (error) {
        return res.json({status: false, message: "Your session is not valid.", data: error});
    }
}

module.exports = {
    verifyToken,
    verifyRefreshToken
}
require('dotenv').config();
const express = require('express');
const app = express();
const cors = require("cors");

const mongoose = require('mongoose');

mongoose.connect(
    process.env.DB_CONN_STRING,
    { useUnifiedTopology: true, useNewUrlParser: true},
    () => console.log('connected to mongodb.')
); 

// middileware
app.use(express.json());
app.use(express.urlencoded({extended: false}))
app.use(cors()); 

// routes 
const auth_routes = require('./routes/auth.route');
const front_routes = require('./routes/front.route');


app.use('/v1/auth', auth_routes); 
app.use('/front', front_routes); 


app.listen(3000, () => console.log('server is running..'));
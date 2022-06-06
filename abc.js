// ----------------------------Dependencies--------------------------------- //
const express = require("express")
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");


// ----------------------------Routers--------------------------------- //
const app = express()
app.use(express.json())
app.use(cookieParser());

const authRouter = express.Router();
const userRouter = express.Router();

app.use('/auth', authRouter);
app.use('/user', userRouter);

userRouter.route("/")
    .get(authUser,getUsers)
    .patch(authUser,updateUser)
    
authRouter
    .route("/signup")
    .get(getSignup)
    .post(postSignup);
    
authRouter
    .route("/login")
    .get(getLogin)
    .post(postLogin);

// ----------------------------Database Connection--------------------------------- //

const db_link='mongodb+srv://bhavik:bhavik0000p@cluster0.s64ea.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(db_link)
.then(function(db){
    console.log("Database connected.")
})
.catch(function(err){
    console.log(err);
})

// -----------Creating Schema---------------------- //

const userSchema=mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        min:8
    }

});


userSchema.pre('save',async function(){
    let salt= await bcrypt.genSalt();
    let hashed= await bcrypt.hash(this.password,salt);
    this.password = hashed
});

const userModel = mongoose.model('userModel',userSchema);


//==== Home Page ====//
app.get('/home',authUser,(req,res)=> {
    console.log('home')
    res.sendFile('/home/asus/Desktop/test/views/home.html');
});

//==== Simple Post route ====//
app.post('/post',authUser, (req,res)=> {
    res.json({
        message: 'Posted',
    });
});

//==== Signup Function ====//
function getSignup(req,res) {
    res.sendFile('/home/asus/Desktop/test/views/signup.html');
};

async function postSignup(req,res){
    let obj=req.body;
    let user = await userModel.create(obj);
    console.log(obj)
    console.log(user)
    res.json({
        message:"User signedup"
    })
}

//==== Middleware to authorize user ====//
function authUser(req,res,next){
    if(req.cookies.login){
        let token = req.cookies.login;
        let payload = jwt.verify(token,'secretkey');
        if(payload){
            console.log("payload token",payload);
            console.log("Success")
            next();
        }
    }
    else{
        res.send("Login First")
    }
}

//==== Get the list of User ====//
async function getUsers(req,res){
    let allUsers= await userModel.find();
    res.json({message:'list of all users',
    data:allUsers});
}

//==== Login Function ====//
async function getLogin(req,res){
    res.sendFile("/home/asus/Desktop/test/views/login.html")
}

async function postLogin(req,res){
    let data=req.body;
    console.log(data)
    if(data.email){
        let user = await userModel.findOne({email: data.email});
        if(user){
            userpass = await bcrypt.compare(data.password, user.password)
            console.log(userpass);
            if(userpass){
                let uid = user["_id"];
                let token = jwt.sign({payload:uid}, "secretkey")
                res.cookie("login", token, { httpOnly: true });
                res.json({token})
                console.log("Logged in")
            }
            else{
                console.log("Wrong id/pass")
                return res.json({
                    message: "Wrong Credentials",
                    // data: user, // userDetails:data,
                });
            }
        }
        else{
            return res.json({
                message: "No user found... Please Signup"      
            })
        }
    }
}

//==== Update User information ====//
async function updateUser(req,res){
    console.log(req.body);
    let data=req.body;
    let token = req.cookies.login;
    let payload =await jwt.verify(token,'secretkey');
    console.log(payload);
    let user = await userModel.findByIdAndUpdate(payload.payload,data)
    console.log(user)
    res.json({
        message:"data updated successfully"
    });
}

app.listen(5000,() => console.log('Server started at port 5000'));


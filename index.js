const PORT=8008
const chalk=require('chalk')
const express=require('express')
const session=require('express-session')
const app=express()
const bcrypt=require('bcrypt')
const mongoose=require('mongoose')
const MongoDbSession=require('connect-mongodb-session')(session)
const userModel=require('./models/user')

//body-parser
app.use(express.urlencoded({extended:true}))

//set views
app.set('views', 'views')
app.set('view engine', 'ejs')


//connect to database
mongoose.connect('mongodb://localhost:27017/sessions', {
    useNewUrlParser:true,
    useCreateIndex:true,
    useUnifiedTopology:true
})
    .then(()=>{
        console.log("MongoDb is connected")
    })

//create store
const store=new MongoDbSession({
    uri:'mongodb://localhost:27017/sessions',
    collection: 'mySessions'
})


//use session
app.use(session({
    secret:"secret key",
    resave:false,
    saveUninitialized:false,
    store:store
}))

//isAuth variable
const isAuth=(req, res, next)=>{
    if(req.session.isAuth){
        next()
    }else{
        res.redirect('/login')
    }
}



//get root
app.get('/', (req, res)=>{
    // req.session.isAuth=true
    res.render('enter')
})

//register page
app.post('/register', async (req, res)=>{
    const {name, email, psw}=req.body;

   let user=await userModel.findOne({email})

    if(user){
        return res.redirect('/register')
    }

    const hashPass=await bcrypt.hash(psw, 12)

    user=new userModel({
        name,
        email,
        psw:hashPass
    })

    await user.save().then(()=>{
        console.log(chalk.yellow("Signed successfully"))
    })
    res.redirect('/login')
})



//login page
app.post('/login', async (req, res)=>{
    const {email, psw}=req.body
    const user = await userModel.findOne({email})

    if(!user){
        return res.redirect('/login')
    }

    const isMatch=bcrypt.compare(psw, user.psw)

    if(!isMatch){
        return res.redirect('/login')
    }

    req.session.isAuth=true
    res.redirect('/home')
})


app.get('/register', (req, res)=>{
    res.render('register')
})

app.get('/login', (req, res)=>{
    res.render('login')
})


app.get('/home', isAuth, (req, res)=>{
    res.render('root')
})

app.post('/logout', (req, res)=>{
    req.session.destroy((err)=>{
        if(err) throw err
        res.redirect('/')
    })
})

app.listen(PORT, ()=>{
    console.log(`Server has started at http://localhost:${PORT}`)
})
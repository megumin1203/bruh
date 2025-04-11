if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const express = require('express')
const app = express()
const path = require('path')
const ejsMate = require("ejs-mate")
const mongoose = require('mongoose')
const Campground = require('./models/campground')
const methodOverride= require('method-override')
const catchAsync = require('./utlis/catchAsync')
const ExpressError = require('./utlis/ExpressError')
const session = require('express-session')
const Joi = require('joi'); // có thể xóa dòng này, đã có joi trong schema
const {campgroundSchema, reviewSchema} = require("./schema.js")
const Review = require('./models/review')
const User = require("./models/user")
const flash = require('connect-flash');
const multer = require('multer');
//const upload = multer({dest:'/uploads'})

const passport = require('passport')
const LocalStrategy = require('passport-local')

const userRoutes = require('./routes/user')
const campgroundRoutes = require('./routes/campground')
const reviewRoutes = require('./routes/reviews');
const mongoSanitize = require('express-mongo-sanitize');


mongoose.connect("mongodb://127.0.0.1:27017/yelp-camp")
    .then(() => {
        console.log("mongo connection open")
    })
    .catch(err => {
        console.log("Oh no error")
        console.log(err)
    })
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname,'public'))) ;
app.use(session({secret:"notagoodsecret"}));'app'
app.use(mongoSanitize())





const sessionCongig = {
    name:'session',// shoundt use the default name (connect.sid)
    secret:'thisshowldbeabettersecrete',
    resave: false,
    saveUninitionalized: true,
    cookie: {

        httpsOnly: true,
        //secure: true;
        expire: Date.now() + 1000 * 60 *60 *24 * 7,
        maxAge: 1000 * 60 *60 *24 * 7,
    }
}

app.use(session(sessionCongig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser()); // how to store and unstore a user in session 
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success') // ko can nhet cai nay vao template, ta luôn có truy cập với biến này  
    res.locals.error = req.flash('error')
    next()
})

app.get('/fakeUser', async(req,res) => {
    const user = new User({email: "non171152@gmail.com" , username:'colt'});
    const newUser = await User.register(user, ' chicken');
    res.send(newUser);
})


const validateCampground = (req,res,next) => {
    const {error} = campgroundSchema.validate(req.body)                  //const result = campgroundSchema.validate(req.body)
    if (error) {         //if (!req.body.campground) throw new ExpressError("invalid Campground Data", 400)
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg,400) // nem ngay cho error middleware
    }else {
        next();
    }

}
const validateReview = (req,res,next) => {
    const {error} = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.messgae);
        throw new ExpressError(msg,400)
    }else {
        next()
    }
}
app.use('/', userRoutes)
app.use('/campgrounds',campgroundRoutes)
app.use('/campgrounds/:id/reviews',reviewRoutes) /// co mot loi can phai sua la khi theo dia chi nhu tren, route handler se ko co truy cap doi voi id => sua o trong route review


app.get('/', (req,res) => {
    res.render('home')
})


app.all('*' ,(req,res,next) => {
    next(new ExpressError('Pgae not found',404))
})

app.use((err,req,res,next) => {
    const {statusCode = 500} = err; 
    if (!err.message) {err.message ="Oh no something went wrong!"}
    res.status(statusCode).render('error',{err})
});


app.listen(3000, () => {
    console.log('Serving on port 3000')
})

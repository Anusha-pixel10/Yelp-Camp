if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet');
const userRoutes = require('./routes/users');
const campgroundsRoutes = require('./routes/campgrounds');
const reviewsRoutes = require('./routes/reviews');
const MongoDBStore = require("connect-mongo")(session);

const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/yelp-camp-maptiler';

// mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp-maptiler')
//     .then(() => console.log("Database connected"))
//     .catch(err => console.error("Connection error:", err));

mongoose.connect(dbUrl)
    .then(() => console.log("Database connected"))
    .catch(err => console.error("Connection error:", err));


const app = express();
app.set('query parser', 'extended');

/*VIEW / PARSING SETUP*/
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('public'));

/*SESSION/AUTH*/
const store = new MongoDBStore({
    url: 'mongodb://127.0.0.1:27017/yelp-camp-maptiler',
    secret: 'thisshouldbeabettersecret',
    touchAfter: 24 * 60 * 60
});

store.on("error", function(e) {
    console.log("SESSION STORE ERROR", e)
})

const sessionConfig = {
    store,
    name: 'session',
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

const scriptSrcUrls = [
    "https://cdn.jsdelivr.net",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.maptiler.com/",
    "https://fonts.googleapis.com",
];
const styleSrcUrls = [
    "https://cdn.jsdelivr.net",
    "https://kit-free.fontawesome.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.maptiler.com/",
];
const connectSrcUrls = [
    "https://cdn.jsdelivr.net",
    "https://api.maptiler.com/", 
    "https://cdn.maptiler.com",
];
const fontSrcUrls = ["https://fonts.gstatic.com",];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'self'", "'unsafe-inline'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/",  
                "https://images.unsplash.com/",
                "https://api.maptiler.com/",
                "https://cdn.maptiler.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/*CUSTOM BODY SANITIZER*/
const sanitize = (obj) => {
    for (let key in obj) {
        if (key.includes('$') || key.includes('.')) {
            delete obj[key];
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitize(obj[key]);
        }
    }
};

app.use((req, res, next) => {
    if (req.body) sanitize(req.body);
    next();
});

/* LOCALS / FLASH*/
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

/*ROUTES*/
app.use('/', userRoutes);
app.use('/campgrounds', campgroundsRoutes);
app.use('/campgrounds/:id/reviews', reviewsRoutes);

app.get('/', (req, res) => {
    res.render('home');
});

/* ERRORS*/
app.use((req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh no, something went wrong!';
    res.status(statusCode).render('error', { err });
});

/*SERVER*/
app.listen(3000, () => {
    console.log("Serving on port 3000!");
});

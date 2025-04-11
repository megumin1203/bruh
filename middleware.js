const {campgroundSchema, reviewSchema} = require("./schema.js")
const ExpressError = require('./utlis/ExpressError.js')
const Campground = require('./models/campground')
const Review = require('./models/review')



module.exports.isLoggedIn = (req,res,next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error','you must be signed in');
        return res.redirect('/login')
    }
    next();
}


module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
}

module.exports.validateCampground = (req,res,next) => {
    const {error} = campgroundSchema.validate(req.body)                  //const result = campgroundSchema.validate(req.body)
    if (error) {         //if (!req.body.campground) throw new ExpressError("invalid Campground Data", 400)
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg,400) // nem ngay cho error middleware
    }else {
        next();
    }

}
module.exports.isAuthor = async (req,res,next) => {
    const {id} = req.params;
    const campground = await Campground.findById(id)

    if (!campground.author.equals(req.user._id)) {
        req.flash('error', 'you dont have permission to do that')
        return res.redirect(`/campgrounds/${id}`)
    }
    next()
}

module.exports.isReviewAuthor = async (req,res,next) => {
    const { id,reviewId} = req.params;
    const review = await Review.findById(reviewId)

    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'you dont have permission to do that')
        return res.redirect(`/campgrounds/${id}`)
    }
    next()
}

module.exports.validateReview = (req,res,next) => {
    const {error} = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.messgae);
        throw new ExpressError(msg,400)
    }else {
        next()
    }
}
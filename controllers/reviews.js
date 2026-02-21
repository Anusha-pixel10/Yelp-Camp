const Campground = require('../models/campground');
const Review = require('../models/review');
const sanitizeHtml = require('sanitize-html');

module.exports.createReview = async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const cleanBody = sanitizeHtml(req.body.review.body, {
        allowedTags: [],
        allowedAttributes: {}
    }).trim();

    // Reject empty / html-only reviews
    if (!cleanBody) {
        req.flash('error', 'Review cannot be empty or contain only HTML.');
        return res.redirect(`/campgrounds/${campground._id}`);
    }

    // Create review explicitly 
    const review = new Review({
        rating: req.body.review.rating,
        body: cleanBody
    });

    review.author = req.user._id;
    campground.reviews.push(review);

    await review.save();
    await campground.save();

    req.flash('success', 'Created new review!');
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;

    await Campground.findByIdAndUpdate(id, {
        $pull: { reviews: reviewId }
    });

    await Review.findByIdAndDelete(reviewId);

    req.flash('success', 'Successfully deleted review!');
    res.redirect(`/campgrounds/${id}`);
};


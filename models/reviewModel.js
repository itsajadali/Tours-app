const mongoose = require("mongoose");
const Tour = require("./tourModel");

const reviewsSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can't be empty"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, "Review must be rated"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "A review must have a tour"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A review must have a user"],
    },
  },
  {
    // schema options.
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewsSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: "tour",
  //   select: "name",
  // })
  this.populate({
    path: "user",
    select: "name photo",
  });
  next();
});

// whats the different between static method and instance method?
// static method can be called on model

reviewsSchema.static.calcAvgRating = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);
  Tour.findByIdAndUpdate(tourId);
};

reviewsSchema.post("save", function () {
  // Review.calcAvgRating(this.tour); // Review is not defined this won't work

  this.constructor.calcAvgRating(this.tour); // this.constructor == Review
});

const Review = mongoose.model("Review", reviewsSchema);

module.exports = Review;

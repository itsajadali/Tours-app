const mongoose = require("mongoose");
// const Users = require("./userModel");
// eslint-disable-next-line import/no-extraneous-dependencies

const tourSchema = mongoose.Schema(
  {
    // schema definition.
    name: {
      type: String,
      required: [true, "A tour must have a name "],
      unique: true,
      trim: true,
      // validators
      maxLength: [40, "A tour name must have less then or equal to 40"],
      minLength: [10, "A tour name must have more then or equal to 3"],
      //validate: validator.is,
    },
    duration: {
      type: Number,
      required: [true, "A tour must have a duration "],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a maxGroupSize "],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty "],
      // validators
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "difficulty either, easy, medium or difficult ",
      },
    },
    ratingAverage: {
      type: Number,
      default: 4.5,

      // validators
      min: [1, "A tour rating must have more then or equal to 1"],
      max: [5, "A tour rating must have less then or equal to 5"],
    },
    ratingQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price "],
    },
    // custom validator
    priceDiscount: {
      type: Number,
      validator: {
        function(val) {
          return val < this.price;
        },
        message: "",
      },
    },
    summary: {
      type: String,
      trim: true, // will remove all the white space
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image "],
    },
    images: [String],
    createAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
    startDates: [Date],
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      // longitude then latitude
      coordinates: [Number],
      address: String,
      description: String,
    },
    // modeling by embedding:
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    ////////////////////////////////////////////////////
    // embedding users/guides
    // ! this code for learning embedding only
    // works on save only
    // you have to provide an array of id in body.req
    // use mongoDB middleware to handle the save // by adding the users id to the array
    // ? guides: Array,
    ////////////////////////////////////////////////////
    // ! child referencing
    // still you need to send the ids throw the req.body
    // no you have to populate it
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        // below u don't need to import User model
        ref: "User",
      },
    ],
  },

  {
    // schema options.
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// tourSchema.index({ price: 1 }); // 1 mean descending
tourSchema.index({ price: 1, ratingAverage: -1 });

// ! 1)
////////////////////////////////////////////////////
// !embedding middle ware
// ! only for learning
// tourSchema.pre("save", async function (next) {
//   // return a list of promises
//   const guidesPromise = this.guides.map(async (id) => await Users.findById(id));

//   // return a list of promises

//   this.guides = await Promise.all(guidesPromise);
//   next();
// });
////////////////////////////////////////////////////
// ! populate middleware

tourSchema.pre(/^find/, function (next) {
  this.populate("guides");

  next();
});

////////////////////////////////////////////////////
// ! 1) virtual populate

// this is parent that doesn't know the child data
tourSchema.virtual("reviews", {
  ref: "Review",
  // the name of the field in the other model (review model)
  foreignField: "tour",
  // the name of the field in the this model (I want to connect)
  localField: "_id",
});

////////////////////////////////////////////////////
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

tourSchema.pre("save", function (next) {
  console.log(this.name);
  next();
});

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;

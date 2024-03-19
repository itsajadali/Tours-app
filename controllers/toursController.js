// upper case because it is model
const Tour = require("../models/tourModel");
// const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");

exports.aliasTopTours = (req, res, next) => {
  req.query.limits = "5"; // req.query.limits objects.
  req.query.sort = "-ratingAverage,price";
  req.query.fields = "name, price, ratingAverage, summery, difficulty";
  next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, {
  path: "reviews",
});
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getToursStat = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingAverage: { $gte: 4.5 } }, // takes a document that specifies the query conditions
    },
    {
      // used to group documents by a specified field and perform aggregation operations,
      // such as counting or calculating averages, within each group.
      $group: {
        _id: null,
        count: { $sum: 1 },
        numRating: { $sum: "$ratingQuantity" },
        avgRating: { $avg: "$ratingAverage" }, // $avg another operator
        avgPrice: { $avg: "$price" }, // $avg another operator
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" }, //
      },
    },

    // {
    //   $project: {
    //     roundedValue: { $round: ["$avgRating", 1] },
    //   },
    // },

    {
      $sort: { avgPrice: 1 },
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

// calculating the busies month in give year:

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = req.params.year * 1; // ! be aware between the different of req.query and req.params
  const plan = await Tour.aggregate([
    {
      // (unwind) is used to deconstruct an array field and output one document for each element in the array
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`), // first day of the year!
          $lte: new Date(`${year}-12-31`), // last  day of the year!
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      plan,
    },
  });
});

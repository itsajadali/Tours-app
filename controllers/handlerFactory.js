const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIfeatures = require("../utils/apifeatures");

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`No tour found with that ID`, 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true, // the validators will run in the schema
    });

    if (!doc) {
      return next(new AppError(`No tour found with that ID`, 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        tour: newDoc,
      },
    });
  });

exports.getOne = (Model, populateOption) =>
  catchAsync(async (req, res, next) => {
    // populate function create query and that effect performance
    // don't use it a lot
    // let's take to a middle ware to query for all tours also
    // const tour = await Tour.findById(req.params.id).populate("guides");

    // 2) populate virtual property

    let query = Model.findById(req.params.id);

    if (populateOption) query = query.populate(populateOption);

    const doc = await query;

    if (!doc) {
      return next(new AppError(`No tour found with that ID`, 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIfeatures(Model.find(filter), req.query) // chaining the method
      .filter()
      .limitsField()
      .sort()
      .paginate();

    // const doc = await features.query.explain(); will return details about the performance

    const doc = await features.query.explain();
    res.status(200).json({
      status: "success",
      results: doc.length,
      data: {
        doc,
      },
    });
  });

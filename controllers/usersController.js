const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) create an error if user try to POSTs password data (this route for updating profile only)
  if (req.user.password || req.user.confirmPassword) {
    return next(
      new AppError(
        "this route is not for updating password, please user updateMyPassword",
        400,
      ),
    );
  }

  const { email, name } = req.body;
  const filtered = {
    name,
    email,
  };

  // why did we use findByIdAndUpdate? and not findById?
  // findByIdAndUpdate will not run required (validator)

  const updateUser = await User.findByIdAndUpdate(req.user.id, filtered, {
    new: true,
    runValidators: true,
  });

  res.status(400).json({
    status: "success",
    data: {
      user: updateUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getMe = (req, res, next) => {
  // to set the id of the logged in user and be able to use the getOne function
  req.params.id = req.user.id;
  next();
};
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

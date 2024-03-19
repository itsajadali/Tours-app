// eslint-disable-next-line import/no-extraneous-dependencies
const jwt = require("jsonwebtoken");

// make a function return a promise.
const { promisify } = require("util");
const crypto = require("crypto");

const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");

const signToken = (id) =>
  // creating the token.
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;

  // 2) saving user to DB
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });

  createSendToken(newUser, 201, res);
});
///////////////////////////////////////////////////////////////////////////////////////////////////////

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please enter password and email", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401)); // 401 unauthorized
  }

  createSendToken(user, 200, res);
});
///////////////////////////////////////////////////////////////////////////////////////////////////////
// ! protecting some info form user unless he's logged in

exports.protects = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Please login to access this resource", 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError("User is no longer exists", 401));
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401),
    );
  }
  req.user = currentUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("Please enter email correctly", 404));
  }

  const resetToken = user.createPasswordRestToken();

  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    "host",
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password
   and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Reset your password",
      message: message,
    });
    res.status(200).json({
      status: 200,
      message: "Email sent",
    });
  } catch (error) {
    user.passwordResetToken = undefined; // resting the token
    user.passwordResetExpires = undefined; // resting the time
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError("There was an error sending email try again later.", 500),
    );
  }
});

exports.restPassword = catchAsync(async (req, res, next) => {
  // * encrypt the token (to match the one in DB)
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // * get user based on the token.
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // * check if there is no user with such email

  if (!user) {
    return next(new AppError("token is invalid.", 400));
  }

  user.password = req.body.password; // from the body
  user.passwordConfirm = req.body.passwordConfirm; // from the body
  user.passwordResetToken = undefined; // removing this from DB
  user.passwordResetExpires = undefined; // removing this from DB
  await user.save(); // save it (run validator)

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.comparePassword(req.body.currentPassword, user.password))) {
    return next(new AppError("Enter the correct password", 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(user, 200, res);
});
///////////////////////////////////////////////////////////////////////////////////////////////////////

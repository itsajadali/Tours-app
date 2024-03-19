const express = require("express");
// eslint-disable-next-line import/no-extraneous-dependencies
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const toursRouter = require("./routes/toursRouts");
const usersRouter = require("./routes/usersRouts");
const reviewsRouter = require("./routes/reviewRouts");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const app = express();

app.use(helmet());

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 100,
  message: "Too many requests",
});

app.use("/api", limiter);

app.use(express.json({ limit: "10kb" }));

app.use(express.static(`${__dirname}/public`));

app.use(mongoSanitize());

app.use(xss());

app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingQuantity",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  }),
);

app.use("/api/v1/tours", toursRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/reviews", reviewsRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`${req.originalUrl} Not Found`, 404)); //m will send the entire class.
  //
});

app.use(globalErrorHandler);

module.exports = app;

const express = require("express");
const controller = require("../controllers/toursController");
const authController = require("../controllers/authController");
const reviewsRouter = require("./reviewRouts");

const router = express.Router();

//! 1) nested router old way
///////////////////////////////////////////////////////////////
// router
//   .route("/:tourId/reviews")
//   .post(
//     authController.protects,
//     authController.restrictTo("user"),
//     reviewsController.createReview,
//   );
///////////////////////////////////////////////////////////////
// 2) using EXPRESS

router.use("/:tourId/reviews", reviewsRouter);

router
  .route("/top-5-cheap")
  .get(controller.aliasTopTours, controller.getAllTours);

router.route("/tour-stat").get(controller.getToursStat);
router.route("/monthly-plan/:year").get(controller.getMonthlyPlan);

router
  .route("/")
  .get(controller.getAllTours)
  .post(
    authController.protects,
    authController.restrictTo("admin, lead-guid"),
    controller.createTour,
  );

router
  .route("/:id")
  .get(controller.getTour)
  .patch(
    authController.protects,
    authController.restrictTo("admin, lead-guid"),
    controller.updateTour,
  )
  .delete(
    authController.protects,
    authController.restrictTo("admin", "lead-guide"),
    controller.deleteTour,
  );

module.exports = router;

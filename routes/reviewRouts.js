const express = require("express");
const authController = require("../controllers/authController");

const reviewController = require("../controllers/reviewsController");

// mergeParams will make all params of mounted router be accessed
const router = express.Router({ mergeParams: true });

router.use(authController.protects);

router
  .route("/")
  .get(reviewController.getAllReview)
  .post(
    authController.restrictTo("user"),
    reviewController.setTourUsersIds,
    reviewController.createReview,
  );
router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo("user, admin"),
    reviewController.deleteReview,
  )
  .delete(
    authController.restrictTo("user, admin"),
    reviewController.deleteReview,
  );

module.exports = router;

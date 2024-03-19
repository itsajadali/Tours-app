const express = require("express");
const controller = require("../controllers/usersController");
const authController = require("../controllers/authController");

const router = express.Router();

router.route("/signup").post(authController.signup);
router.route("/login").post(authController.login);

router.use(authController.protects);

router.route("/updateMe").patch(authController.protects, controller.updateMe);
router.route("/deleteMe").delete(authController.protects, controller.deleteMe);

router.route("/updateMyPassword").patch(authController.updatePassword);

router.route("/forgotPassword").post(authController.forgotPassword);
router.route("/restPassword/:token").patch(authController.restPassword);

router.route("/me").get(controller.getMe, controller.getUser);

router.use(authController.restrictTo("admin"));

router.route("/").get(controller.getAllUsers);

router
  .route("/:id")
  .get(controller.getUser)
  .patch(controller.updateUser)
  .delete(controller.deleteUser);

module.exports = router;

const crypto = require("crypto");

const mongoose = require("mongoose");
const validator = require("validator");
// eslint-disable-next-line import/no-extraneous-dependencies
const bcrypt = require("bcrypt");

const userSchema = mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  name: {
    type: String,
    required: [true, "please enter you name"],
  },
  email: {
    type: String,
    required: [true, "please Enter your email"],
    unique: true,
    lowerCase: true,
    validate: [validator.isEmail, "provide vialed email"],
  },
  photo: String,
  password: {
    type: String,
    required: true,
    minLength: 8,

    // to hide it form showing up.
    // note that it saved to DB but not showing it to client when he make a request
    select: false,
  },

  passwordConfirm: {
    type: String,
    required: [true, "please confirm your password"],
    // ! Remember (very important) this works only on CREATE AND SAVE ! not UPDATE ...
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Password are not the same",
    },
  },
  changedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

///////////////////////////////////////////////////////////////////////////////////////////////////////
// ! middleware to encrypt password before saving it to DB (runs before create)

userSchema.pre("save", async function (next) {
  // enable this function only if password updated
  // imagine if the user only update the email we don't want to encrypt the password right?
  if (!this.isModified("password")) return next();

  // hash the password with the cost of 12
  this.password = await bcrypt.hash(this.password, 12); // the higher the better and slower encrypted

  // deleting passwordConfirm field (we only need for the user)
  this.passwordConfirm = undefined;
});

///////////////////////////////////////////////////////////////////////////////////////////////////////

userSchema.pre("save", function (next) {
  // is new to check if the document is new
  if (!this.isModified("password") || this.isNew) return next();

  // * saving to DB is slower then issued token
  this.passwordChangedAt = Date.now() - 100;
  next();
});

///////////////////////////////////////////////////////////////////////////////////////////////////////
// ! select only the active users
userSchema.pre(/^find/, function (next) {
  this.find({ active: true });
  next();
});

///////////////////////////////////////////////////////////////////////////////////////////////////////

// instead methods (works on all document)
// basically it compares between the encrypted password and entered password

userSchema.methods.comparePassword = async function (
  candidatePassword, // password coming from the user
  userPassword, // password stored in DB
) {
  // this.password does not Works here because we set select to false
  return await bcrypt.compare(candidatePassword, userPassword); // return true if there are the same
};
///////////////////////////////////////////////////////////////////////////////////////////////////////

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

///////////////////////////////////////////////////////////////////////////////////////////////////////
// ! to generate a token for rest password (instead method)

userSchema.methods.createPasswordRestToken = function () {
  // * password rest token should be a random string
  // * it doesn't need to be strong encrypted
  // * we use random crypto module form node

  const restToken = crypto.randomBytes(32).toString("hex"); // generating random string

  // this token we gonna sent it to the user so it's like a rest password
  // ! we can't just save this to DB we need to encrypt first.
  // however it does not need to be strong encrypt it

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(restToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

  return restToken; // we gonna sent it via email
};
///////////////////////////////////////////////////////////////////////////////////////////////////////
// user is a document
const User = mongoose.model("User", userSchema);
module.exports = User;

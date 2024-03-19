module.exports = function catchAsync(fn) {
  return function (req, res, next) {
    fn(req, res, next).catch(next);
  };
};
// module.exports = (controller) => async (req, res, next) => {
//   try {
//     await controller(req, res);
//   } catch (error) {
//     next(error);
//   }
// };

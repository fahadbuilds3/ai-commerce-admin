import ApiError from "../utils/ApiError.js";

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, "Forbidden"));
  }

  next();
};

export default authorizeRoles;

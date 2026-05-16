import jwt from "jsonwebtoken";

import prisma from "../config/prisma.js";

import ApiError from "../utils/ApiError.js";

const protect = async (
  req,
  res,
  next
) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith(
      "Bearer"
    )
  ) {
    token =
      req.headers.authorization.split(
        " "
      )[1];
  }

  if (!token) {
    return next(
      new ApiError(401, "Not authorized")
    );
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user =
      await prisma.user.findUnique({
        where: {
          id: decoded.userId,
        },
      });

    if (!user) {
      return next(
        new ApiError(401, "User not found")
      );
    }

    req.user = user;

    next();
  } catch (error) {
    next(
      new ApiError(401, "Invalid token")
    );
  }
};

export default protect;
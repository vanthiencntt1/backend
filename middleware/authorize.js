module.exports = function (roles) {
  return (req, res, next) => {
    // roles can be a single role string or an array of roles
    if (typeof roles === "string") {
      roles = [roles];
    }

    console.log("User role from token:", req.user.role);
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ msg: "Authorization denied, insufficient role" });
    }
    next();
  };
};

import User from "../models/User.js";
import { PLANS } from "../config/plans.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getPlans = asyncHandler(async (req, res) => {
  return ApiResponse(res, 200, PLANS);
});

// NOTE: there is no payment gateway wired up. This directly switches the
// user's plan so you can see the feature-gating work end to end. Before
// going live, replace this with a Stripe Checkout session and only ever
// set `plan` from a verified webhook (checkout.session.completed /
// customer.subscription.updated), never directly from a client request.
export const upgradePlan = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  if (!PLANS[plan]) throw new ApiError(422, "Unknown plan");
  const user = await User.findByIdAndUpdate(req.user._id, { plan }, { new: true });
  return ApiResponse(res, 200, user.toSafeObject(), `Switched to the ${PLANS[plan].name} plan`);
});

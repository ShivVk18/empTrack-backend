import express from "express";
import { getStatesDropdown } from "../../controllers/location/state.controller.js";
import { getCitiesDropdown } from "../../controllers/location/city.controller.js";
import {
  authenticate,
  ensureCompanyAccess,
} from "../../middlewares/auth.middleware.js";
import { getBankCodesDropdown } from "../../controllers/location/bankcode.controller.js";

const router = express.Router();

router.get("/states", getStatesDropdown);
router.get("/cities/:stateId", getCitiesDropdown);

router.get(
  "/bank-code",
  authenticate,
  ensureCompanyAccess,
  getBankCodesDropdown
);

export default router;

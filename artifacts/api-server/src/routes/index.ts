import { Router, type IRouter } from "express";
import healthRouter from "./health";
import servicesRouter from "./services";
import appointmentsRouter from "./appointments";
import recurringRouter from "./recurring";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import barbersRouter from "./barbers";
import blockedSlotsRouter from "./blocked-slots";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/services", servicesRouter);
router.use("/barbers", barbersRouter);
router.use("/blocked-slots", blockedSlotsRouter);
// Mount recurring BEFORE appointments so /appointments/recurring doesn't match /:id
router.use("/appointments/recurring", recurringRouter);
// Mount export BEFORE /:id so /appointments/export doesn't match /:id
router.use("/appointments", appointmentsRouter);
router.use("/auth", authRouter);
router.use("/dashboard", dashboardRouter);

export default router;

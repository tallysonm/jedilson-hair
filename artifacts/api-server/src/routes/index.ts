import { Router, type IRouter } from "express";
import healthRouter from "./health";
import servicesRouter from "./services";
import appointmentsRouter from "./appointments";
import recurringRouter from "./recurring";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import barbersRouter from "./barbers";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/services", servicesRouter);
router.use("/barbers", barbersRouter);
// Mount recurring BEFORE appointments so /appointments/recurring doesn't match /:id
router.use("/appointments/recurring", recurringRouter);
router.use("/appointments", appointmentsRouter);
router.use("/auth", authRouter);
router.use("/dashboard", dashboardRouter);

export default router;

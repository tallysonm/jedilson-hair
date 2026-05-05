import { Router, type IRouter } from "express";
import healthRouter from "./health";
import servicesRouter from "./services";
import appointmentsRouter from "./appointments";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/services", servicesRouter);
router.use("/appointments", appointmentsRouter);
router.use("/auth", authRouter);
router.use("/dashboard", dashboardRouter);

export default router;

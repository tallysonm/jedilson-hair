import type { NextFunction, Request, Response } from "express";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type CustomerAuthLocals = {
  customerUser: User;
};

export async function requireCustomer(
  req: Request,
  res: Response<unknown, CustomerAuthLocals>,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const [scheme, token, ...rest] = authHeader.trim().split(/\s+/);
    const isValidBearer = scheme === "Bearer" && !!token && rest.length === 0;

    if (!isValidBearer) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    res.locals.customerUser = data.user;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

import { PrismaClient } from "@prisma/client";

// Single Prisma client for the process. Used from M4 (cloud save) onward.
export const prisma = new PrismaClient();

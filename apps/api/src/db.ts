import { PrismaClient } from "@prisma/client";

// Single Prisma client for the process (accounts now, rider storage from M4).
export const prisma = new PrismaClient();

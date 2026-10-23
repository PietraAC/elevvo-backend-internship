import type { Role } from "../../generated/prisma/enums.js";
import { dateToString } from "../../utils/serialization.js";

type UserRecord = {
  id: number;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

export const toUserDto = (user: UserRecord) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  createdAt: dateToString(user.createdAt),
  updatedAt: dateToString(user.updatedAt)
});

import { PrismaClient } from "@prisma/client";
import cuid from "cuid";
import pkg from "crypto-js";
const { SHA256 } = pkg;

const SECRET_KEY_FOR_PASSWORD_HASH =
  process.env.SECRET_KEY_FOR_PASSWORD_HASH ?? "";

class Generator {
  mixstrings: string[];
  constructor() {
    this.mixstrings = Array.from(SECRET_KEY_FOR_PASSWORD_HASH);
  }
  count = 0;
  next() {
    if (this.count >= this.mixstrings.length) Error();
    const res = this.mixstrings[this.count];
    this.count += 1;
    return res;
  }
}

const encryptSha256 = (str: string) => {
  const hash = SHA256(str);
  return hash.toString();
};

const insertPepper = (str: string) => {
  const gen = new Generator();
  const pwh = [];
  const forcedArrayStr = [...str];
  for (let i in forcedArrayStr) {
    pwh.push(forcedArrayStr[i] + gen.next());
  }
  return pwh.join("");
};

const insertSalt = (str: string, userId: string) => {
  return `${str}:${userId}`;
};

const insertStretch = (str: string) => {
  return encryptSha256(str);
};

const encryptSha256Safe = (password: string, userId: string) => {
  let temp = password;
  temp = insertSalt(temp, userId);
  temp = insertPepper(temp);
  temp = encryptSha256(temp);
  temp = insertStretch(temp);
  return temp.toString();
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const main = async () => {
  const userId = cuid();
  await prisma.user.create({
    data: {
      id: userId,
      name: "ADMIN",
      email: "admin@example.com",
      password_hash: encryptSha256Safe("password", userId),
    },
  });
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

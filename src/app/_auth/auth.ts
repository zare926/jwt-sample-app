"use server";

import { prismaClient } from "../_util/prismaHelper";
import pkg from "crypto-js";
const { SHA256 } = pkg;
import * as jwt from "jsonwebtoken";
import { Algorithm } from "jsonwebtoken";
import { redirect } from "next/dist/server/api-utils";
import { cookies } from "next/headers";
import { stringify } from "querystring";
import { use } from "react";

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

export const fetchUser = async (email: string) => {
  const user = await prismaClient.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      password_hash: true,
    },
  });
  return user;
};

export const login = async (email: string, password?: string) => {
  const user = await fetchUser(email);

  if (!user) {
    throw Error("User not found");
  }

  const passwordHash = encryptSha256Safe(password ?? "", user.id);
  if (passwordHash !== user.password_hash) {
    throw Error("Password is incorrect");
  }

  const JWTSecret = process.env.JET_SECRET;
  if (!JWTSecret) {
    throw Error("JWT secret is not set");
  }
  const response = {
    userId: user.id,
    email: user.email,
    name: user.name,
  };

  const sessionTokenPayload = { ...response, tokenType: "session" };

  const sessionTokenOptions = {
    algorithm: "HS256" as Algorithm,
    expiresIn: "10s",
  };

  const sessionToken = jwt.sign(
    sessionTokenPayload,
    JWTSecret,
    sessionTokenOptions
  );
  const refreshTokenPayload = { ...response, tokenType: "refresh" };

  const refreshTokenOptions = {
    algorithm: "HS256" as Algorithm,
    expiresIn: "60s",
  };
  const refreshToken = jwt.sign(
    refreshTokenPayload,
    JWTSecret,
    refreshTokenOptions
  );

  const responseBody = {
    status: "success",
    ...response,
  };

  cookies().set("session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 30,
  });

  cookies().set("refresh", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 30,
  });

  return responseBody;
};

export const logout = async () => {
  cookies().delete("session");
  cookies().delete("refresh");
};

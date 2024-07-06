"use server";

import jwt, { VerifyErrors } from "jsonwebtoken";
import { fetchUser } from "./auth";

const JWTSecret = process.env.JET_SECRET ?? "";

export type RenewSession = {
  sessionToken?: string;
  refreshToken?: string;
  email?: string;
  userId?: string;
  name?: string;
};

export const renewSession = async (refreshToken: string) => {
  console.log(1818, refreshToken);
  const decode = () => {
    return new Promise((resolve, reject) => {
      jwt.verify(
        refreshToken,
        JWTSecret,
        async (err: any, decodedRefreshToken: any) => {
          if (err) {
            console.log(123131, err);
            reject(`Refresh token is invalid: ${err}`);
          } else {
            const email = decodedRefreshToken?.email;
            const loginRes = await fetchUser(email);
            if (!loginRes) {
              reject("User not found");
            }
            console.log(loginRes);
            const sessionTokenPayload = { ...loginRes, tokenType: "session" };

            const sessionTokenOptions = {
              algorithm: "HS256" as jwt.Algorithm,
              expiresIn: "3600s",
            };

            const sessionToken = jwt.sign(
              sessionTokenPayload,
              JWTSecret,
              sessionTokenOptions
            );

            const responseBody = {
              status: "success",
              sessionToken,
              refreshToken,
              email: loginRes?.email,
              userId: loginRes?.id,
              name: loginRes?.name,
            };

            resolve(responseBody);
          }
        }
      );
    });
  };
  return await decode();
};

export const authenticate = async (
  sessionToken: string,
  refreshToken: string
) => {
  let newSession: RenewSession;
  const jwtDecodeData = await new Promise((resolve, reject) => {
    jwt.verify(
      sessionToken,
      JWTSecret,
      async (err: VerifyErrors | null, decoded: any) => {
        if (err) {
          if (err.name === "TokenExpiredError") {
            // renewSessionでsessionを更新するためにはAPIRouteを使う必要あり
            const a = await renewSession(refreshToken);
            console.log(a);
            return;
          } else {
            reject(err);
            return;
          }
        }
        resolve(decoded);
      }
    );
  });

  return jwtDecodeData as RenewSession;
};

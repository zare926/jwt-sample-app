"use server";

import jwt, { VerifyErrors } from "jsonwebtoken";

const JWTSecret = process.env.JET_SECRET ?? "";

export type RenewSession = {
  sessionToken?: string;
  refreshToken?: string;
  email?: string;
  userId?: string;
  name?: string;
};

export const authenticate = async (
  session: {
    refreshToken: string;
    sessionToken: string;
  },
  domain: string
) => {
  let newSession: RenewSession;
  const jwtDecodeData = await new Promise((resolve, reject) => {
    jwt.verify(
      session.sessionToken,
      JWTSecret,
      async (err: VerifyErrors | null, decoded: any) => {
        if (err) {
          if (err.name === "TokenExpiredError") {
            // const res = await renewSession(session, domain);
            // newSession = res;
          } else {
            reject(err);
            return;
          }
          if (!newSession || !newSession.sessionToken) {
            reject(err);
            return;
          }
          resolve(newSession);
        }
        resolve(decoded);
      }
    );
  });

  return jwtDecodeData as RenewSession;
};

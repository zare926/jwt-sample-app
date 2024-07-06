import { cookies } from "next/headers";
import { authenticate } from "../_auth/jwtHelper";
import { redirect } from "next/navigation";
import {
  redirectErrorMessages,
  redirectErrorNames,
} from "../_util/errorHelper";
import { logout } from "../_auth/auth";

export default async function Successful() {
  const sessionToken = cookies().get("session")?.value ?? "";
  const refreshToken = cookies().get("refresh")?.value ?? "";
  let isRedirect = false;
  try {
    await authenticate(sessionToken, refreshToken);
  } catch (err) {
    console.error(err);
    if (
      !(err instanceof Error) ||
      (!redirectErrorMessages.includes(err.message) &&
        !redirectErrorNames.includes(err.name))
    ) {
      throw err;
    }
    isRedirect = true;
  } finally {
    if (isRedirect) {
      redirect(`/`);
    }
  }

  const logoutFunc = async () => {
    "use server";
    await logout();
    redirect("/");
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form action={logoutFunc}>
        <div className="flex flex-col items-center justify-center gap-4">
          <h1>Login Successful</h1>
          <button type="submit" className="border border-gray-300 p-2">
            Logout
          </button>
        </div>
      </form>
    </div>
  );
}

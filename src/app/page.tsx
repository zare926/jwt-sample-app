import { redirect } from "next/navigation";
import { login } from "./_auth/auth";

export default function Home() {
  const loginFunc = async (formData: FormData) => {
    "use server";
    const email = formData.get("email");
    const password = formData.get("password");
    let isSuccess = false;
    if (email && password) {
      try {
        await login(email as string, password as string);
        isSuccess = true;
      } catch (error) {
        console.log(error);
      } finally {
        if (isSuccess) {
          redirect("/successful");
        }
      }
    }
  };
  return (
    <main className="flex items-center justify-center min-h-screen">
      <form action={loginFunc}>
        <div className="flex flex-col items-center justify-center gap-4">
          <h1>Login Form</h1>
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="p-2 text-black"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="p-2 text-black"
          />
          <button type="submit" className="border border-gray-300 p-2">
            Login
          </button>
        </div>
      </form>
    </main>
  );
}

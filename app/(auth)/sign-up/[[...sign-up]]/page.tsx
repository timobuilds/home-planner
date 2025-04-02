import { SignUp } from "@clerk/nextjs";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign Up | Home Construction Planner",
};

export default function SignUpPage() {
  return <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />;
}

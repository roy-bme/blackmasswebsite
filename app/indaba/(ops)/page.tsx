import { redirect } from "next/navigation";

/**
 * `/indaba` lands on the dashboard by default. The layout has already
 * guaranteed the user is signed in and provisioned, so we can punt straight
 * to the role-appropriate entry point.
 */
export default function IndabaHomePage() {
  redirect("/indaba/dashboard");
}

import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = { title: "About | PredictaCore CMMS" };

export default function AboutPage() {
  return <AboutClient />;
}

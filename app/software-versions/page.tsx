import type { Metadata } from "next";
import VersionManagementClient from "./VersionManagementClient";

export const metadata: Metadata = {
  title: "Software Version History | PredictaCore CMMS",
  description: "Riwayat versi, change log, backup, update, dan audit software CMMS."
};

export default function SoftwareVersionsPage() {
  return <VersionManagementClient />;
}

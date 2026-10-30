import { DroneProvider } from "@/context/drone-provider";
import { FlightScreen } from "@/components/flight/flight-screen";

export default function FlyPage() {
  return <DroneProvider><FlightScreen /></DroneProvider>;
}

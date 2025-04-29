import SimpleMap from "../../components/Map";
import { AuthButtons } from "@/components/AuthButtons";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-between p-0">
      <div className="absolute top-0 left-0 w-full h-full">
        <SimpleMap />
      </div>
      <AuthButtons />
    </main>
  );
}

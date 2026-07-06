import { Suspense } from "react";
import { ExploreSurface } from "@/components/explore/ExploreSurface";

export default function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <ExploreSurface />
    </Suspense>
  );
}

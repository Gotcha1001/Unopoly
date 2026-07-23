// "use client";
// import { useState } from "react";
// import { getPropertyMedia } from "@/lib/Propertymedia";

// export function PropertyIcon({
//   propertyId,
//   className = "w-4 h-4 rounded-sm object-cover inline-block align-[-2px]",
// }: {
//   propertyId: string;
//   className?: string;
// }) {
//   const media = getPropertyMedia(propertyId);
//   const [failed, setFailed] = useState(false);

//   if (failed) return <span>{media.emoji}</span>;

//   return (
//     <img
//       src={media.iconSrc}
//       alt=""
//       onError={() => setFailed(true)}
//       className={className}
//     />
//   );
// }

"use client";
import { useState } from "react";
import { getPropertyMedia } from "@/lib/Propertymedia";

export function PropertyIcon({
  propertyId,
  className = "w-16 h-16 rounded-sm object-cover inline-block align-[-2px] mr-3",
}: {
  propertyId: string;
  className?: string;
}) {
  const media = getPropertyMedia(propertyId);
  const [failed, setFailed] = useState(false);

  if (failed) return <span>{media.emoji}</span>;

  return (
    <video
      key={media.videoSrc}
      src={media.videoSrc}
      autoPlay
      muted
      loop
      playsInline
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

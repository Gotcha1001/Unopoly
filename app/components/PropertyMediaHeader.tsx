// "use client";
// import { useState } from "react";
// import { getPropertyMedia } from "@/lib/Propertymedia";

// export function PropertyMediaHeader({ propertyId }: { propertyId: string }) {
//   const media = getPropertyMedia(propertyId);
//   const [videoFailed, setVideoFailed] = useState(false);

//   if (videoFailed) {
//     return <div className="text-5xl mb-2">{media.emoji}</div>;
//   }

//   return (
//     <div className="relative w-full h-36 -mt-7 -mx-7 mb-4 overflow-hidden rounded-t-3xl">
//       <video
//         key={media.videoSrc}
//         src={media.videoSrc}
//         autoPlay
//         muted
//         loop
//         playsInline
//         onError={() => setVideoFailed(true)}
//         className="w-full h-full object-cover"
//       />
//       <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,35,32,0.97)] via-transparent to-black/20" />
//     </div>
//   );
// }
"use client";
import { useState } from "react";
import { getPropertyMedia } from "@/lib/Propertymedia";

export function PropertyMediaHeader({
  propertyId,
  heightClass = "h-48",
}: {
  propertyId: string;
  heightClass?: string;
}) {
  const media = getPropertyMedia(propertyId);
  const [videoFailed, setVideoFailed] = useState(false);

  if (videoFailed) {
    return (
      <div
        className={`w-full ${heightClass} flex items-center justify-center text-6xl`}
      >
        {media.emoji}
      </div>
    );
  }

  return (
    <div className={`relative w-full ${heightClass}`}>
      <video
        key={media.videoSrc}
        src={media.videoSrc}
        autoPlay
        muted
        loop
        playsInline
        onError={() => setVideoFailed(true)}
        className="w-full h-full object-cover block"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,35,32,0.97)] via-transparent to-black/20" />
    </div>
  );
}

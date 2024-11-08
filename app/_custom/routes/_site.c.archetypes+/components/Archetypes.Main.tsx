import { Image } from "~/components/Image";

import { Badge } from "~/components/Badge";
import { Link } from "@remix-run/react";

import type { Archetype } from "~/db/payload-custom-types";
import { CardViewerModal } from "../../_site.c.cards+/components/CardViewerModal";

const tierEnum = {
   s: "S",
   a: "A",
   b: "B",
   c: "C",
};

export function ArchetypesMain({ data }: { data: { archetype: Archetype } }) {
   const { archetype } = data;

   return (
      <div className="grid tablet:grid-cols-2 gap-3 pb-4">
         <div
            className="flex max-tablet:w-full shadow-sm shadow-1 justify-center gap-2 flex-none 
            rounded-xl bg-2-sub p-3 border border-color-sub"
         >
            {archetype.highlightCards?.map(
               (card) =>
                  card.icon?.url && (
                     <div
                        className="max-w-32 flex items-center justify-center"
                        key={card.id}
                     >
                        <CardViewerModal card={card?.cards?.[0]} />
                     </div>
                  ),
            )}
         </div>
         <div>
            <div
               className="w-full flex flex-col justify-between divide-y divide-color-sub flex-grow items-center 
               border border-color-sub bg-2-sub rounded-xl shadow-sm shadow-1"
            >
               <div className="flex items-center justify-between gap-2 w-full p-3">
                  <div className="flex items-center gap-2">
                     <div className="text-sm font-bold">Energy</div>
                  </div>
                  {archetype.types && (
                     <div className="flex gap-1 justify-center">
                        {archetype.types?.map((type) => (
                           <Image
                              width={32}
                              height={32}
                              url={type.icon?.url}
                              alt={archetype.name ?? ""}
                              className="size-5 object-contain"
                              loading="lazy"
                              key={archetype.name}
                           />
                        ))}
                     </div>
                  )}
               </div>
               <div className="flex items-center justify-between gap-2 w-full p-3">
                  <div className="text-sm font-bold">Tier Rating</div>
                  <Badge color="purple">
                     {archetype.tier
                        ? tierEnum[archetype.tier as keyof typeof tierEnum]
                        : ""}{" "}
                     Tier
                  </Badge>
               </div>
            </div>
         </div>
      </div>
   );
}

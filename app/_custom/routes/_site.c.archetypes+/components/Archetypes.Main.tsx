import { Image } from "~/components/Image";

import { Badge } from "~/components/Badge";
import { Link } from "@remix-run/react";

import type { Archetype } from "~/db/payload-custom-types";

const tierEnum = {
   s: "S",
   a: "A",
   b: "B",
   c: "C",
};

export function ArchetypesMain({ data }: { data: { archetype: Archetype } }) {
   const { archetype } = data;

   return (
      <div className="flex max-tablet:flex-col w-full items-start gap-3 pb-5">
         <div className="flex flex-col max-tablet:w-full justify-center gap-2 flex-none">
            <Badge color="zinc" className="!justify-center">
               Highlight Cards
            </Badge>
            <div className="flex mx-auto space-x-2 rounded-xl">
               {archetype.highlightCards?.map(
                  (card) =>
                     card.icon?.url && (
                        <Link
                           key={card.id}
                           to={`/c/cards/${card?.cards?.[0]?.slug}`}
                        >
                           <Image
                              key={card.id}
                              url={card.icon?.url}
                              alt={card.name ?? ""}
                              className="w-36 object-contain"
                              width={200}
                              height={280}
                           />
                        </Link>
                     ),
               )}
            </div>
         </div>
         <div className="flex-grow max-tablet:w-full">
            <div className="w-full flex flex-col justify-between divide-y divide-color-sub flex-grow items-center border border-color-sub bg-2-sub rounded-xl shadow-sm shadow-1">
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

import { Image } from "~/components/Image";

import { Badge } from "~/components/Badge";
import { Link } from "@remix-run/react";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import type { Deck } from "~/db/payload-custom-types";
import { ContentEmbed } from "~/db/payload-types";
import { TextLink } from "~/components/Text";

const tierEnum = {
   s: "S",
   a: "A",
   b: "B",
   c: "C",
};

export function DecksMain({
   data,
}: {
   data: { deck: Deck & { deckBuildContent: ContentEmbed[] } };
}) {
   const { deck } = data;

   return (
      <div className="flex max-tablet:flex-col w-full items-start gap-3 pb-5">
         <div className="flex flex-col max-tablet:w-full justify-center gap-2 flex-none">
            <Badge color="zinc" className="!justify-center">
               Highlight Cards
            </Badge>
            <div className="flex mx-auto space-x-2 rounded-xl">
               {deck.highlightCards?.map(
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
                  {deck.deckTypes && (
                     <div className="flex gap-1 justify-center">
                        {deck.deckTypes?.map((type) => (
                           <Image
                              width={32}
                              height={32}
                              url={type.icon?.url}
                              alt={deck.name ?? ""}
                              className="size-5 object-contain"
                              loading="lazy"
                              key={deck.name}
                           />
                        ))}
                     </div>
                  )}
               </div>
               <div className="flex items-center justify-between gap-2 w-full p-3">
                  <div className="text-sm font-bold">Tier Rating</div>
                  <Badge color="purple">
                     {deck.tier
                        ? tierEnum[deck.tier as keyof typeof tierEnum]
                        : ""}{" "}
                     Tier
                  </Badge>
               </div>
               <div className="flex items-center justify-between gap-2 w-full p-3">
                  <div className="flex items-center gap-2">
                     <div className="text-sm font-bold">Cost</div>
                  </div>
                  <div className="text-1 text-sm">{deck.cost}</div>
               </div>
            </div>
            <div className="flex shadow shadow-1 justify-between items-center gap-2 w-full mt-3 bg-2-sub p-3 border rounded-lg border-color-sub">
               <div className="text-sm text-1">
                  Determine the optimal pack to pull by adding cards to your{" "}
                  <TextLink href="/collection-tracker">collection</TextLink>.
               </div>
               <Button
                  href="/pack-simulator"
                  color="fuchsia"
                  className="!px-2 !gap-1.5 !text-sm flex-none"
               >
                  Pack Simulator
                  <Icon name="chevron-right" size={16} />
               </Button>
            </div>
         </div>
      </div>
   );
}

import { Badge } from "~/components/Badge";
import { Image } from "~/components/Image";
import { TextLink } from "~/components/Text";

import { ShinyCard } from "./ShinyCard";
import type { EntryCardData } from "../$entryId";

export const cardRarityEnum = {
   C: "common",
   U: "uncommon",
   R: "rare holo",
   RR: "rare ultra",
   AR: "rare ultra",
   SAR: "rare ultra",
   SR: "rare ultra",
   IM: "rare secret",
   UR: "rare ultra",
};

export function CardsMain({ data }: EntryCardData) {
   const card = data?.card;

   const cardType = card?.cardType === "pokemon" ? "pokémon" : "trainer";

   const rarity =
      card?.rarity?.name && card.rarity.name in cardRarityEnum
         ? cardRarityEnum[card.rarity.name as keyof typeof cardRarityEnum]
         : "common";

   return (
      <div className="tablet:flex tablet:items-start tablet:gap-4">
         <div className="rounded-lg max-w-72 object-contain flex-none mx-auto max-tablet:mb-4 align-middle">
            {/* @ts-ignore */}
            <ShinyCard supertype={cardType} rarity={rarity}>
               <Image
                  width={367}
                  height={512}
                  url={
                     card.icon?.url ??
                     "https://static.mana.wiki/tcgwiki-pokemonpocket/Card_Back.png"
                  }
                  alt={card.name ?? "Card Image"}
               />
            </ShinyCard>
         </div>
         <section className="flex-grow">
            <div
               className="border border-color-sub divide-y divide-color-sub shadow-sm shadow-1 rounded-lg 
               mb-3 [&>*:nth-of-type(odd)]:bg-zinc-50 dark:[&>*:nth-of-type(odd)]:bg-dark350 overflow-hidden"
            >
               <div className="p-3 justify-between flex items-center gap-2">
                  <span className="font-semibold text-sm">Set</span>
                  <TextLink
                     href={`/c/sets/${card.set?.slug}`}
                     className="text-sm font-semibold flex items-center gap-2"
                  >
                     <span className="sr-only">{card.set?.name}</span>
                     {card.set?.logo?.url ? (
                        <Image
                           height={40}
                           className="h-7"
                           url={card.set?.logo?.url}
                        />
                     ) : (
                        card.set?.name
                     )}
                  </TextLink>
               </div>
               <div className="p-3 justify-between flex items-center gap-2">
                  <span className="font-semibold text-sm">Rarity</span>
                  <span className="text-sm font-semibold flex items-center gap-2">
                     <span>{card.rarity?.name}</span>
                     <Image
                        height={40}
                        className="h-5"
                        url={card.rarity?.icon?.url}
                     />
                  </span>
               </div>
               {card?.pokemonType ? (
                  <div className="p-3 justify-between flex items-center gap-2">
                     <span className="font-semibold text-sm">Type</span>
                     <span className="text-sm font-semibold flex items-center gap-2">
                        <span>{card.pokemonType?.name}</span>
                        <Image
                           height={40}
                           width={40}
                           className="size-4"
                           url={card.pokemonType?.icon?.url}
                        />
                     </span>
                  </div>
               ) : undefined}
               {card?.weaknessType ? (
                  <div className="p-3 justify-between flex items-center gap-2">
                     <span className="font-semibold text-sm">Weakness</span>
                     <span className="text-sm font-semibold flex items-center gap-2">
                        <span>{card.weaknessType?.name}</span>
                        <Image
                           height={40}
                           width={40}
                           className="size-4"
                           url={card.weaknessType?.icon?.url}
                        />
                     </span>
                  </div>
               ) : undefined}
               {card?.hp ? (
                  <div className="p-3 justify-between flex items-center gap-2">
                     <span className="font-semibold text-sm">HP</span>
                     <span className="text-sm font-semibold">{card.hp}</span>
                  </div>
               ) : undefined}
               {card?.retreatCost ? (
                  <div className="p-3 justify-between flex items-center gap-2">
                     <span className="font-semibold text-sm">Retreat Cost</span>
                     <span className="text-sm font-semibold">
                        {card.retreatCost}
                     </span>
                  </div>
               ) : undefined}
            </div>
            {card?.abilities ? (
               <div className="flex flex-col border border-color-sub rounded-lg bg-2-sub shadow-sm shadow-1 mb-3 p-3">
                  <div className="flex items-center gap-2 text-sm pb-1 font-bold">
                     <Badge color="red">Ability</Badge>
                     <span>{card.abilities.name}</span>
                  </div>
                  <div className="text-sm text-1">{card.abilities.desc}</div>
               </div>
            ) : undefined}
            {card?.movesInfo && card?.movesInfo?.length > 0 ? (
               <div className="flex flex-col border border-color-sub rounded-lg bg-2-sub shadow-sm shadow-1 divide-y divide-color-sub">
                  {card.movesInfo.map((move) => (
                     <div className="p-3" key={move.move?.name}>
                        <div className="flex items-center justify-between gap-2">
                           <div className="flex items-center gap-2">
                              {move.cost && move.cost.length > 0 ? (
                                 <div className="flex items-center gap-0.5 min-w-[70px]">
                                    {move.cost.map((cost) => (
                                       <div
                                          className="flex items-center gap-0.5"
                                          key={cost.id}
                                       >
                                          {cost.amount && cost.amount > 0
                                             ? Array.from({
                                                  length: cost.amount,
                                               }).map((_, index) => (
                                                  <Image
                                                     height={40}
                                                     width={40}
                                                     alt={
                                                        cost?.type?.name ?? ""
                                                     }
                                                     className="size-4"
                                                     url={cost.type?.icon?.url}
                                                  />
                                               ))
                                             : undefined}
                                       </div>
                                    ))}
                                 </div>
                              ) : undefined}
                              <div className="font-bold text-sm">
                                 {move.move?.name}
                              </div>
                           </div>
                           {move.damage ? (
                              <div className="font-bold text-sm">
                                 {move.damage}
                              </div>
                           ) : undefined}
                        </div>
                        {move.move?.desc ? (
                           <div className="text-sm text-1 pt-1.5">
                              {move.move?.desc}
                           </div>
                        ) : undefined}
                     </div>
                  ))}
               </div>
            ) : undefined}
            {card?.desc ? (
               <div className="text-sm text-1 p-3 border border-color-sub rounded-lg bg-2-sub shadow-sm shadow-1 mt-3">
                  {card.desc}
               </div>
            ) : undefined}
         </section>
      </div>
   );
}

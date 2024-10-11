import { Pack } from "~/db/payload-custom-types";
import { Image } from "~/components/Image";
import { Link } from "@remix-run/react";

export function PacksCards({ data }: { data: Pack }) {
   return (
      <>
         {Object.entries(
            data?.cards?.reduce(
               (acc, { card, rates }) => {
                  rates?.forEach(({ slot, percent }) => {
                     if (slot) {
                        if (!acc[slot]) acc[slot] = [];
                        if (card)
                           acc[slot].push({ ...card, percent: percent ?? 0 });
                     }
                  });
                  return acc;
               },
               {} as Record<
                  string,
                  ((typeof data.cards)[number]["card"] & { percent: number })[]
               >,
            ) ?? {},
         ).map(([slot, cards]) => (
            <div key={slot} className="mb-5">
               <div className="py-3 text-1">
                  {ratesEnum[slot as keyof typeof ratesEnum] || slot}
               </div>
               {Object.entries(
                  cards.reduce(
                     (acc, card) => {
                        if (card.rarity?.name) {
                           if (!acc[card.rarity.name])
                              acc[card.rarity.name] = [];
                           acc[card.rarity.name]?.push(card);
                        }
                        return acc;
                     },
                     {} as Record<string, typeof cards>,
                  ),
               ).map(([rarity, rarityCards]) => (
                  <div
                     key={rarity}
                     className="mb-2 border border-color-sub rounded-lg dark:bg-dark350 overflow-hidden shadow-sm shadow-1"
                  >
                     <h4 className="text-lg font-semibold bg-zinc-50 dark:bg-dark400 flex items-center justify-between border-b border-color-sub p-2 pr-3">
                        {ratesPerRarity[slot as keyof typeof ratesPerRarity]?.[
                           rarity as keyof (typeof ratesPerRarity)[keyof typeof ratesPerRarity]
                           //@ts-ignore
                        ]?.icon && (
                           <Image
                              height={100}
                              url={
                                 ratesPerRarity[
                                    slot as keyof typeof ratesPerRarity
                                 ][
                                    rarity as keyof (typeof ratesPerRarity)[keyof typeof ratesPerRarity]
                                    //@ts-ignore
                                 ].icon
                              }
                              alt={`${rarity} icon`}
                              className="h-6 object-contain"
                           />
                        )}
                        <span className="text-sm">
                           {ratesPerRarity[
                              slot as keyof typeof ratesPerRarity
                           ]?.[
                              rarity as keyof (typeof ratesPerRarity)[keyof typeof ratesPerRarity]
                              //@ts-ignore
                           ]?.value ?? 0}
                           %
                        </span>
                     </h4>
                     <div className="divide-y divide-color-sub">
                        {rarityCards.map((card) => (
                           <Link
                              to={`/c/cards/${card.slug}`}
                              key={card.id}
                              className="flex items-center justify-between gap-3 p-2.5 group"
                           >
                              <div className="flex items-center flex-grow gap-3">
                                 <Image
                                    width={80}
                                    height={112}
                                    url={card.icon?.url}
                                    alt={card.name ?? ""}
                                    className="w-8 object-contain"
                                 />
                                 <div className="font-semibold group-hover:underline">
                                    {card.name}
                                 </div>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                 {card.percent.toFixed(2)}%
                              </div>
                           </Link>
                        ))}
                     </div>
                  </div>
               ))}
            </div>
         ))}
      </>
   );
}

const ratesEnum = {
   _1_3: "Card inclusion probability rate for the 1st to 3rd cards",
   _4: "Card inclusion probability rate for the 4th card",
   _5: "Card inclusion probability rate for the 5th card",
};

const ratesPerRarity = {
   _1_3: {
      C: {
         value: 100,
         icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/c-rarity.png",
      },
   },
   _4: {
      UR: {
         value: 0.04,
         icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/UR-rarity.png",
      },
      IM: {
         value: 0.222,
         icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/IM-rarity.png",
      },
      SR: {
         value: 0.5,
         icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/SRSAR-Rarity.png",
      },
      AR: {
         value: 2.572,
         icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/AR-rarity.png",
      },
      RR: {
         value: 1.666,
         icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/RR-rarity.png",
      },
      R: {
         value: 5.0,
         icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/R-rarity.png",
      },
      U: {
         value: 90.0,
         icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/U-rarity.png",
      },
   },
   _5: {
      UR: {
         value: 0.16,
         icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/UR-rarity.png",
      },
      IM: {
         value: 0.888,
         icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/IM-rarity.png",
      },
      SR: {
         value: 2.0,
         icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/SRSAR-Rarity.png",
      },
      AR: {
         value: 10.288,
         icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/AR-rarity.png",
      },
      RR: {
         value: 6.664,
         icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/RR-rarity.png",
      },
      R: {
         value: 20.0,
         icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/R-rarity.png",
      },
      U: {
         value: 60.0,
         icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/U-rarity.png",
      },
   },
};

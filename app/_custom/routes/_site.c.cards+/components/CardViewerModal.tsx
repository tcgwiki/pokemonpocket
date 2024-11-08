import { Dialog } from "~/components/Dialog";
import { Image } from "~/components/Image";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";

import { ShinyCard } from "./ShinyCard";
import { useState } from "react";
import type { Card } from "~/db/payload-custom-types";
import { cardRarityEnum } from "./Cards.Main";

export function CardViewerModal({
   card,
   children,
}: {
   card: Card | undefined;
   children: React.ReactNode;
}) {
   const [isOpen, setIsOpen] = useState(false);
   const cardType = card?.cardType === "pokemon" ? "pokémon" : "trainer";

   const rarity =
      card?.rarity?.name && card.rarity.name in cardRarityEnum
         ? cardRarityEnum[card.rarity.name as keyof typeof cardRarityEnum]
         : "common";

   return (
      <>
         <Dialog
            className="relative flex items-center justify-center"
            size="tablet"
            onClose={setIsOpen}
            open={isOpen}
         >
            <div
               className="flex items-center flex-col gap-5 justify-center"
               style={{
                  viewTransitionName: card?.slug ?? undefined,
               }}
            >
               {/* @ts-ignore */}
               <ShinyCard supertype={cardType} rarity={rarity}>
                  <Image
                     className="object-contain"
                     width={367}
                     height={512}
                     url={
                        card?.icon?.url ??
                        "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                     }
                     alt={card?.name ?? "Card Image"}
                     loading="lazy"
                  />
               </ShinyCard>
               <Button href={`/c/cards/${card?.slug}`}>
                  Go to card
                  <Icon name="chevron-right" size={16} />
               </Button>
            </div>
         </Dialog>
         <button onClick={() => setIsOpen(true)} className="relative">
            {children ? (
               children
            ) : (
               <>
                  <div className="sr-only">{card?.name}</div>
                  <Image
                     className="object-contain"
                     width={367}
                     height={512}
                     url={
                        card?.icon?.url ??
                        "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                     }
                     alt={card?.name ?? "Card Image"}
                     loading="lazy"
                  />
               </>
            )}
         </button>
      </>
   );
}

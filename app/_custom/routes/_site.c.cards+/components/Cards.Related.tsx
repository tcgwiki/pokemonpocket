import { Link } from "@remix-run/react";
import { Image } from "~/components/Image";
import { EntryCardData } from "../$entryId";
import { SectionTitle } from "~/routes/_site+/c_+/$collectionId_.$entryId/components/SectionTitle";

export function CardsRelated({ data }: EntryCardData) {
   const relatedCards = data.relatedPokemon.docs[0]?.cards;

   const currentCardId = data.card.id;

   const listWithoutCurrentCard = relatedCards?.filter(
      (card) => card.id !== currentCardId,
   );

   return (
      <div>
         {listWithoutCurrentCard && (
            <>
               <SectionTitle customSlug="related" customTitle="Related Cards" />
               <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4">
                  {listWithoutCurrentCard.map((card) => (
                     <Link
                        key={card.name}
                        className="block border border-zinc-200 dark:border-zinc-600/50
                        rounded-lg bg-3-sub relative p-2 shadow-sm shadow-1"
                        to={`/c/cards/${card.slug}`}
                     >
                        <div className="text-sm font-bold pb-1 sr-only">
                           {card.name}
                        </div>
                        {card.set?.logo?.url ? (
                           <Image
                              className="object-contain h-9 -mb-4 z-20 relative"
                              height={72}
                              url={card.set?.logo?.url}
                           />
                        ) : undefined}
                        <Image
                           className="object-contain"
                           width={367}
                           height={512}
                           url={
                              card.icon?.url ??
                              "https://static.mana.wiki/tcgwiki-pokemonpocket/Card_Back.png"
                           }
                        />
                        <div className="flex items-center gap-2 justify-between pt-2">
                           <Image
                              className="object-contain h-5"
                              height={48}
                              url={card.rarity?.icon?.url}
                           />
                           {card.pokemonType?.icon?.url ? (
                              <Image
                                 className="size-4 object-contain"
                                 width={40}
                                 height={40}
                                 url={card.pokemonType?.icon?.url}
                              />
                           ) : undefined}
                        </div>
                     </Link>
                  ))}
               </div>
            </>
         )}
      </div>
   );
}

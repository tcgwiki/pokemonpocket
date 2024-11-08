import { useEffect, useState, useCallback } from "react";
import { Link, useFetcher } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { memo } from "react";

import { Button } from "~/components/Button";
import { Dialog } from "~/components/Dialog";
import { Icon } from "~/components/Icon";
import { Image } from "~/components/Image";
import type { Card } from "~/db/payload-custom-types";
import { fuzzyFilter } from "~/routes/_site+/c_+/_components/fuzzyFilter";
import { ListTable } from "~/routes/_site+/c_+/_components/ListTable";

import { cardRarityEnum } from "../../_site.c.cards+/components/Cards.Main";
import { ShinyCard } from "../../_site.c.cards+/components/ShinyCard";
import { DeckLoaderData } from "../$entryId";
import clsx from "clsx";
import { isAdding } from "~/utils/form";
import { useRootLoaderData } from "~/utils/useSiteLoaderData";
import { Input, InputGroup } from "~/components/Input";
import { useDebouncedValue, useIsMount } from "~/utils/use-debounce";
import { ListboxLabel, ListboxOption, Listbox } from "~/components/Listbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/Tooltip";
import {
   Dropdown,
   DropdownButton,
   DropdownItem,
   DropdownMenu,
} from "~/components/Dropdown";
import { SwitchField, Switch } from "~/components/Switch";
import { Description, Label } from "~/components/Fieldset";
import { ManaEditor } from "~/routes/_editor+/editor";
import { initialValue } from "~/routes/_editor+/core/utils";

import type { Descendant } from "slate";
import { toast } from "sonner";
import { EditorView } from "~/routes/_editor+/core/components/EditorView";

import dt from "date-and-time";

const deckBuilderTrayColumnHelper = createColumnHelper<Card>();

const isValidCardAddition = (
   totalCards: number,
   existingCardCount?: number,
) => {
   if (existingCardCount && existingCardCount >= 2) {
      toast.error("Maximum of 2 copies per card allowed in deck");
      return false;
   }
   if (totalCards >= 20) {
      toast.error("Maximum of 20 cards allowed in deck");
      return false;
   }
   return true;
};

export function DecksDeck({ data }: { data: DeckLoaderData }) {
   const {
      deck,
      allCards,
      deckCards: initialDeckCards,
      archetypes,
      userInfo,
   } = data;
   const { user } = useRootLoaderData();
   const isOwner = deck.user === user?.id;
   const fetcher = useFetcher();
   const isMount = useIsMount();

   const [deckCards, setDeckCards] = useState(initialDeckCards);

   const sortCards = useCallback(
      (cards: (Card & { count?: number; isHighlighted?: boolean })[]) => {
         return [...cards].sort((a, b) => {
            // First sort by highlight status
            if (a.isHighlighted !== b.isHighlighted)
               return a.isHighlighted ? -1 : 1;

            // Then sort by card type (pokemon first)
            if (a.cardType !== b.cardType)
               return a.cardType === "pokemon" ? -1 : 1;

            // For trainer cards, sort by trainer type
            if (a.cardType === "trainer" && b.cardType === "trainer") {
               // Define trainer type order: item -> fossil -> supporter
               const trainerTypeOrder = { item: 0, fossil: 1, supporter: 2 };
               const aOrder =
                  trainerTypeOrder[
                     a.trainerType as keyof typeof trainerTypeOrder
                  ] ?? 3;
               const bOrder =
                  trainerTypeOrder[
                     b.trainerType as keyof typeof trainerTypeOrder
                  ] ?? 3;
               if (aOrder !== bOrder) return aOrder - bOrder;
            }

            // Finally sort by name
            return (a.name ?? "").localeCompare(b.name ?? "");
         });
      },
      [],
   );

   const handleAddCard = useCallback(
      (cardId: string) => {
         const totalCards = deckCards.reduce(
            (sum, card) => sum + (card.count ?? 0),
            0,
         );
         const existingCard = deckCards.find((card) => card.id === cardId);

         if (!isValidCardAddition(totalCards, existingCard?.count)) return;

         if (existingCard) {
            //@ts-ignore
            setDeckCards((prev) =>
               sortCards(
                  prev.map((card) =>
                     card.id === cardId
                        ? { ...card, count: card.count + 1 }
                        : card,
                  ),
               ),
            );
            return;
         }

         const cardToAdd = allCards.find((card) => card.id === cardId);
         if (cardToAdd) {
            //@ts-ignore
            setDeckCards((prev) =>
               sortCards([...prev, { ...cardToAdd, count: 1 }]),
            );
         }
      },
      [deckCards, allCards, sortCards],
   );

   const handleUpdateCard = useCallback((cardId: string, newCount: number) => {
      if (newCount === 0) {
         setDeckCards((prev) => prev.filter((card) => card.id !== cardId));
      } else {
         setDeckCards((prev) =>
            prev.map((card) =>
               card.id === cardId ? { ...card, count: newCount } : card,
            ),
         );
      }
   }, []);

   const [deckName, setDeckName] = useState(deck.name);
   const debouncedDeckName = useDebouncedValue(deckName, 1200);

   const isDeckNameUpdating = isAdding(fetcher, "updateDeckName");

   const isArchetypeUpdating = isAdding(fetcher, "updateArchetype");

   const isDeckTypeUpdating = isAdding(fetcher, "updateDeckTypes");

   const disabled =
      isDeckNameUpdating || isArchetypeUpdating || isDeckTypeUpdating;

   const deckLink = `/c/decks/${deck.slug}`;

   const [description, setDescription] = useState(deck.description);
   const debouncedDescription = useDebouncedValue(description, 1000);

   useEffect(() => {
      if (!isMount) {
         fetcher.submit(
            {
               deckId: deck.id,
               deckName: debouncedDeckName ?? "",
               intent: "updateDeckName",
            },
            { method: "POST" },
         );
      }
   }, [debouncedDeckName]);

   useEffect(() => {
      if (!isMount) {
         fetcher.submit(
            {
               description: JSON.stringify(debouncedDescription),
               deckId: deck.id,
               intent: "updateDescription",
            },
            { method: "POST" },
         );
      }
   }, [debouncedDescription]);

   const debouncedDeckCards = useDebouncedValue(deckCards, 1000);

   useEffect(() => {
      if (isMount) return;

      const updateData = {
         deckId: deck.id,
         deckCards: JSON.stringify(
            debouncedDeckCards.map(({ id, count }) => ({
               card: id,
               count,
            })),
         ),
         intent: "updateDeckCards",
      };

      fetcher.submit(updateData, { method: "POST" });
   }, [debouncedDeckCards]);

   const deckBuilderTrayGridView = deckBuilderTrayColumnHelper.accessor(
      "name",
      {
         filterFn: fuzzyFilter,
         cell: (info) => {
            return (
               <Tooltip setDelay={800} placement="right">
                  <TooltipTrigger
                     disabled={disabled}
                     onClick={() => handleAddCard(info.row.original?.id ?? "")}
                     className="group relative"
                  >
                     <Image
                        className="object-contain hover:cursor-pointer"
                        width={367}
                        height={512}
                        url={
                           info.row.original?.icon?.url ??
                           "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                        }
                        alt={info.row.original?.name ?? "Card Image"}
                        loading="lazy"
                     />
                     <Icon
                        name="plus"
                        size={20}
                        className="dark:text-white text-zinc-900 absolute opacity-0 group-hover:opacity-100
                           top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                     />
                  </TooltipTrigger>
                  <TooltipContent>
                     <Image
                        className={clsx("object-contain w-[300px]")}
                        width={367}
                        height={512}
                        url={
                           info.row.original?.icon?.url ??
                           "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                        }
                        alt={info.row.original?.name ?? "Card Image"}
                        loading="lazy"
                     />
                  </TooltipContent>
               </Tooltip>
            );
         },
      },
   );

   // Update highlight handling to maintain sort order
   const handleHighlight = async (
      cardId: string,
      currentHighlightState: boolean,
   ) => {
      //@ts-ignore
      setDeckCards((prev) =>
         sortCards(
            prev.map((card) =>
               card.id === cardId
                  ? { ...card, isHighlighted: !currentHighlightState }
                  : card,
            ),
         ),
      );

      try {
         await fetcher.submit(
            {
               deckId: deck.id,
               cardId,
               intent: "highlightCard",
            },
            { method: "POST" },
         );
      } catch (error) {
         // Revert on error
         //@ts-ignore
         setDeckCards((prev) =>
            sortCards(
               prev.map((card) =>
                  card.id === cardId
                     ? { ...card, isHighlighted: currentHighlightState }
                     : card,
               ),
            ),
         );
         toast.error("Failed to update highlight status");
      }
   };

   // Add this state to track optimistic updates
   const [optimisticTypes, setOptimisticTypes] = useState(deck.types ?? []);

   // Add this effect to sync optimistic state with server state
   useEffect(() => {
      setOptimisticTypes(deck.types ?? []);
   }, [deck.types]);

   const totalPokemonCards = deckCards
      .filter((card) => card.cardType === "pokemon")
      .reduce((sum, card) => sum + (card.count ?? 0), 0);

   const totalSupporterCards = deckCards
      .filter((card) => card.trainerType === "supporter")
      .reduce((sum, card) => sum + (card.count ?? 0), 0);

   const totalItemCards = deckCards
      .filter(
         (card) => card.trainerType === "item" || card.trainerType === "fossil",
      )
      .reduce((sum, card) => sum + (card.count ?? 0), 0);

   const totalPokemonCardsWidthPercent = (totalPokemonCards / 20) * 100;
   const totalSupporterCardsWidthPercent = (totalSupporterCards / 20) * 100;
   const totalItemCardsWidthPercent = (totalItemCards / 20) * 100;

   const showDescription =
      //@ts-ignore
      !!deck?.description?.[0]?.children?.[0]?.text || isOwner;

   return (
      <div>
         {isOwner && (
            <>
               <div className="flex items-center gap-2">
                  <div className="flex-grow">
                     <div className="text-sm text-1 pb-1.5 pl-0.5 font-semibold">
                        Deck Name
                     </div>
                     <InputGroup>
                        {isDeckNameUpdating ? (
                           <Icon
                              name="loader-2"
                              size={16}
                              className="animate-spin"
                           />
                        ) : (
                           <Icon name="text" size={16} />
                        )}
                        <Input
                           placeholder="Type a deck name..."
                           disabled={disabled}
                           className="mb-4 w-full"
                           defaultValue={deck.name ?? ""}
                           name="deckName"
                           type="text"
                           onChange={(e: any) => {
                              setDeckName(e.target.value);
                           }}
                        />
                     </InputGroup>
                  </div>
                  <Dropdown>
                     <DropdownButton
                        color="light/zinc"
                        className="tablet:size-9 mt-2.5"
                     >
                        <Icon name="ellipsis" size={16} />
                     </DropdownButton>
                     <DropdownMenu>
                        <DropdownItem
                           onClick={() => {
                              fetcher.submit(
                                 { deckId: deck.id, intent: "deleteDeck" },
                                 { method: "POST" },
                              );
                           }}
                        >
                           Delete
                        </DropdownItem>
                     </DropdownMenu>
                  </Dropdown>
               </div>
               <div className="text-sm text-1 pb-1.5 pl-0.5 font-semibold flex items-center gap-1.5">
                  <span>Archetype</span>
                  <Tooltip placement="right">
                     <TooltipTrigger>
                        <Icon title="Archetype" name="info" size={14} />
                     </TooltipTrigger>
                     <TooltipContent className="text-sm w-40 bg-zinc-900 rounded-lg p-2 text-white">
                        Deck archetype refers to a specific strategy or theme
                        that defines how a deck is built and played.
                     </TooltipContent>
                  </Tooltip>
               </div>
               <Listbox
                  disabled={disabled}
                  className="mb-4"
                  value={deck.archetype?.id ?? ""}
                  defaultValue={deck.archetype?.id}
                  onChange={(archetypeId: string) => {
                     fetcher.submit(
                        {
                           deckId: deck.id,
                           archetypeId,
                           intent: "updateArchetype",
                        },
                        { method: "POST" },
                     );
                  }}
               >
                  {archetypes.map((archetype) => (
                     <ListboxOption key={archetype.id} value={archetype.id}>
                        <ListboxLabel>{archetype.name}</ListboxLabel>
                     </ListboxOption>
                  ))}
               </Listbox>
               <div className="text-sm text-1 pb-1.5 font-semibold">Energy</div>
               <div className="grid grid-cols-8 gap-3 flex-grow w-full pb-5">
                  {deckTypes.map((type) => {
                     const isSelected = optimisticTypes.some(
                        (t) => t.id === type.value,
                     );
                     return (
                        <button
                           disabled={disabled}
                           onClick={() => {
                              // Check if we're trying to add a new type when already at limit
                              if (!isSelected && optimisticTypes.length >= 3) {
                                 toast.error(
                                    "Maximum of 3 types allowed per deck",
                                 );
                                 return;
                              }

                              // Optimistically update the UI
                              if (isSelected) {
                                 setOptimisticTypes((prev) =>
                                    prev.filter((t) => t.id !== type.value),
                                 );
                              } else {
                                 setOptimisticTypes((prev: any) => [
                                    ...prev,
                                    { id: type.value },
                                 ]);
                              }

                              fetcher.submit(
                                 {
                                    deckId: deck.id,
                                    deckType: type.value,
                                    intent: "updateDeckTypes",
                                 },
                                 { method: "POST" },
                              );
                           }}
                           key={type.value}
                           className={clsx(
                              isSelected
                                 ? "bg-zinc-200 border-zinc-400 dark:bg-zinc-500/80 dark:border-zinc-400"
                                 : "bg-white dark:bg-dark450 dark:hover:bg-dark500 border-color-sub hover:bg-zinc-50 hover:border-zinc-300 dark:hover:border-zinc-500",
                              "flex items-center border justify-center gap-1 rounded-lg py-1 shadow-sm shadow-1",
                           )}
                        >
                           <Image
                              className="size-5 object-contain"
                              width={40}
                              height={40}
                              url={type.icon}
                              loading="lazy"
                           />
                        </button>
                     );
                  })}
               </div>
               <SwitchField disabled={disabled} fullWidth>
                  <Label className="font-bold">Public</Label>
                  <Description className="flex items-center gap-2 w-full">
                     <span>
                        Make your deck public to allow anyone to view it
                     </span>
                  </Description>
                  <Switch
                     onChange={() => {
                        fetcher.submit(
                           { deckId: deck.id, intent: "toggleDeckPublic" },
                           { method: "POST" },
                        );
                     }}
                     defaultChecked={deck.isPublic ?? false}
                     color="emerald"
                  />
                  {deckLink && (
                     <Tooltip placement="left">
                        <TooltipTrigger
                           className="dark:bg-dark500 bg-white mt-1 shadow-sm dark:border-zinc-500
                              flex items-center gap-1 border border-zinc-200 shadow-1
                              rounded-full px-3 py-1 text-xs dark:text-zinc-100 justify-center"
                           onClick={() => {
                              navigator.clipboard.writeText(
                                 window.location.origin + deckLink,
                              );
                              toast.success("Copied to clipboard");
                           }}
                        >
                           <Icon
                              name="link"
                              className="dark:text-white text-zinc-900"
                              size={10}
                           />
                        </TooltipTrigger>
                        <TooltipContent>
                           Copy deck link to clipboard
                        </TooltipContent>
                     </Tooltip>
                  )}
               </SwitchField>

               <div className="border border-color-sub p-3 pt-0 rounded-xl mb-4">
                  <ListTable
                     columnViewability={{
                        pokemonType: false,
                        cardType: false,
                        isEX: false,
                     }}
                     hideViewMode={true}
                     pageSize={allCards.length}
                     gridView={deckBuilderTrayGridView}
                     gridContainerClassNames="whitespace-nowrap overflow-y-hidden overflow-x-auto  
                     dark:scrollbar-thumb-dark500 dark:scrollbar-track-bg2Dark grid grid-rows-2 grid-flow-col gap-2
                     scrollbar-thumb-zinc-200 scrollbar-track-zinc-50 scrollbar"
                     gridCellClassNames="relative inline-flex items-center justify-center w-24"
                     defaultViewType="grid"
                     data={{ listData: { docs: allCards } }}
                     columns={deckBuilderTrayColumns}
                     filters={deckCardFilters}
                     pager={false}
                  />
               </div>
            </>
         )}
         <div className="text-[10px] flex items-center gap-2 font-bold text-1">
            {dt.format(new Date(deck.updatedAt), "MMM DD")}
         </div>
         <div className="flex items-center justify-between gap-2 mt-1.5 mb-4 py-2 border-y-2 border-color-sub relative">
            {userInfo && (
               <div className="flex items-center gap-2">
                  {userInfo.avatar ? (
                     <Image
                        className="size-8 border border-color-sub object-contain rounded-full"
                        width={64}
                        height={64}
                        url={userInfo.avatar}
                        loading="lazy"
                     />
                  ) : undefined}
                  <div className="flex gap-1 flex-col">
                     <span className="text-sm font-semibold">
                        {userInfo.username}
                     </span>
                     <div className="flex items-center gap-1.5">
                        {deck?.types && deck?.types?.length > 0 && (
                           <div className="flex items-center gap-0.5">
                              {deck.types.map((type) => (
                                 <Image
                                    className="size-3 object-contain"
                                    width={40}
                                    height={40}
                                    url={type.icon?.url}
                                    loading="lazy"
                                 />
                              ))}
                           </div>
                        )}
                        <Link
                           className="text-xs text-1 hover:underline"
                           to={`/c/archetypes/${deck.archetype?.slug}`}
                        >
                           {deck.archetype?.name}
                        </Link>
                     </div>
                  </div>
               </div>
            )}
            <div className="flex items-center justify-end rounded-full overflow-hidden absolute -top-[3px] right-0 w-52">
               <div
                  className="h-1 block bg-gray-500"
                  style={{ width: `${totalPokemonCardsWidthPercent}%` }}
               />
               <div
                  className="h-1 block bg-blue-500"
                  style={{ width: `${totalItemCardsWidthPercent}%` }}
               />
               <div
                  className="h-1 block bg-orange-500"
                  style={{ width: `${totalSupporterCardsWidthPercent}%` }}
               />
            </div>
            <div className="text-sm flex items-center gap-4">
               {totalPokemonCards > 0 && (
                  <div>
                     <span>{totalPokemonCards} </span>
                     <span className="text-xs text-1">Pokémon</span>
                  </div>
               )}
               {totalItemCards > 0 && (
                  <div>
                     <span>{totalItemCards} </span>
                     <span className="text-xs text-1">
                        Item{totalItemCards === 1 ? "" : "s"}
                     </span>
                  </div>
               )}
               {totalSupporterCards > 0 && (
                  <div>
                     <span>{totalSupporterCards} </span>
                     <span className="text-xs text-1">
                        Supporter{totalSupporterCards === 1 ? "" : "s"}
                     </span>
                  </div>
               )}
            </div>
         </div>

         {deckCards?.length > 0 ? (
            <div className="tablet:grid-cols-5 grid grid-cols-3 gap-2">
               {deckCards.map((card) => (
                  <DeckCell
                     key={card.id}
                     card={card}
                     isOwner={isOwner}
                     count={card.count}
                     onUpdate={handleUpdateCard}
                     onHighlight={handleHighlight}
                  />
               ))}
            </div>
         ) : (
            <div className="text-center text-sm text-zinc-500">
               No cards in deck
            </div>
         )}
         {showDescription && (
            <>
               <div className="pt-6 text-xs font-semibold flex items-center gap-1.5">
                  <Icon name="text" className="text-1" size={15} />
                  Description
               </div>
               <div className="mb-4 mt-2 py-3 border-y-2 border-color-sub border-dotted">
                  {isOwner ? (
                     <ManaEditor
                        onChange={(value) => {
                           setDescription(value);
                        }}
                        defaultValue={
                           (deck.description ?? initialValue()) as Descendant[]
                        }
                     />
                  ) : (
                     <EditorView data={deck.description} />
                  )}
               </div>
            </>
         )}
      </div>
   );
}

const DeckCell = memo(function DeckCell({
   card,
   count,
   isOwner,
   onUpdate,
   onHighlight,
}: {
   card: Card & { count?: number; isHighlighted?: boolean };
   count: number;
   isOwner: boolean;
   onUpdate: (cardId: string, newCount: number) => void;
   onHighlight: (
      cardId: string,
      currentHighlightState: boolean,
   ) => Promise<void>;
}) {
   const [isOpen, setIsOpen] = useState(false);
   const [isHighlighting, setIsHighlighting] = useState(false);

   const cardType = card?.cardType === "pokemon" ? "pokémon" : "trainer";

   const rarity =
      card?.rarity?.name && card.rarity.name in cardRarityEnum
         ? cardRarityEnum[card.rarity.name as keyof typeof cardRarityEnum]
         : "common";

   const handleHighlightClick = async () => {
      if (isHighlighting) return;
      setIsHighlighting(true);
      await onHighlight(card.id, !!card.isHighlighted);
      setIsHighlighting(false);
   };

   return (
      <div className="relative group flex items-center justify-center">
         {isOwner ? (
            <Tooltip>
               <TooltipTrigger
                  onClick={handleHighlightClick}
                  className={clsx(
                     "hidden group-hover:block absolute top-1 right-1 rounded-md p-1 z-20",
                     card.isHighlighted ? "bg-yellow-500" : "bg-zinc-900",
                  )}
               >
                  {isHighlighting ? (
                     <Icon name="loader-2" className="animate-spin" size={12} />
                  ) : (
                     <Icon
                        name="star"
                        className={clsx(
                           card.isHighlighted
                              ? "text-yellow-800"
                              : "text-white",
                        )}
                        title="Add to Highlights"
                        size={12}
                     />
                  )}
               </TooltipTrigger>
               <TooltipContent>
                  {card.isHighlighted
                     ? "Remove from Highlights"
                     : "Add to Highlights"}
               </TooltipContent>
            </Tooltip>
         ) : undefined}
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
         <button
            onClick={
               !isOwner
                  ? () => setIsOpen(true)
                  : () => {
                       onUpdate(card?.id ?? "", (count ?? 1) - 1);
                    }
            }
            className="relative"
         >
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
            <div
               className="absolute bottom-1 right-1 text-xs text-white font-bold
                   size-6 rounded-md flex items-center justify-center bg-zinc-900"
            >
               <span className="text-xs">x</span> {count}
            </div>
         </button>
      </div>
   );
});

export const deckBuilderTrayColumns = [
   deckBuilderTrayColumnHelper.accessor("name", {
      header: "Card",
      filterFn: fuzzyFilter,
      cell: (info) => {
         return (
            <Link
               to={`/c/cards/${info.row.original?.slug}`}
               className="flex items-center gap-3 group py-0.5"
            >
               <Image
                  className="w-9 object-contain"
                  width={100}
                  url={
                     info.row.original?.icon?.url ??
                     "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                  }
                  loading="lazy"
               />
               <span
                  className="space-y-1.5 font-semibold group-hover:underline
                decoration-zinc-400 underline-offset-2 truncate"
               >
                  <div className="truncate">{info.getValue()}</div>
                  {info.row.original?.pokemonType?.icon?.url ? (
                     <Image
                        className="size-4 object-contain"
                        width={40}
                        height={40}
                        url={info.row.original?.pokemonType?.icon?.url}
                        loading="lazy"
                     />
                  ) : undefined}
               </span>
            </Link>
         );
      },
   }),
   deckBuilderTrayColumnHelper.accessor("pokemonType", {
      header: "Type",
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.pokemonType?.name);
      },
   }),
   deckBuilderTrayColumnHelper.accessor("weaknessType", {
      header: () => <div className="text-center w-full">Weakness</div>,
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.weaknessType?.name);
      },
      cell: (info) => {
         return info.getValue()?.icon?.url ? (
            <Image
               className="size-4 object-contain mx-auto"
               width={40}
               height={40}
               url={info.getValue()?.icon?.url}
               loading="lazy"
            />
         ) : (
            <div className="text-center">-</div>
         );
      },
   }),
   deckBuilderTrayColumnHelper.accessor("cardType", {
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.cardType?.toString());
      },
   }),
   deckBuilderTrayColumnHelper.accessor("isEX", {
      header: "Is EX Pokémon?",
      filterFn: (row, columnId, filterValue) => {
         return filterValue.includes(row?.original?.isEX?.toString());
      },
   }),
];

const deckTypes = [
   {
      label: "Grass",
      value: "2",
      icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Grass.png",
   },
   {
      label: "Fire",
      value: "3",
      icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Fire.png",
   },
   {
      label: "Water",
      value: "4",
      icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Water.png",
   },
   {
      label: "Lightning",
      value: "5",
      icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Lightning.png",
   },
   {
      label: "Psychic",
      value: "6",
      icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Psychic.png",
   },
   {
      label: "Fighting",
      value: "7",
      icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Fighting.png",
   },
   {
      label: "Darkness",
      value: "8",
      icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Darkness.png",
   },
   {
      label: "Metal",
      value: "9",
      icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Metal.png",
   },
];

const deckCardFilters: {
   id: string;
   label: string;
   cols?: 1 | 2 | 3 | 4 | 5;
   options: { label?: string; value: string; icon?: string }[];
}[] = [
   {
      id: "cardType",
      label: "Card Type",
      cols: 2,
      options: [
         {
            label: "Pokémon",
            value: "pokemon",
         },
         {
            label: "Trainer",
            value: "trainer",
         },
      ],
   },
   {
      id: "isEX",
      label: "Is EX Pokémon?",
      options: [
         {
            label: "EX Pokémon",
            value: "true",
         },
      ],
   },
   {
      id: "pokemonType",
      label: "Pokémon Type",
      cols: 3,
      options: [
         {
            label: "Colorless",
            value: "Colorless",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Colorless.png",
         },
         {
            label: "Metal",
            value: "Metal",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Metal.png",
         },
         {
            label: "Darkness",
            value: "Darkness",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Darkness.png",
         },
         {
            label: "Dragon",
            value: "Dragon",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Dragon.png",
         },
         {
            label: "Fighting",
            value: "Fighting",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Fighting.png",
         },
         {
            label: "Fire",
            value: "Fire",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Fire.png",
         },
         {
            label: "Grass",
            value: "Grass",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Grass.png",
         },
         {
            label: "Lightning",
            value: "Lightning",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Lightning.png",
         },
         {
            label: "Psychic",
            value: "Psychic",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Psychic.png",
         },

         {
            label: "Water",
            value: "Water",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Water.png",
         },
      ],
   },
   {
      id: "weaknessType",
      label: "Pokémon Weakness",
      cols: 3,
      options: [
         {
            label: "Colorless",
            value: "Colorless",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Colorless.png",
         },
         {
            label: "Metal",
            value: "Metal",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Metal.png",
         },
         {
            label: "Darkness",
            value: "Darkness",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Darkness.png",
         },
         {
            label: "Dragon",
            value: "Dragon",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Dragon.png",
         },
         {
            label: "Fighting",
            value: "Fighting",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Fighting.png",
         },
         {
            label: "Fire",
            value: "Fire",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Fire.png",
         },
         {
            label: "Grass",
            value: "Grass",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Grass.png",
         },
         {
            label: "Lightning",
            value: "Lightning",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Lightning.png",
         },
         {
            label: "Psychic",
            value: "Psychic",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Psychic.png",
         },
         {
            label: "Water",
            value: "Water",
            icon: "https://static.mana.wiki/tcgwiki-pokemonpocket/TypeIcon_Water.png",
         },
      ],
   },
];

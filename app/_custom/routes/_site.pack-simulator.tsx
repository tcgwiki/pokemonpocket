import { useState } from "react";

import { gqlFetch } from "~/utils/fetchers.server";
import { gql } from "graphql-request";
import { z } from "zod";
import { zx } from "zodix";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";

import { Button } from "~/components/Button";
import { H2, H3 } from "~/components/Headers";
import { Icon } from "~/components/Icon";
import { Image } from "~/components/Image";
import {
   Table,
   TableBody,
   TableCell,
   TableHeader,
   TableRow,
} from "~/components/Table";
import {
   Disclosure,
   DisclosureButton,
   DisclosurePanel,
} from "@headlessui/react";
import clsx from "clsx";

import { ShinyCard } from "./_site.c.cards+/components/ShinyCard";
import { cardRarityEnum } from "./_site.c.cards+/components/Cards.Main";
import { Dialog } from "~/components/Dialog";

import { CustomPageHeader } from "~/components/CustomPageHeader";
import type { Card, Expansion } from "~/db/payload-custom-types";

import {
   Combobox,
   ComboboxButton,
   ComboboxInput,
   ComboboxOption,
   ComboboxOptions,
} from "@headlessui/react";

import { Badge } from "~/components/Badge";

export async function loader({ params, request }: LoaderFunctionArgs) {
   const { expansion } = zx.parseQuery(request, {
      expansion: z.string().optional(),
   });
   const { pack } = zx.parseQuery(request, { pack: z.string().optional() });

   // Get list of Expansions for initial selector
   const expansionList = (await gqlFetch({
      isAuthOverride: true,
      isCustomDB: true,
      isCached: true,
      query: expansionListQuery,
      request,
      variables: null,
   })) as any;

   if (!pack) {
      return json(
         {
            expansion: expansion,
            pack: pack,
            expansionList: expansionList?.Expansions?.docs as Expansion[],
            errorMessage: null,
         },
         { headers: { "Cache-Control": "public, s-maxage=60" } },
      );
   }

   const packList = (await gqlFetch({
      isAuthOverride: true,
      isCustomDB: true,
      isCached: true,
      query: packListQuery,
      request,
      variables: {
         packid: pack,
      },
   })) as any;

   return json(
      {
         expansion: expansion,
         pack: pack,
         expansionList: expansionList?.Expansions?.docs,
         packList: packList?.Pack,
         errorMessage: null,
      },
      { headers: { "Cache-Control": "public, s-maxage=60" } },
   );
}

export const meta: MetaFunction = ({ data, params }) => {
   const expansion = data?.expansionList?.find(
      (a: any) => a.id == data?.expansion,
   );

   const packName = data?.packList?.name;

   return [
      {
         title: packName
            ? `${packName} - Pack Simulator | Pokémon TCG Pocket - TCG Wiki`
            : expansion?.name
            ? `${expansion?.name} - Pack Simulator | Pokémon TCG Pocket - TCG Wiki`
            : "Pack Simulator | Pokémon TCG Pocket - TCG Wiki",
      },
      {
         name: "description",
         content: "Pokémon TCG Pocket - TCG Wiki Booster Pack Simulator",
      },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
   ];
};

export default function PackSimulator() {
   const loaderdata = useLoaderData<typeof loader>();
   let navigate = useNavigate();

   const expansionList = loaderdata?.expansionList;
   const expansion = loaderdata?.expansion;
   const pack = loaderdata?.pack;

   const [expansionSelectShow, setExpansionSelectShow] = useState(false); // For expansion selection combobox, whether to show options
   const [pullResults, setPullResults] = useState([]); // Array of card objects for showing pull results.
   const [allResults, setAllResults] = useState([]);
   const [isRarePack, setIsRarePack] = useState(false); // Just used to give a more visible indicator when someone rolls a rare pack

   const [regularPacksOpened, setRegularPacksOpened] = useState(0);
   const [rarePacksOpened, setRarePacksOpened] = useState(0);

   const currExpansionData = expansionList?.find((a: any) => a.id == expansion);
   const currPackData = loaderdata?.packList;

   function packSelected(selectbox: any) {
      navigate(`/pack-simulator?expansion=${expansion}&pack=${selectbox}`);
   }

   function simulateOpenPack(type = "") {
      // Decide whether a Regular or Rare pack is rolled
      const rare_rate = 5; // 0.05%, or 0.0005, 5 out of 10000

      const rand = Math.floor(Math.random() * 10000); // Random number from 0 - 9999

      if (rand < rare_rate || type == "rare") {
         setRarePacksOpened((rarePacksOpened) => rarePacksOpened + 1);

         // @ts-ignore
         var results_array = [];
         // Roll cards 1-5 (Pool _12345)
         results_array.push(pullFromPool("_12345"));
         results_array.push(pullFromPool("_12345"));
         results_array.push(pullFromPool("_12345"));
         results_array.push(pullFromPool("_12345"));
         results_array.push(pullFromPool("_12345"));

         // @ts-ignore
         setPullResults(results_array);
         // @ts-ignore
         setAllResults((allResults) => [...allResults, ...results_array]);
         setIsRarePack(true);
      } else {
         setRegularPacksOpened((regularPacksOpened) => regularPacksOpened + 1);

         // @ts-ignore
         var results_array = [];

         // Roll card 1, 2, and 3 (Pool _123)
         results_array.push(pullFromPool("_123"));
         results_array.push(pullFromPool("_123"));
         results_array.push(pullFromPool("_123"));

         // Roll card 4 (Pool _4)
         results_array.push(pullFromPool("_4"));

         // Roll card 5 (Pool _5)
         results_array.push(pullFromPool("_5"));

         // @ts-ignore
         setPullResults(results_array);
         // @ts-ignore
         setAllResults((allResults) => [...allResults, ...results_array]);
         setIsRarePack(false);
      }
   }

   function pullFromPool(slot: any) {
      // Rolling: Generate a cumulative sum object of all cards in pool (to the nth significant digit), with ratelower = rateupper of prior object+1, and rateupper = ratelower + total rate of current object, and roll a random integer of value up to cumulative sum of final object. If rand is between the ratelower and rateupper of a specific card, that card is pulled.
      const card_list = currPackData?.cards
         ?.filter((a) => a.slot == slot)
         .sort(
            (a, b) => parseInt(a.card?.rarity.id) - parseInt(b.card?.rarity.id),
         );

      var cumsum = 0;
      var cardrates = [];
      for (var ci = 0; ci < card_list.length; ci++) {
         const rbound = Math.round(card_list[ci].percent * 100000);
         const temprate = {
            card: card_list[ci].card,
            ratelower: cumsum,
            rateupper: cumsum + rbound,
         };
         cumsum += rbound;
         cardrates.push(temprate);
      }

      const rollvalue = Math.floor(Math.random() * cumsum);
      const result = cardrates.find(
         (a) => rollvalue < a.rateupper && rollvalue >= a.ratelower,
      )?.card;

      return result;
   }

   function resetSimulator() {
      setPullResults([]);
      setAllResults([]);
      setRegularPacksOpened(0);
      setRarePacksOpened(0);
   }

   const ExpansionSelectCombobox = () => {
      const [query, setQuery] = useState("");
      const [selected, setSelected] = useState(
         expansionList?.find((a) => a.id == expansion),
      );
      return (
         <Combobox
            value={selected}
            onChange={(value) => {
               setSelected(value);
               if (value?.id) navigate(`/pack-simulator?expansion=${value.id}`);
            }}
            onClose={() => setQuery("")}
         >
            <div className="flex-grow relative">
               <ComboboxInput
                  className={clsx(
                     "w-full rounded-lg border dark:bg-zinc-700 border-zinc-200 bg-zinc-50 py-2 pr-8 pl-3 dark:border-zinc-600 shadow-sm shadow-1",
                     "focus:outline-none font-bold data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25",
                  )}
                  placeholder="Select an Expansion..."
                  //@ts-ignore
                  displayValue={(expansion: Expansion) => expansion?.name}
                  onChange={(event) => setQuery(event.target.value)}
               />
               <ComboboxButton className="group absolute inset-y-0 right-0 px-2.5">
                  <div className="size-6 flex items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-600 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-500">
                     <Icon
                        name="chevron-down"
                        size={16}
                        className="dark:text-zinc-200"
                     />
                  </div>
               </ComboboxButton>
            </div>
            <ComboboxOptions
               anchor="bottom"
               transition
               className={clsx(
                  "w-[var(--input-width)] rounded-xl border border-color-sub bg-zinc-50 dark:bg-zinc-700 p-1 [--anchor-gap:var(--spacing-1)] empty:invisible",
                  "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0 z-50 mt-1 shadow-lg shadow-1",
               )}
            >
               {expansionList.map((expansion: Expansion) => (
                  <ComboboxOption
                     key={expansion.id}
                     value={expansion}
                     className="group flex cursor-pointer items-center gap-2 rounded-lg py-1.5 px-3 select-none
                      dark:data-[focus]:bg-zinc-600 data-[focus]:bg-white"
                  >
                     <Icon
                        name="check"
                        size={16}
                        className="invisible size-4 group-data-[selected]:visible"
                     />
                     <div className="flex items-center gap-2 flex-grow">
                        <Image
                           width={50}
                           className="object-contain"
                           id="expansion"
                           url={expansion?.icon?.url}
                        />
                        <span className="text-sm dark:text-white">
                           {expansion.name}
                        </span>
                     </div>
                     <Image
                        width={60}
                        className="object-contain"
                        id="expansion"
                        url={expansion?.logo?.url}
                     />
                  </ComboboxOption>
               ))}
            </ComboboxOptions>
         </Combobox>
      );
   };

   const PackSelectorGrid = () => {
      return (
         <>
            <div className="flex items-center justify-center gap-4 pt-4">
               <div className="flex-grow border-t border-color-sub" />
               <div className="text-sm text-1 font-mono text-center font-bold">
                  Select a Pack
               </div>
               <div className="flex-grow border-t border-color-sub" />
            </div>
            <div
               className="grid grid-cols-3 gap-3 justify-items-center pt-3"
               key="pack_selector_grid"
            >
               {currExpansionData?.packs?.map((pack, packindex) => {
                  return (
                     <div
                        className="w-full flex flex-col items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-600 bg-zinc-50  shadow-sm shadow-1
                        cursor-pointer rounded-xl border dark:border-zinc-600 dark:bg-dark450 hover:border-zinc-300 p-3 dark:hover:border-zinc-500"
                        onClick={() => packSelected(pack.id)}
                        key={pack?.id}
                     >
                        <Image
                           height={200}
                           className="object-contain h-40"
                           id="pack"
                           url={pack?.icon?.url}
                        />
                        <div className="text-sm font-bold text-center">
                           {pack?.name}
                        </div>
                     </div>
                  );
               })}
            </div>
         </>
      );
   };

   const PackSelectorGridSmall = () => {
      return (
         <div
            className="grid tablet:grid-cols-3 grid-cols-1 gap-3 py-3"
            key="pack_selector_grid"
         >
            {currExpansionData?.packs?.map((pack, packindex) => {
               return (
                  <div
                     className={clsx(
                        pack?.id == currPackData?.id
                           ? " border-blue-200 dark:border-blue-800 bg-blue-500 dark:bg-blue-950 bg-opacity-10"
                           : "bg-zinc-50 dark:bg-dark450 border-zinc-200 dark:border-zinc-600",
                        "flex items-center border hover:bg-blue-100 hover:border-blue-200 dark:hover:border-blue-800 dark:hover:bg-blue-950 cursor-pointer rounded-lg p-1",
                     )}
                     onClick={() => packSelected(pack.id)}
                     key={pack?.id}
                  >
                     <Image
                        height={160}
                        className="object-contain h-20"
                        id="pack"
                        url={pack?.icon?.url}
                     />
                     <span className="text-sm font-bold">{pack?.name}</span>
                  </div>
               );
            })}
         </div>
      );
   };

   const PackRatesDropdown = () => {
      const pack_header_class = "font-header text-lg";
      const card_header_class =
         "bg-zinc-100 dark:bg-dark400 my-2 py-1 px-2 font-bold rounded";

      const card_count = currPackData?.cards?.length;
      return (
         <>
            <Disclosure defaultOpen={false}>
               {({ open }) => (
                  <>
                     <DisclosureButton
                        className={clsx(
                           open ? "rounded-b-none " : "shadow-sm",
                           "mt-3 shadow-1 border-color-sub bg-3-sub flex w-full items-center gap-2 overflow-hidden rounded-xl border px-2 py-3",
                        )}
                     >
                        <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full border bg-white shadow-sm shadow-zinc-200  dark:border-zinc-600/30 dark:bg-dark450 dark:shadow-zinc-800">
                           <Icon
                              name="chevron-right"
                              className={clsx(
                                 open ? "rotate-90" : "",
                                 "transform pl-0.5 transition duration-300 ease-in-out",
                              )}
                              size={16}
                           />
                        </div>
                        <div className="flex-grow text-left flex items-center justify-between">
                           <span className="font-bold text-sm">
                              Card Pool Rates
                           </span>
                           <span className="flex items-center gap-1.5">
                              <span className="text-xs">Total Cards</span>
                              <Badge color="zinc">{card_count}</Badge>
                           </span>
                        </div>
                     </DisclosureButton>
                     <DisclosurePanel
                        contentEditable={false}
                        unmount={false}
                        className={clsx(
                           open ? "mb-3 border-t" : "",
                           "border-color-sub shadow-1 bg-3 rounded-b-lg border border-t-0 p-3 text-sm shadow-sm",
                        )}
                     >
                        <div className={pack_header_class}>Regular Pack</div>
                        <div className={card_header_class}>Cards 1-3</div>
                        <div>
                           <PackCategoryRateList slot="_123" />
                        </div>
                        <div className={card_header_class}>Card 4</div>
                        <div>
                           <PackCategoryRateList slot="_4" />
                        </div>
                        <div className={card_header_class}>Card 5</div>
                        <div>
                           <PackCategoryRateList slot="_5" />
                        </div>

                        <div className={pack_header_class}>Rare Pack</div>
                        <div className={card_header_class}>Cards 1-5</div>
                        <div>
                           <PackCategoryRateList slot="_12345" />
                        </div>
                     </DisclosurePanel>
                  </>
               )}
            </Disclosure>
         </>
      );
   };

   const PackCategoryRateList = ({ slot }: any) => {
      const card_list = currPackData?.cards
         ?.filter((a) => a.slot == slot)
         .sort(
            (a, b) => parseInt(a.card?.rarity.id) - parseInt(b.card?.rarity.id),
         );

      return (
         <>
            <div className="grid laptop:grid-cols-2 gap-1 pb-3">
               {card_list?.map((card) => {
                  const [isOpen, setIsOpen] = useState(false);
                  const cardType =
                     card.card?.cardType === "pokemon" ? "pokémon" : "trainer";
                  const rarity =
                     card.card?.rarity?.name &&
                     card.card?.rarity.name in cardRarityEnum
                        ? cardRarityEnum[
                             card.card?.rarity
                                .name as keyof typeof cardRarityEnum
                          ]
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
                                 viewTransitionName:
                                    card.card?.slug ?? undefined,
                              }}
                           >
                              {/* @ts-ignore */}
                              <ShinyCard supertype={cardType} rarity={rarity}>
                                 <Image
                                    className="object-contain"
                                    width={367}
                                    height={512}
                                    url={
                                       card.card?.icon?.url ??
                                       "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                                    }
                                    alt={card.card?.name ?? "Card Image"}
                                    loading="lazy"
                                 />
                              </ShinyCard>
                              <Button href={`/c/cards/${card.card?.slug}`}>
                                 Go to card
                                 <Icon name="chevron-right" size={16} />
                              </Button>
                           </div>
                        </Dialog>

                        <div
                           className="flex justify-between border border-color-sub 
                           bg-zinc-50 dark:bg-dark400 rounded-md pl-1 pr-2 py-1"
                        >
                           <div
                              className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline text-[9pt] flex items-center gap-2"
                              onClick={() => setIsOpen(true)}
                           >
                              <div className="w-10">
                                 <Image
                                    className="object-contain h-4 mx-auto"
                                    height={40}
                                    url={card.card?.rarity?.icon?.url}
                                    alt={card.card?.rarity?.name}
                                    loading="lazy"
                                 />
                              </div>
                              <span className="line-clamp-1">
                                 {card.card?.name}
                              </span>
                           </div>
                           <div className="text-[9pt]">
                              {Math.round(card.percent * 1000) / 1000}%
                           </div>
                        </div>
                     </>
                  );
               })}
            </div>
         </>
      );
   };

   const SimulatorStartButtons = () => {
      return (
         <div className="flex max-tablet:flex-col items-center gap-2">
            <Button
               color="blue"
               className="w-full !py-2"
               onClick={() => simulateOpenPack()}
            >
               Open Pack
            </Button>
            <Button
               color="violet"
               className="max-tablet:w-full tablet:flex-none !py-2"
               onClick={() => simulateOpenPack("rare")}
            >
               Open Rare Pack
            </Button>
         </div>
      );
   };

   // const RarePackIndicator = () => {
   //    return (
   //       <>
   //          <div className="block text-red-500 bg-red-500 bg-opacity-10 border-8 border-red-500 border-opacity-30 p-3 my-2 w-full text-center rounded-full cursor-default font-bold text-lg">
   //             Rare Pack Rolled!
   //          </div>
   //       </>
   //    );
   // };

   const PullResultsDisplay = () => {
      return (
         <div
            className={clsx(
               isRarePack
                  ? "bg-violet-50 border-violet-300 dark:bg-violet-950/40 dark:border-violet-900"
                  : "bg-zinc-50 dark:bg-dark450 border-zinc-200 dark:border-zinc-600",
               "flex flex-col shadow-sm shadow-1 gap-2 border rounded-lg p-3 mt-2 relative",
            )}
         >
            {isRarePack && (
               <div className="text-violet-500 pb-1.5  font-header text-center font-bold">
                  Rare Pack
               </div>
            )}
            {/* Display three results on top and two on bottom, center justified. */}
            <div className="flex items-center justify-center gap-2">
               <PullResultsFeaturedCard card={pullResults[0]} />
               <PullResultsFeaturedCard card={pullResults[1]} />
               <PullResultsFeaturedCard card={pullResults[2]} />
            </div>
            <div className="relative text-center grid grid-cols-2 gap-2">
               <div className="flex justify-end">
                  <PullResultsFeaturedCard card={pullResults[3]} />
               </div>
               <div className="flex justify-start">
                  <PullResultsFeaturedCard card={pullResults[4]} />
               </div>
            </div>
            <Button
               color="light/zinc"
               className="!absolute right-3 bottom-3"
               onClick={() => resetSimulator()}
            >
               <Icon name="refresh-ccw" size={12} className="text-1" />
               Reset
            </Button>
         </div>
      );
   };
   const PullResultsFeaturedCard = ({ card }: any) => {
      const [dOpen, setDOpen] = useState(false);
      const cardType = card.cardType === "pokemon" ? "pokémon" : "trainer";
      const rarity =
         card.rarity?.name && card.rarity.name in cardRarityEnum
            ? cardRarityEnum[card.rarity.name as keyof typeof cardRarityEnum]
            : "common";
      return (
         <>
            <Dialog
               className="relative flex items-center justify-center"
               size="tablet"
               onClose={setDOpen}
               open={dOpen}
            >
               <div
                  className="flex items-center flex-col gap-5 justify-center"
                  style={{
                     viewTransitionName: card.slug ?? undefined,
                  }}
               >
                  {/* @ts-ignore */}
                  <ShinyCard supertype={cardType} rarity={rarity}>
                     <Image
                        className="object-contain"
                        width={367}
                        height={512}
                        url={
                           card.icon?.url ??
                           "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                        }
                        alt={card.name ?? "Card Image"}
                        loading="lazy"
                     />
                  </ShinyCard>
                  <Button href={`/c/cards/${card.slug}`}>
                     Go to card
                     <Icon name="chevron-right" size={16} />
                  </Button>
               </div>
            </Dialog>
            <div
               className="cursor-pointer"
               onClick={() => setDOpen(true)}
               key={card?.id}
            >
               <Image
                  width={367}
                  height={512}
                  className="object-contain w-40"
                  id="pack"
                  url={card?.icon?.url}
               />
            </div>
         </>
      );
   };

   const AllResultsDisplay = () => {
      // Calculate Totals per Card
      // Sort results by rarity value
      const sorted_list = allResults.sort(
         // @ts-ignore
         (a, b) => parseInt(b?.rarity.id) - parseInt(a?.rarity.id),
      );
      const unique_ids = sorted_list
         .map((a) => a.id)
         ?.filter((v, i, a) => a.indexOf(v) === i);

      const display_list = unique_ids
         .map((cid) => {
            return {
               card: sorted_list.find((a) => a.id == cid),
               qty: sorted_list.filter((a) => a.id == cid)?.length,
            };
         })
         ?.sort(
            (a, b) =>
               parseInt(b?.card?.rarity.id) - parseInt(a?.card?.rarity.id) ||
               b.qty - a.qty,
         ); // Card totals sorted by Rarity, then by qty.

      return (
         <>
            <div className="grid laptop:grid-cols-2 gap-1">
               {display_list?.map((card: any) => {
                  const [isOpen, setIsOpen] = useState(false);
                  const cardType =
                     card.card?.cardType === "pokemon" ? "pokémon" : "trainer";
                  const rarity =
                     card.card?.rarity?.name &&
                     card.card?.rarity.name in cardRarityEnum
                        ? cardRarityEnum[
                             card.card?.rarity
                                .name as keyof typeof cardRarityEnum
                          ]
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
                                 viewTransitionName:
                                    card.card?.slug ?? undefined,
                              }}
                           >
                              {/* @ts-ignore */}
                              <ShinyCard supertype={cardType} rarity={rarity}>
                                 <Image
                                    className="object-contain"
                                    width={367}
                                    height={512}
                                    url={
                                       card.card?.icon?.url ??
                                       "https://static.mana.wiki/tcgwiki-pokemonpocket/CardIcon_Card_Back.png"
                                    }
                                    alt={card.card?.name ?? "Card Image"}
                                    loading="lazy"
                                 />
                              </ShinyCard>
                              <Button href={`/c/cards/${card.card?.slug}`}>
                                 Go to card
                                 <Icon name="chevron-right" size={16} />
                              </Button>
                           </div>
                        </Dialog>
                        <div
                           className="flex justify-between border border-color-sub 
                           bg-zinc-50 dark:bg-dark400 rounded-md pl-1 pr-2 py-1"
                        >
                           <div
                              className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline text-xs flex items-center gap-2"
                              onClick={() => setIsOpen(true)}
                           >
                              <div className="w-10">
                                 <Image
                                    className="object-contain h-4 mx-auto"
                                    height={40}
                                    url={card.card?.rarity?.icon?.url}
                                    alt={card.card?.rarity?.name}
                                    loading="lazy"
                                 />
                              </div>
                              <span className="line-clamp-1">
                                 {card.card?.name}
                              </span>
                           </div>

                           <div className="text-xs">x{card.qty}</div>
                        </div>
                     </>
                  );
               })}
            </div>
         </>
      );
   };

   const StatisticsTable = () => {
      // Things to track:
      // - Pack Points gained (5 per pack opened)
      // Pack point redemption rates:
      // 35 points: 1 ◊ card
      // 70 points: 1 ◊◊ card
      // 150 points:  1 ◊◊◊ card
      // 400 points: 1 ☆ card
      // 500 points: 1 ◊◊◊◊ (ex) card
      // 1250 points: 1 ☆☆ card
      // 1500 points: 1 ☆☆☆ card
      // 2500 points: 1 ♕ card
      // - Number of regular packs opened
      // - Number of rare packs opened
      // - Total packs opened
      // - Total Poke Gold spent // Total Pack Hourglasses spent (Poke Gold reduces cd by 2hr, Pack Hourglass reduces cd by 1hr, so total hourglass is always 2x the number of poke gold required)
      //
      // NOTES
      // The "beta" version has four Poke Gold packs:
      // 5x Gold = $0.99 / 0.198 $ per gold
      // 15x Gold = $2.99 / 0.19933 $ per gold
      // 50x Gold = $9.99 / 0.1998 $ per gold
      // 500x Gold = $99.99 / 0.19998 $ per gold
      // # Gold Required to open 1 pack: 6
      // Average $ per pack: $1.188
      // The smallest pack is the best value...! Why would they do this? I don't know. Maybe higher numbers of transactions looks better to investors, I have no idea honestly.

      // Some other notes on total rates:
      // Total chance of any Star or higher in normal pack:
      // Position 4: 13.36%
      // Position 5: 13.36%
      // Total chance of any rarity Star or higher in normal pack = 1 - (1-.1336)^2 = ~24.94%. Plus chance of a rare pack, this pretty much rounds out to 24.99%, or about 25%. However, a chance for the Ultra rare is miniscule.

      // Total chance of UR in normal pack in pos 4 and 5: 0.15%.
      // Per pack: 1 - (1-0.0020)^2 = 0.299775% + 0.05% from the rare pack, = 0.349775%. This is probably the worst base UR / high rarity rate of any gacha game in history. Probably offset by free pulls.
      // The average number of packs required to get reach a 50% statistical chance to pull at least one of the three URs is: 1 - (1-.00349775)^n = 0.5, solve for n
      // n ~ 197.8227, or about 198 packs. On average this is $235.224 for a 50% chance to get one UR.
      // If we look at Pack Points instead, a UR costs 2,500 pack points. You get 5 pack points per pack opened. This is 500 packs. It's essentially a pity system, which is about equivalent to failing the UR 50% chance about 2.5 times (198 * 2.5 ~ 495 packs). To guarantee a UR you purchase 500 packs, which is about $594. Yes indeed, this reminds me of that time the Playstation 3 will retail for five hundred and ninety-nine US dollars....

      return (
         <>
            <Table grid framed dense className="my-2.5">
               <TableBody>
                  <TableRow>
                     <TableHeader className="!py-1.5 text-sm">
                        Regular Packs Opened
                     </TableHeader>
                     <TableCell className="!py-1.5" center>
                        {regularPacksOpened}
                     </TableCell>
                  </TableRow>
                  <TableRow>
                     <TableHeader className="!py-1.5">
                        Rare Packs Opened
                     </TableHeader>
                     <TableCell className="!py-1.5" center>
                        {rarePacksOpened}
                     </TableCell>
                  </TableRow>
                  <TableRow>
                     <TableHeader className="!py-1.5">
                        Total Packs Opened
                     </TableHeader>
                     <TableCell className="!py-1.5" center>
                        {regularPacksOpened + rarePacksOpened}
                     </TableCell>
                  </TableRow>
                  <TableRow>
                     <TableHeader className="!py-1.5">
                        Poke Gold Used
                     </TableHeader>
                     <TableCell className="!py-1" center>
                        {(regularPacksOpened + rarePacksOpened) * 6}
                     </TableCell>
                  </TableRow>
                  <TableRow>
                     <TableHeader className="!py-1.5">
                        $ Spent ($0.99 pack = 5x Poke Gold)
                     </TableHeader>
                     <TableCell className="!py-1.5" center>
                        <span className="text-1">$</span>
                        {Math.round(
                           (regularPacksOpened + rarePacksOpened) * 6 * 19.8,
                        ) / 100}
                     </TableCell>
                  </TableRow>
                  <TableRow>
                     <TableHeader className="!py-1.5 !border-0">
                        Pack Points
                     </TableHeader>
                     <TableCell className="!py-1.5" center>
                        {(regularPacksOpened + rarePacksOpened) * 5}
                     </TableCell>
                  </TableRow>
               </TableBody>
            </Table>
         </>
      );
   };

   return (
      <>
         <CustomPageHeader
            name="Pack Simulator"
            iconUrl="https://static.mana.wiki/tcgwiki-pokemonpocket/pack-simulator-pokemon-pocket.png"
         />
         <div className="relative mx-auto max-w-[728px] max-tablet:px-3 py-3">
            <div className="text-sm text-1">
               <p>
                  Simulate opening booster packs, wallet pain-free! Select an
                  expansion and a booster pack to begin.
               </p>
               <p>
                  Pack opening can be simulated as normal (rare packs appear at
                  their usual rate), or users can also choose to simulate
                  opening only rare packs.
               </p>
               <ul className="editor-ul mt-3">
                  <li>
                     Packs can be opened for free every 12-hours by default.
                  </li>
                  <li>
                     Packs can either come as regular (99.95%) or rare (0.05%).
                  </li>
                  <li>
                     Normal packs always have Common (C) cards for their first
                     three cards, while higher rarities can appear in card
                     numbers 4 and 5.
                  </li>
                  <li>
                     Rare packs only contain star rarity or higher cards (AR,
                     SR, SAR, IM, UR) for all five cards.
                  </li>
               </ul>
            </div>
            {/* Expansion Selector Combobox */}
            <div className="border-t mt-5 block pt-3 dark:border-zinc-600 border-dashed">
               <ExpansionSelectCombobox />
            </div>
            {/* Pack Selector Grid - Show smaller version if a pack is already selected */}
            {expansion && !pack ? <PackSelectorGrid /> : null}
            {expansion && pack ? <PackSelectorGridSmall /> : null}
            {/* NOTE: If a user collection is loaded, SHOW BUTTON to display, for each pack, number of unowned cards, and %age to obtain at least one unowned card when opening a pack. */}
            {/* Once a Pack is selected, enable all simulator button dialogs */}
            {pack ? (
               <>
                  {/* Pack Rates drop down - shows all rates for all card positions in both Regular and Rare pack types */}
                  <SimulatorStartButtons />
               </>
            ) : null}
            {/* Display pull results if applicable */}
            {pullResults?.length > 0 ? (
               <>
                  <PullResultsDisplay />
               </>
            ) : null}
            {pack ? <PackRatesDropdown /> : null}
            {/* Always show statistics table */}
            <StatisticsTable />
            {/* All Results section shown only if results are present */}
            {allResults?.length > 0 ? (
               <>
                  <H3>All Cards Pulled</H3>
                  <AllResultsDisplay />
               </>
            ) : null}
            <div className="mb-10"></div>
         </div>
      </>
   );
}

const expansionListQuery = gql`
   query {
      Expansions(limit: 1000, where: { isPromo: { equals: false } }) {
         docs {
            id
            name
            slug
            icon {
               url
            }
            logo {
               url
            }
            packs {
               id
               name
               slug
               icon {
                  url
               }
            }
         }
      }
   }
`;

const packListQuery = gql`
   query ($packid: String!) {
      Pack(id: $packid) {
         id
         name
         slug
         icon {
            url
         }
         cards {
            id
            pool
            slot
            percent
            card {
               id
               slug
               name
               cardType
               icon {
                  url
               }
               rarity {
                  id
                  name
                  icon {
                     url
                  }
               }
            }
         }
      }
   }
`;

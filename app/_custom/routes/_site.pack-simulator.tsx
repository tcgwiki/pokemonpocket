import { useState } from "react";

import { gqlFetch } from "~/utils/fetchers.server";
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
            expansionList: expansionList?.Expansions?.docs,
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

export const meta: MetaFunction = () => {
   return [
      {
         title: "Pack Simulator | Pokémon TCG Pocket - TCG Wiki",
      },
      {
         name: "description",
         content: "Pokémon TCG Pocket - TCG Wiki Booster Pack Simulator",
      },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
   ];
};

const PackSimulator = (data: any) => {
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

   // ========
   // Helper Functions
   function expansionSelected(selectbox: any) {
      if (selectbox != "") navigate(`/pack-simulator?expansion=${selectbox}`);
      else navigate("/pack-simulator");
   }

   function packSelected(selectbox: any) {
      navigate(`/pack-simulator?expansion=${expansion}&pack=${selectbox}`);
   }

   function simulateOpenPack(type = "") {
      // Decide whether a Regular or Rare pack is rolled
      const rare_rate = 5; // 0.05%, or 0.0005, 5 out of 10000

      const rand = Math.floor(Math.random() * 100000); // Random number from 0 - 99999

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

   // =======
   // Components
   const ExpansionSelectOption = ({ exp, hover = false }: any) => {
      return (
         <div
            className={`flex ${
               hover
                  ? "bg-zinc-50 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-800"
                  : ""
            } px-2 py-1 items-center cursor-default`}
            onClick={() => {
               if (hover) {
                  expansionSelected(exp?.id);
                  setExpansionSelectShow(false);
               }
            }}
         >
            <div className="mr-2">
               <Image
                  width={50}
                  className="object-contain"
                  id="expansion"
                  url={exp?.icon?.url}
               />
            </div>
            <div className="mr-2">
               <Image
                  width={60}
                  className="object-contain"
                  id="expansion"
                  url={exp?.logo?.url}
               />
            </div>
            {exp?.id} - {exp?.name}
         </div>
      );
   };

   const ExpansionSelectCombobox = () => {
      return (
         <>
            <H3>Expansions</H3>
            <div
               className="relative block w-full appearance-none rounded-lg border border-zinc-950/10 hover:border-zinc-950/20 dark:border-white/10 dark:hover:border-white/20 bg-transparent dark:bg-white/5 px-3 py-1"
               onClick={() => setExpansionSelectShow(!expansionSelectShow)}
            >
               {currExpansionData ? (
                  <ExpansionSelectOption
                     exp={currExpansionData}
                     key={"expansion_combobox_selected"}
                  />
               ) : (
                  <div className="text-zinc-500 cursor-default">
                     Select an expansion...
                  </div>
               )}
               <SelectBoxArrowsIcon />
            </div>
            {expansionSelectShow ? (
               <>
                  <div className="relative block w-full appearance-none rounded-lg border border-zinc-500 bg-transparent dark:bg-white/5 px-3 py-1 mb-1 max-h-80 overflow-y-auto">
                     {expansionList?.map((exp: any) => (
                        <ExpansionSelectOption
                           exp={exp}
                           hover={true}
                           key={exp.id}
                        />
                     ))}
                  </div>
               </>
            ) : null}
         </>
      );
   };

   const PackSelectorGrid = () => {
      return (
         <>
            <H3>Packs</H3>
            <div
               className="grid grid-cols-3 justify-items-center"
               key="pack_selector_grid"
            >
               {currExpansionData?.packs?.map((pack, packindex) => {
                  return (
                     <div
                        className="w-full hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:font-bold text-center hover:drop-shadow-lg cursor-pointer rounded-md"
                        onClick={() => packSelected(pack.id)}
                        key={pack?.id}
                     >
                        <Image
                           width={200}
                           className="inline-block object-contain "
                           id="pack"
                           url={pack?.icon?.url}
                        />
                        <div className="text-lg">{pack?.name}</div>
                     </div>
                  );
               })}
            </div>
         </>
      );
   };

   const PackSelectorGridSmall = () => {
      return (
         <>
            <H3>Packs</H3>
            <div
               className="grid grid-cols-3 justify-items-center"
               key="pack_selector_grid"
            >
               {currExpansionData?.packs?.map((pack, packindex) => {
                  return (
                     <div
                        className={`w-full hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:font-bold text-center hover:drop-shadow-lg cursor-pointer rounded-md ${
                           pack?.id == currPackData?.id
                              ? "border border-blue-200 dark:border-blue-800 bg-blue-500 bg-opacity-10"
                              : ""
                        }`}
                        onClick={() => packSelected(pack.id)}
                        key={pack?.id}
                     >
                        <Image
                           width={40}
                           className="inline-block object-contain "
                           id="pack"
                           url={pack?.icon?.url}
                        />
                        <div className="inline-block text-lg">{pack?.name}</div>
                     </div>
                  );
               })}
            </div>
         </>
      );
   };

   const PackRatesDropdown = () => {
      const pack_header_class =
         "border border-color-sub px-3 py-1 bg-color-sub rounded-lg my-2 text-lg font-bold text-center";
      const card_header_class =
         "w-full text-center my-1 py-0.5 bg-zinc-200 dark:bg-zinc-700";

      const card_count = currPackData?.cards?.length;
      return (
         <>
            <Disclosure defaultOpen={false}>
               {({ open }) => (
                  <>
                     <DisclosureButton
                        className={clsx(
                           open ? "rounded-b-none " : "shadow-sm",
                           "shadow-1 border-color-sub bg-zinc-50 dark:bg-dark350 flex w-full items-center gap-2 overflow-hidden rounded-xl border px-2 py-3 my-2",
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
                        <div className="flex-grow text-left text-lg font-bold font-header">
                           Card Pool Rates (Total Cards: {card_count})
                        </div>
                     </DisclosureButton>
                     <DisclosurePanel
                        contentEditable={false}
                        unmount={false}
                        className={clsx(
                           open ? "mb-3 border-t" : "",
                           "border-color-sub shadow-1 bg-3 rounded-b-lg border border-t-0 p-3 pt-0 text-sm shadow-sm",
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
            <div className="laptop:grid laptop:grid-cols-2 laptop:gap-x-2">
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

                        <div className="flex justify-between bg-zinc-100 dark:bg-zinc-800 rounded-full px-2 py-0.5 my-0.5">
                           <div
                              className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline text-xs"
                              onClick={() => setIsOpen(true)}
                           >
                              <div className="inline-block w-12 align-top">
                                 <Image
                                    className="object-contain"
                                    height={20}
                                    url={card.card?.rarity?.icon?.url}
                                    alt={card.card?.rarity?.name}
                                    loading="lazy"
                                 />
                              </div>
                              {card.card?.name}
                           </div>

                           <div className="text-xs">
                              {Math.round(card.percent * 100) / 100}%
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
         <div className="flex gap-x-2">
            <Button className="w-full" onClick={() => simulateOpenPack()}>
               Open Pack
            </Button>
            <Button className="w-full" onClick={() => simulateOpenPack("rare")}>
               Simulate Rare Pack
            </Button>
         </div>
      );
   };

   const RarePackIndicator = () => {
      return (
         <>
            <div className="block text-red-500 bg-red-500 bg-opacity-10 border-8 border-red-500 border-opacity-30 p-3 my-2 w-full text-center rounded-full cursor-default font-bold text-lg">
               Rare Pack Rolled!
            </div>
         </>
      );
   };

   const PullResultsDisplay = () => {
      return (
         <>
            {/* Display three results on top and two on bottom, center justified. */}
            <div className="block relative text-center laptop:h-[294px] h-[147px]">
               {pullResults
                  ?.filter((c, ci) => ci < 3)
                  ?.map((card: any) => (
                     <PullResultsFeaturedCard card={card} />
                  ))}
            </div>

            <div className="block relative text-center laptop:h-[294px] h-[147px]">
               {pullResults
                  ?.filter((c, ci) => ci >= 3)
                  ?.map((card: any) => (
                     <PullResultsFeaturedCard card={card} />
                  ))}
            </div>
         </>
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
               className={`cursor-pointer text-center inline-block m-1`}
               onClick={() => setDOpen(true)}
               key={card?.id}
            >
               <Image
                  width={200}
                  className="inline-block object-contain laptop:w-[200px] w-[100px]"
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
            <div className="laptop:grid laptop:grid-cols-2 laptop:gap-x-2">
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

                        <div className="flex justify-between bg-zinc-100 dark:bg-zinc-800 rounded-full px-2 py-0.5 my-0.5">
                           <div
                              className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline text-xs"
                              onClick={() => setIsOpen(true)}
                           >
                              <div className="inline-block w-12 align-top">
                                 <Image
                                    className="object-contain"
                                    height={20}
                                    url={card.card?.rarity?.icon?.url}
                                    alt={card.card?.rarity?.name}
                                    loading="lazy"
                                 />
                              </div>
                              {card.card?.name}
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
                     <TableHeader className="!py-1">
                        Regular Packs Opened
                     </TableHeader>
                     <TableCell className="!py-1">
                        {regularPacksOpened}
                     </TableCell>
                  </TableRow>
                  <TableRow>
                     <TableHeader className="!py-1">
                        Rare Packs Opened
                     </TableHeader>
                     <TableCell className="!py-1">{rarePacksOpened}</TableCell>
                  </TableRow>
                  <TableRow>
                     <TableHeader className="!py-1">
                        Total Packs Opened
                     </TableHeader>
                     <TableCell className="!py-1">
                        {regularPacksOpened + rarePacksOpened}
                     </TableCell>
                  </TableRow>
                  <TableRow>
                     <TableHeader className="!py-1">Poke Gold Used</TableHeader>
                     <TableCell className="!py-1">
                        {(regularPacksOpened + rarePacksOpened) * 6}
                     </TableCell>
                  </TableRow>
                  <TableRow>
                     <TableHeader className="!py-1">
                        $ Spent ($0.99 pack = 5x Poke Gold)
                     </TableHeader>
                     <TableCell className="!py-1">
                        $
                        {Math.round(
                           (regularPacksOpened + rarePacksOpened) * 6 * 19.8,
                        ) / 100}
                     </TableCell>
                  </TableRow>
                  <TableRow>
                     <TableHeader className="!py-1">Pack Points</TableHeader>
                     <TableCell className="!py-1">
                        {(regularPacksOpened + rarePacksOpened) * 5}
                     </TableCell>
                  </TableRow>
               </TableBody>
            </Table>
         </>
      );
   };

   const SimulatorResetButton = () => {
      return (
         <div className="flex my-2">
            <Button className="w-full" onClick={() => resetSimulator()}>
               Reset
            </Button>
         </div>
      );
   };

   return (
      <>
         <H2>Pack Simulator</H2>
         <div className="mb-4 px-3 whitespace-pre-wrap">
            {/* NOTE: This is a placeholder intro section for any information about the simulator that might be useful, can delete if not needed later */}
            {
               "Simulate opening booster packs, wallet pain-free!\nSelect an expansion and a booster pack to begin.\nPack opening can be simulated as normal (rare packs appear at their usual rate), or users can also choose to simulate opening only rare packs.\n\n- Packs can be opened for free every 12-hours by default.\n- Packs can either come as regular (99.95%) or rare (0.05%).\n- Normal packs always have Common (C) cards for their first three cards, while higher rarities can appear in card numbers 4 and 5.\n- Rare packs only contain star rarity or higher cards (AR, SR, SAR, IM, UR) for all five cards."
            }
         </div>

         {/* Expansion Selector Combobox */}
         <ExpansionSelectCombobox />

         {/* Pack Selector Grid - Show smaller version if a pack is already selected */}
         {expansion && !pack ? <PackSelectorGrid /> : null}
         {expansion && pack ? <PackSelectorGridSmall /> : null}
         {/* NOTE: If a user collection is loaded, SHOW BUTTON to display, for each pack, number of unowned cards, and %age to obtain at least one unowned card when opening a pack. */}

         {/* Once a Pack is selected, enable all simulator button dialogs */}
         {pack ? (
            <>
               {/* Pack Rates drop down - shows all rates for all card positions in both Regular and Rare pack types */}
               <PackRatesDropdown />
               <SimulatorStartButtons />
            </>
         ) : null}

         {/* Show little message if rare pack is rolled */}
         {isRarePack ? <RarePackIndicator /> : null}
         {/* Display pull results if applicable */}
         {pullResults?.length > 0 ? (
            <>
               <PullResultsDisplay />
            </>
         ) : null}

         {/* Always show statistics table */}
         <StatisticsTable />

         {/* All Results section shown only if results are present */}
         {allResults?.length > 0 ? (
            <>
               <H3>All Cards Pulled</H3>
               <AllResultsDisplay />
            </>
         ) : null}

         {/* Reset Button */}
         <SimulatorResetButton />
         <div className="mb-10"></div>
      </>
   );
};

export default PackSimulator;

const SelectBoxArrowsIcon = () => {
   return (
      <>
         <span className="pointer-events-none absolute bg-transparent inset-y-0 right-0 flex items-center pr-2">
            <svg
               className="size-5 stroke-zinc-500 tablet:size-4 dark:stroke-zinc-400"
               viewBox="0 0 16 16"
               aria-hidden="true"
               fill="none"
            >
               <path
                  d="M5.75 10.75L8 13L10.25 10.75"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
               />
               <path
                  d="M10.25 5.25L8 3L5.75 5.25"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
               />
            </svg>
         </span>
      </>
   );
};

const expansionListQuery = `
query {
  Expansions(limit:1000,where:{isPromo:{equals:false}}) {
    docs {
      id
      name
      slug
      icon { url }
      logo { url }
      packs {
        id
        name
        slug
        icon { url }
      }
    }
  }
}
`;

const packListQuery = `
query($packid:String!) {
  Pack(id:$packid) {
    id
    name
    slug
    icon { url }
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
        icon{ url }
        rarity {
          id
          name
          icon { url }
        }
      }
    }
  }
}
`;

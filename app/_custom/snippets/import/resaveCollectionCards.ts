import Payload from "payload";

import { manaSlug } from "../../../../app/utils/url-slug";

require("dotenv").config();

const { PAYLOADCMS_SECRET } = process.env;

let payload = null as any;

//Start payload instance
const start = async () =>
   await Payload.init({
      secret: PAYLOADCMS_SECRET as any,
      local: true,
      onInit: (_payload) => {
         payload = _payload;
         payload.logger.info(`Payload initialized...`);
         resaveCollection();
      },
   });
start();

const resaveCollection = async () => {
   const results = await payload.find({
      collection: "cards",
      depth: 1,
      where: {
         expansion: {
            equals: "A2",
         },
      },
      sort: "cardType",
      limit: 300,
   });

   for (const result of results.docs) {
      const cardName = `${result.name.split("-")[0].trim()} - ${
         result.expansion.name
      }`;

      console.log(cardName, "cardName");

      const existingCard = await payload.find({
         collection: "card-groups",
         depth: 1,
         where: {
            name: {
               equals: cardName,
            },
         },
      });
      console.log(existingCard, "existingCard");

      const moves =
         result?.moves && result.moves.length > 0
            ? result.moves.map((move: any) => move.id)
            : undefined;

      console.log(moves, "moves");

      const existingCardsArray = existingCard.docs[0]?.cards;

      console.log(existingCardsArray, "existingCardsArray");

      // Find cards with matching moves
      const matchingCards = existingCardsArray?.filter((card: any) => {
         // For trainer cards, match based on description
         if (card.cardType === "trainer") {
            return card.desc === result.desc;
         }

         // For non-trainer cards, match based on moves
         // Handle case where either array is undefined
         if (!card?.moves || !moves) return false;

         // Check if arrays have same length and same values
         return (
            card.moves.length === moves.length &&
            card.moves.every((move: string) => moves.includes(move))
         );
      });
      console.log(matchingCards, "matchingCards");

      if (matchingCards && matchingCards.length > 0) {
         console.log("adding existing card", existingCard.docs[0]?.name);
         console.log(
            existingCard.docs[0].cards?.map((card: any) => card.id),
            "existingCard.docs[0].cards?.map((card: any) => card.id)",
         );
         const existingCardIds =
            existingCard.docs[0].cards?.map((card: any) => card.id) || [];

         if (!existingCardIds.includes(result.id)) {
            console.log("adding new card to existing group", result.id);
            await payload.update({
               collection: "card-groups",
               id: existingCard.docs[0].id,
               data: {
                  cards: [...existingCardIds, result.id],
               },
            });
         } else {
            console.log("card already exists in group, skipping", result.id);
         }
      } else {
         // Create new card group with new name

         const setName = result.expansion.name;

         const charactersUpTillFirstSpace = result.name.split("-")[0].trim();
         await payload.create({
            collection: "card-groups",
            data: {
               id: manaSlug(`${charactersUpTillFirstSpace}-${setName}`),
               name: `${charactersUpTillFirstSpace} - ${setName}`,
               cards: [result.id],
               icon: result.icon.id,
               slug: manaSlug(`${charactersUpTillFirstSpace}-${setName}`),
            },
         });
      }
   }

   console.log("Complete");
   process.exit(0);
};

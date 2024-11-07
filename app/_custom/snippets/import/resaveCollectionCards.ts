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
      depth: 0,
      sort: "cardType",
      limit: 10,
   });

   for (const result of results.docs) {
      const cardName = result.name.split("-")[0].trim() + result.expansion.name;

      const existingCard = await payload.find({
         collection: "card-groups",
         depth: 0,
         where: {
            name: {
               equals: cardName,
            },
         },
      });

      const commaSeparatedMoves = result.moves.join(",");

      const existingCardsArray = existingCard.docs[0]?.cards;

      // Find cards with matching moves
      const matchingCards = existingCardsArray.filter(
         (card) =>
            card.moves &&
            card.moves.toLowerCase() === commaSeparatedMoves.toLowerCase(),
      );
      // console.log(matchingCards, "matchingCards");

      if (matchingCards.length > 0) {
         console.log("adding existing card", existingCard.docs[0]?.name);
         // await payload.update({
         //    collection: "card-groups",
         //    id: existingCard.docs[0].id,
         //    data: {
         //       cards: [...existingCard.docs[0].cards, result.id],
         //    },
         // });
      } else {
         // Create new card group with new name

         const setName = result.expansion.name;
         console.log(result.name);
         // await payload.create({
         //    collection: "card-groups",
         //    data: {
         //       id: manaSlug(`${charactersUpTillFirstSpace}-${setName}`),
         //       name: `${charactersUpTillFirstSpace} - ${setName}`,
         //       cards: [result.id],
         //       icon: result.icon.id,
         //       slug: manaSlug(`${charactersUpTillFirstSpace}-${setName}`),
         //    },
         // });
      }
   }

   console.log("Complete");
   process.exit(0);
};

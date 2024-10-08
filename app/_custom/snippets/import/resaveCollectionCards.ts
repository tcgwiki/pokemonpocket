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
      depth: 2,
      sort: "rarity",
      limit: 500,
   });

   for (const result of results.docs) {
      const charactersUpTillFirstSpace = result.name.split("-")[0].trim();
      const exisintingCard = await payload.find({
         collection: "card-groups",
         depth: 0,
         where: {
            name: {
               equals: charactersUpTillFirstSpace,
            },
         },
      });
      console.log(exisintingCard);
      if (exisintingCard.totalDocs > 0) {
         console.log("adding existing card", exisintingCard.docs[0]?.name);
         await payload.update({
            collection: "card-groups",
            id: exisintingCard.docs[0].id,
            data: {
               cards: [...exisintingCard.docs[0].cards, result.id],
            },
         });
      } else
         await payload.create({
            collection: "card-groups",
            data: {
               id: manaSlug(charactersUpTillFirstSpace),
               name: charactersUpTillFirstSpace,
               cards: [result.id],
               icon: result.icon.id,
               slug: manaSlug(charactersUpTillFirstSpace),
            },
         });
   }

   console.log("Complete");
   process.exit(0);
};

import Payload from "payload";

import { manaSlug } from "../../../utils/url-slug";

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
      await payload.update({
         collection: "cards",
         id: result.id,
         data: {
            // name: `${result.name}${
            //    result.rarity.name ? ` [${result.rarity.name}]` : ""
            // } - ${result.set.name}`,
            // slug: manaSlug(
            //    `${result.name}${
            //       result.rarity.name ? `-${result.rarity.name}` : ""
            //    }-${result.set.name}`,
            // ),
            // icon: result.image.id,
         },
      });
   }

   console.log("Complete");
   process.exit(0);
};

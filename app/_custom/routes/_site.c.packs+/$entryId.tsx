import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { gql } from "graphql-request";

import type { Pack } from "~/db/payload-custom-types";
import { Entry } from "~/routes/_site+/c_+/$collectionId_.$entryId/components/Entry";
import { entryMeta } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/entryMeta";
import { fetchEntry } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/fetchEntry.server";

import { PacksMain } from "./components/Packs.Main";
import { PacksCards } from "./components/Packs.Cards";
export { entryMeta as meta };

export async function loader({
   context: { payload, user },
   params,
   request,
}: LoaderFunctionArgs) {
   const { entry } = await fetchEntry({
      isAuthOverride: true,
      payload,
      params,
      request,
      user,
      gql: {
         query: PACK_QUERY,
      },
   });

   return json({
      entry,
   });
}

const SECTIONS = {
   main: PacksMain,
   cards: PacksCards,
};

export default function EntryPage() {
   const { entry } = useLoaderData<typeof loader>();

   const pack = (entry?.data as { pack: Pack }).pack;

   return <Entry customComponents={SECTIONS} customData={pack} />;
}

const PACK_QUERY = gql`
   query ($entryId: String!) {
      pack: Pack(id: $entryId) {
         id
         slug
         name
         expansion {
            id
            slug
            logo {
               url
            }
         }
         cards {
            slot
            percent
            card {
               id
               name
               slug
               isEX
               retreatCost
               hp
               cardType
               icon {
                  url
               }
               pokemonType {
                  name
                  icon {
                     url
                  }
               }
               weaknessType {
                  name
                  icon {
                     url
                  }
               }
               rarity {
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

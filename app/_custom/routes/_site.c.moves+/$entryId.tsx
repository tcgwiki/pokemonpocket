import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { gql } from "graphql-request";

import { Entry } from "~/routes/_site+/c_+/$collectionId_.$entryId/components/Entry";
import { entryMeta } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/entryMeta";
import { fetchEntry } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/fetchEntry.server";
import { MovesMain } from "./components/Moves.Main";
import { MovesCards } from "./components/Moves.Cards";
import { Move } from "~/db/payload-custom-types";

export { entryMeta as meta };

export async function loader({
   context: { payload, user },
   params,
   request,
}: LoaderFunctionArgs) {
   const { entry } = await fetchEntry({
      payload,
      params,
      request,
      user,
      gql: {
         query: QUERY,
      },
   });
   return json({
      entry,
   });
}

const SECTIONS = {
   main: MovesMain,
   cards: MovesCards,
};

export default function EntryPage() {
   const { entry } = useLoaderData<typeof loader>();

   const move = (entry?.data as { move: Move })?.move;

   return <Entry customComponents={SECTIONS} customData={move} />;
}

const QUERY = gql`
   query ($entryId: String!) {
      move: Move(id: $entryId) {
         id
         slug
         name
         desc
         cards {
            name
            slug
            hp
            isEX
            cardType
            retreatCost
            rarity {
               name
               icon {
                  url
               }
            }
            weaknessType {
               id
               name
               icon {
                  url
               }
            }
            icon {
               url
            }
            pokemonType {
               id
               name
               icon {
                  url
               }
            }
         }
      }
   }
`;

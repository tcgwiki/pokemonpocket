import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { gql } from "graphql-request";

import type { Deck } from "~/db/payload-custom-types";
import { Entry } from "~/routes/_site+/c_+/$collectionId_.$entryId/components/Entry";
import { entryMeta } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/entryMeta";
import { fetchEntry } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/fetchEntry.server";

import { DecksMain } from "./components/Decks.Main";

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
   console.log(entry);
   return json({
      entry,
   });
}

const SECTIONS = {
   main: DecksMain,
};

export default function EntryPage() {
   const { entry } = useLoaderData<typeof loader>();

   //@ts-ignore
   const deck = entry?.data.deck as Deck;

   return <Entry customComponents={SECTIONS} customData={deck} />;
}

const QUERY = gql`
   query ($entryId: String!) {
      deck: Deck(id: $entryId) {
         id
         slug
         name
      }
   }
`;

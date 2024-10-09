import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { gql } from "graphql-request";

import type { Card, Set } from "~/db/payload-custom-types";
import { Entry } from "~/routes/_site+/c_+/$collectionId_.$entryId/components/Entry";
import { entryMeta } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/entryMeta";
import { fetchEntry } from "~/routes/_site+/c_+/$collectionId_.$entryId/utils/fetchEntry.server";

import { CardGroupsMain } from "./components/CardGroups.Main";

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
   main: CardGroupsMain,
};

export default function EntryPage() {
   const { entry } = useLoaderData<typeof loader>();

   return (
      <Entry customComponents={SECTIONS} customData={entry?.data as Card} />
   );
}

const QUERY = gql`
   query ($entryId: String!) {
      pokemon: CardGroups(id: $entryId) {
         id
         slug
         name
         icon {
            url
         }
      }
   }
`;
